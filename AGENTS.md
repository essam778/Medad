# Midad (مداد) — Agent Guide

Arabic blogging platform. React 18 + Vite + Supabase + Zustand + Tailwind.

## Commands

```bash
npm run dev        # dev server at http://127.0.0.1:5173
npm run build      # vite build (minify: esbuild, target es2020)
npm run preview    # preview production build
npm run test:e2e   # Playwright (tests/e2e/)
```

## Required env vars

Create `.env.local` from `.env` template (never commit — tracked keys already leaked):

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_GEMINI_API_KEY=<key>              # used client-side (builds into bundle)
VITE_SENTRY_DSN=                       # optional
VITE_SENTRY_TRACES_SAMPLE_RATE=0.2     # optional
```

## Architecture

- **No backend API** — browser talks directly to Supabase via anon key. All auth is RLS-dependent.
- **Feature-based** structure under `src/features/{auth,posts}/`, each with `{components,services,hooks}`.
- **Pages** in `src/pages/{public,admin,dashboard}/`, loaded via `React.lazy`.
- **State**: Zustand stores (`src/stores/`) for UI/notifications/settings; React Query (`@tanstack/react-query`) for server state.
- **Routing**: React Router v6 with future flags (`v7_startTransition`, `v7_relativeSplatPath`). Studio route at `/studio/*` (old `/admin/*` redirects).
- **Auth**: Supabase PKCE flow, session in localStorage (`sb-auth-token`). `ProtectedRoute` component wraps `/studio` — **client-side only**, real auth depends on RLS.
- **Editor**: Tiptap with CharacterCount, Image, Link, YouTube extensions. DOMPurify sanitizes on save.
- **Vercel** deployment: full CSP + security headers in `vercel.json`. SPA rewrite to `index.html`. `www` redirects to apex. Android via Capacitor.
- **Supabase Edge Function**: `youtube-summarize` — unauthenticated CORS `*`, uses server-side `GEMINI_API_KEY`.

## Style conventions

- Arabic-first UI: `dir="rtl"`, `lang="ar"`, `Intl.DateTimeFormat('ar-EG')` throughout.
- Dark mode via `darkMode: 'class'` on `<html>`. CSS custom properties for theming.
- Component exports use default. Hooks use named exports. Services are objects not classes.
- File names: `PascalCase.jsx` for components, `camelCase.js` for services/hooks/stores.
- Path aliases: `@/` → `src/`, `@features/` → `src/features/`, `@auth/`, `@posts/`.

## Testing

- Single smoke test (`tests/e2e/smoke.spec.js`): checks homepage + login render.
- Playwright auto-starts dev server. `baseURL` defaults to `http://127.0.0.1:5173`.
- No unit tests, no Vitest config.

## SQL migrations

Run manually via Supabase Dashboard SQL Editor. Order:

1. `supabase/full_upgrade.sql` (notifications, analytics views, triggers)
2. `supabase/full_features_upgrade.sql` (collections, follows, site_settings, RLS fixes)
3. `supabase/notifications_rls_fix.sql` (patch for notification insert policy)

`schema.sql` is empty — all schema is in the upgrade files.
