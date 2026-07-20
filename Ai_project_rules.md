# AI Project Rules — Production-Grade Next.js / React + Supabase

> Give this file to any AI coding assistant (Claude, Cursor, Copilot, etc.) as its
> operating instructions for this project. The AI must follow every rule below
> without exception. If a request conflicts with a rule, the AI should flag the
> conflict instead of silently violating the rule.

---

## 0. Prime Directive

Write code as a senior software engineer would: intentional, consistent,
secure by default, and boring in the best sense — no clever hacks, no
"it works on my machine," no code that only the AI that wrote it can read.
A human reviewer with 10 years of experience should look at this codebase
and conclude a professional team built it, not that it was generated
carelessly by an AI.

Never take shortcuts that trade correctness or security for speed of
delivery. If a shortcut is unavoidable, mark it clearly with
`// TODO(security)` or `// TODO(tech-debt)` and explain why.

---

## 1. Tech Stack & Baseline Setup

- **Framework:** Next.js (App Router), TypeScript in `strict` mode. No `any`
  unless truly unavoidable, and if used, comment why.
- **Database/Backend:** Supabase (Postgres + Auth + Storage + Edge Functions).
- **Styling:** Tailwind CSS with a defined design-token system (see §6).
- **Validation:** Zod (or equivalent) for every external input — forms, API
  routes, Supabase function payloads.
- **State/data fetching:** React Server Components by default; client
  components only when interactivity requires it. Use `@tanstack/react-query`
  or SWR for client-side data fetching where needed.
- **Linting/formatting:** ESLint + Prettier configured and passing with zero
  warnings before any code is considered done.
- **Environment variables:** Never hardcode secrets. All secrets go through
  `.env.local` (gitignored) and `NEXT_PUBLIC_` prefix is used **only** for
  values that are genuinely safe to expose to the browser (e.g. the Supabase
  anon key, never the service role key).

---

## 2. Project Structure (no spaghetti, no dumping everything in one file)

```
/src
  /app                  → routes only (App Router), thin — no business logic here
  /components
    /ui                 → generic, reusable, dumb components (Button, Input, Card...)
    /features           → feature-specific components (e.g. /features/billing)
  /lib
    /supabase           → supabase client factories (server.ts, client.ts, admin.ts)
    /validators          → zod schemas
    /utils               → pure helper functions, no side effects
  /hooks                → custom React hooks
  /services             → business logic / data-access layer (talks to Supabase)
  /types                → shared TypeScript types & generated Supabase types
  /config               → app constants, feature flags
/supabase
  /migrations           → every schema change as a numbered SQL migration
  /seed.sql             → local dev seed data
```

**Rules:**

- Route files (`page.tsx`, `route.ts`) must stay thin — they call a service
  function, they don't contain raw SQL or business rules.
- No component file over ~250 lines. If it grows past that, split it.
- No direct `supabase.from(...)` calls scattered across UI components — all
  DB access goes through `/services`, so there is exactly one place per
  table/feature that talks to the database.
- Shared logic used in more than one place must be extracted, never
  copy-pasted.

---

## 3. Supabase Database Design

- Every table has: `id uuid primary key default gen_random_uuid()`,
  `created_at timestamptz default now()`, and `updated_at timestamptz`
  maintained by a trigger (`moddatetime` or a custom trigger function) —
  never updated manually from the client.
- Normalize the schema (3NF) unless there's a deliberate, documented reason
  to denormalize for performance.
- Foreign keys are always defined with explicit `on delete` behavior
  (`cascade`, `restrict`, or `set null`) — never left to default ambiguity.
- Every column that will be filtered/joined on frequently gets an index.
  Add indexes explicitly in migrations, don't rely on guesswork.
- All schema changes are version-controlled SQL migrations under
  `/supabase/migrations`, never made by hand in the Supabase dashboard for
  anything beyond quick local experiments.
- Use Postgres `enum` types or `check` constraints for status/type fields
  instead of free-text strings.
- Sensitive columns (tokens, secrets) are never stored in plaintext if they
  don't need to be — use hashing or Supabase Vault where appropriate.

---

## 4. Row Level Security (RLS) — Non-Negotiable

- **RLS is enabled on every single table**, no exceptions, from the moment
  the table is created — including internal/admin tables.
  ```sql
  alter table public.your_table enable row level security;
  ```
- **Default posture is deny-all.** No table is left with RLS enabled but no
  policies (that also blocks everyone, but be explicit about intent) —
  every table must have deliberate, named policies for each operation it
  needs (`select`, `insert`, `update`, `delete`).
- Never use a single blanket `using (true)` policy "to make it work" — that
  defeats the purpose of RLS. Every policy must reference `auth.uid()` or a
  proper ownership/role check.
- Standard ownership pattern:

  ```sql
  create policy "Users can view their own rows"
    on public.your_table for select
    using (auth.uid() = user_id);

  create policy "Users can insert their own rows"
    on public.your_table for insert
    with check (auth.uid() = user_id);

  create policy "Users can update their own rows"
    on public.your_table for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  ```

- For role-based access (admin/staff), use a `profiles` or `user_roles`
  table plus a `security definer` helper function — never trust a role
  claim sent from the client.
  ```sql
  create or replace function public.is_admin()
  returns boolean
  language sql security definer stable
  as $$
    select exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    );
  $$;
  ```
- Any table exposed through a public API/landing-page form (e.g. contact
  submissions) must still have RLS — typically `insert` allowed for
  `anon`/`authenticated` with strict `with check` validation, and `select`
  restricted to admins only.
- The **service role key** is never used in browser/client code — only in
  trusted server contexts (server actions, route handlers, edge functions)
  where RLS is intentionally bypassed for a specific, narrow, audited reason.
- Test every policy: for each table, explicitly verify what happens when
  (a) an anonymous user, (b) an authenticated non-owner, and (c) the owner
  try each operation. Don't assume — write it down or test it in the SQL
  editor with `set role`.

---

## 5. Application-Level Security

- Validate and sanitize **every** input on the server side with Zod, even if
  it's already validated client-side. Client validation is UX only, never
  security.
- Use Supabase Auth's built-in flows (email/password, magic link, OAuth) —
  don't roll custom auth/session logic.
- Rate-limit sensitive endpoints (auth, forms, anything that writes data)
  using Supabase Edge Functions + a rate-limiting mechanism, or middleware.
- Escape/parameterize everything — never build SQL by string concatenation;
  always use the Supabase client or parameterized queries.
- Set proper CORS and restrict Supabase project API settings to known
  origins in production.
- Never log secrets, tokens, or full user objects to the console in
  production code.
- Add security headers via `next.config.js` (CSP, `X-Frame-Options`,
  `Referrer-Policy`, etc.).

---

## 6. UI/UX — Must Look Professionally Designed

The AI must actively avoid generic "AI-app look": default gray-on-white
cards, no visual hierarchy, random pastel gradients, inconsistent spacing.

- Define a small design-token system first (in `tailwind.config.ts` or CSS
  variables): a primary/neutral color scale, 1–2 fonts (one for
  headings, one for body — chosen deliberately, not the default), a spacing
  scale, and consistent border-radius/shadow values. Reuse them everywhere.
- Establish real visual hierarchy: clear heading sizes, generous whitespace,
  a consistent grid/max-width container, not everything centered and boxed.
- Buttons, inputs, and cards come from a small shared `/components/ui`
  library so every screen looks consistent — never re-styled ad hoc per page.
- Every interactive element has hover, focus, active, disabled, and loading
  states. No dead-looking buttons.
- Forms show real inline validation errors (from the Zod schema), loading
  states on submit, and success/error feedback — not silent failures.
- Responsive by default: test/design for mobile, tablet, and desktop, not
  just desktop.
- Avoid: default browser alert()/confirm(), unstyled native selects/date
  pickers if the rest of the UI is styled, placeholder Lorem Ipsum left in
  production code, low-contrast text.

---

## 7. Code Quality Checklist (a feature isn't "done" until all of these pass)

- [ ] TypeScript compiles with no errors, no `any` left unexplained
- [ ] ESLint/Prettier clean
- [ ] All new tables have RLS enabled + policies, and the policies were
      manually reasoned through for anon/authenticated/owner/admin cases
- [ ] All external input validated with Zod on the server
- [ ] No business logic inside route/page files — it lives in `/services`
- [ ] No duplicated logic — shared code extracted
- [ ] Errors are caught and shown to the user meaningfully, not swallowed
      or left as an unhandled promise rejection
- [ ] Loading and empty states are designed, not left blank
- [ ] No secrets or service-role key present in any client-side bundle
- [ ] Migration file added for any schema change, and it's reversible or
      clearly documented if not

---

## 8. How the AI Should Behave While Building

- Before writing code, briefly state the plan: which tables/files will be
  touched and why.
- When creating a new table, always output it as a migration file with RLS
  enabled and policies included in the same migration — never as a
  follow-up "I'll add security later."
- When unsure about a security-sensitive decision (who should access what),
  ask rather than defaulting to the most permissive option.
- Prefer small, reviewable changes over one giant file dump.
- Explain non-obvious decisions briefly in code comments, especially around
  RLS policies and any place security logic lives.
