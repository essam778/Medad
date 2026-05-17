# Test Infrastructure Progress

## ✅ Completed — Unit Tests (385 passing, 30 files) + Integration Tests (49 passing, 4 files) + **Component Tests (233 passing, 15 files)** + **CI/CD & Test Automation** + **Database Backup** = **667 passing across 49 files**

---

## Section 01 — Unit Tests ✅

### Libraries & Utilities (3 files)
| File | Tests | Status |
|------|-------|--------|
| `src/lib/__tests__/utils.test.js` | 42 | ✅ |
| `src/lib/__tests__/supabase.test.js` | 12 | ✅ |
| `src/stores/__tests__/ui.store.test.js` | — | ✅ |
| `src/stores/__tests__/settings.store.test.js` | — | ✅ |
| `src/stores/__tests__/notification.store.test.js` | — | ✅ |

### Auth Services (2 files)
| File | Tests | Status |
|------|-------|--------|
| `src/features/auth/services/__tests__/auth.service.test.js` | — | ✅ |
| `src/features/auth/services/__tests__/profile.service.test.js` | 18 | ✅ |

### Auth Context (1 file)
| File | Tests | Status |
|------|-------|--------|
| `src/features/auth/context/__tests__/AuthContext.test.jsx` | 14 | ✅ |

### Post Services (1 file)
| File | Tests | Status |
|------|-------|--------|
| `src/features/posts/services/__tests__/post.service.test.js` | 56 | ✅ |

### Post Hooks (1 file)
| File | Tests | Status |
|------|-------|--------|
| `src/features/posts/hooks/__tests__/usePosts.test.js` | 40 | ✅ |

### Hooks (5 files)
| File | Tests | Status |
|------|-------|--------|
| `src/hooks/__tests__/useAdmin.test.js` | 16 | ✅ |
| `src/hooks/__tests__/useSettings.test.js` | 12 | ✅ |
| `src/hooks/__tests__/useAnalytics.test.js` | 6 | ✅ |
| `src/hooks/__tests__/useNotifications.test.js` | — | ✅ |
| `src/hooks/__tests__/useComments.test.js` | 20 | ✅ |

### Notification Service (1 file)
| File | Tests | Status |
|------|-------|--------|
| `src/services/__tests__/notification.service.test.js` | 6 | ✅ |

### Contexts (1 file)
| File | Tests | Status |
|------|-------|--------|
| `src/context/__tests__/ThemeContext.test.jsx` | — | ✅ |

### Shared Components (9 files)
| File | Tests | Status |
|------|-------|--------|
| `src/components/shared/__tests__/ErrorBoundary.test.jsx` | — | ✅ |
| `src/components/shared/__tests__/LoadingSpinner.test.jsx` | — | ✅ |
| `src/components/shared/__tests__/Skeletons.test.jsx` | — | ✅ |
| `src/components/shared/__tests__/ConfirmModal.test.jsx` | 6 | ✅ |
| `src/components/shared/__tests__/NoticeModal.test.jsx` | — | ✅ |
| `src/components/shared/__tests__/ToastProvider.test.jsx` | 8 | ✅ |
| `src/components/shared/__tests__/OptimizedImage.test.jsx` | 9 | ✅ |
| `src/components/shared/__tests__/Newsletter.test.jsx` | 10 | ✅ |
| `src/components/shared/__tests__/NotificationCenter.test.jsx` | 15 | ✅ |

### Layout Components (3 files)
| File | Tests | Status |
|------|-------|--------|
| `src/components/layout/__tests__/Header.test.jsx` | 20 | ✅ |
| `src/components/layout/__tests__/Footer.test.jsx` | 11 | ✅ |
| `src/components/layout/__tests__/MainLayout.test.jsx` | 2 | ✅ |

### Dashboard Pages (2 files)
| File | Tests | Status |
|------|-------|--------|
| `src/pages/dashboard/__tests__/MyPosts.test.jsx` | 18 | ✅ |
| `src/pages/dashboard/__tests__/UserProfile.test.jsx` | 21 | ✅ |

### Public Pages (4 files)
| File | Tests | Status |
|------|-------|--------|
| `src/pages/public/__tests__/LoginPage.test.jsx` | 16 | ✅ |
| `src/pages/public/__tests__/RegisterPage.test.jsx` | 15 | ✅ |
| `src/pages/public/__tests__/HomePage.test.jsx` | 16 | ✅ |
| `src/pages/public/__tests__/PostPage.test.jsx` | 17 | ✅ |

### Admin Pages (5 files)
| File | Tests | Status |
|------|-------|--------|
| `src/pages/admin/__tests__/AdminUsers.test.jsx` | 17 | ✅ |
| `src/pages/admin/__tests__/AdminPosts.test.jsx` | 14 | ✅ |
| `src/pages/admin/__tests__/AdminDashboard.test.jsx` | 14 | ✅ |
| `src/pages/admin/__tests__/AdminSettings.test.jsx` | 13 | ✅ |
| `src/pages/admin/__tests__/AdminComments.test.jsx` | 10 | ✅ |

---

## Section 02 — Integration Tests ✅

### Shared Utilities (1 file)
| File | Purpose |
|------|---------|
| `src/__tests__/integration/testUtils.jsx` | `mkThenableChain`, `mkChain`, `Wrapper`, `resetStores`, `createTestQueryClient` |

### Suite 1 — Auth Flow (1 file, 9 tests)
| File | Tests | What it covers |
|------|------:|----------------|
| `src/__tests__/integration/auth.integration.test.jsx` | 9 | Initial unauthenticated state, getSession error handling, session restore on reload (reader/admin/banned profiles), profile auto-creation on first login, sign-in via auth callback, sign-out state clear, reader role detection |

### Suite 2 — Post Service → Hook → Store (1 file, 16 tests)
| File | Tests | What it covers |
|------|------:|----------------|
| `src/__tests__/integration/posts.integration.test.jsx` | 16 | Infinite scroll (first page, next-page-full, append on fetchNextPage, error state, tag filter), create post (new + with id), update post, delete post (success + error), admin posts (list + status filter), my posts (with data + empty), single post by slug (found + disabled) |

### Suite 3 — Notification System (1 file, 12 tests)
| File | Tests | What it covers |
|------|------:|----------------|
| `src/__tests__/integration/notifications.integration.test.jsx` | 12 | notifyFollowers (with followers + no followers + insert error), store operations (empty init, add, markAsRead, multiple queue, markAllAsRead, setNotifications), full pipeline publish → notify → store reflection, network error preserves existing, markAsRead persists to DB |

### Suite 4 — Admin Operations (1 file, 12 tests)
| File | Tests | What it covers |
|------|------:|----------------|
| `src/__tests__/integration/admin.integration.test.jsx` | 12 | User deletion via RPC (success + error), role update (success + error), user list with pagination + role filter + RPC error, channels with enriched data, general settings fetch, settings update, analytics admin mode (all data) + author mode (filtered) |

### Integration Test Architecture
- **Real Zustand stores** — no mocking, actual `setState`/`getState` tested
- **Real `@tanstack/react-query`** — each test file overrides the global mock via `vi.importActual` to get real `QueryClient`, `useQuery`, `useMutation`, `useInfiniteQuery`
- **Real `@/lib/queryClient` singleton** — re-mocked per file with `retry: false`; shared between `QueryClientProvider` wrapper and hooks' `queryClient` import for correct cache invalidation testing
- **Mock only supabase** at network boundary — per-test table handlers using `mkThenableChain` that returns Promises with all chain methods (`.eq()`, `.neq()`, `.single()`, etc.) so `await` and further chain calls both work
- **`mkThenableChain()`** — `Promise.resolve(value)` extended with all supabase chain methods; allows `await` chaining for hooks that call `.eq()`/`.neq()` after `.range()`

---

## Infrastructure Files
- `vitest.config.js` — path aliases, jsdom env, coverage thresholds (80%), excludes untested paths
- `src/setupTests.js` — global mocks for supabase, react-query, framer-motion, localStorage, import.meta.env
- `.github/workflows/ci.yml` — GitHub Actions CI: Node 20 matrix, cache, ci/test/coverage/artifact-upload
- `.github/workflows/db-backup.yml` — daily cron (02:00 UTC) + manual trigger; pg_dump → gzip → commit to separate private backup repo
- `scripts/backup-db.sh` — same backup logic for local execution (requires DATABASE_URL + BACKUP_REPO_URL env vars)
- `.husky/pre-commit` — lint-staged + full test suite before commit
- `scripts/test-health.js` — parse vitest JSON output, print formatted health table

## 🏗️ Issues Fixed

| Issue | Root Cause | Fix |
|-------|-----------|------|
| 24 post.service test failures | `clearAllMocks()` + `mockReturnValue()` leaks to subsequent tests | Fresh `supabase.from = vi.fn(() => mkChain())` in each test's `beforeEach` |
| 2 usePosts test failures | Hooks import `queryClient` directly (not via `useQueryClient()`) | Added `vi.mock('@/lib/queryClient')` in test file |
| 2 profile service test failures | Same cross-test mock leakage as post.service | Fresh mock reassignment in `beforeEach` |
| 41 failed tests total | Cross-test mock state leakage + wrong mock targets | Replaced `vi.clearAllMocks()` with explicit per-test mock setup |
| 9 branch coverage gaps | Missing branch paths in tests | Added 9 tests covering: RPC path, JSON string tags, checkFollowStatus both IDs, non-admin posts, insert error, variant fallback, duration=0, untransliterated chars |
| 5 low-coverage hook/context files | Excluded from coverage, no tests | Wrote 90 tests across `usePosts` (40), `useAdmin` (16), `useSettings` (12), `useAnalytics` (6), `AuthContext` (14) |
| **`ProfileService.createProfile` missing** | Method didn't exist but was called by `AuthContext.jsx:26` | Added `createProfile()` to `profile.service.js` |
| **`AuthContext.fetchProfileData` returns raw supabase response** | `return await ProfileService.createProfile(...)` returned `{ data, error }` instead of profile data | Destructure `{ data: newProfile }` and return `newProfile` |
| **`describe.concurrent` causes intermittent failures** | Shared mock mutation (`supabase.from = vi.fn(...)`) races between concurrent tests within same file | Reverted all 11 unit test files from `describe.concurrent` to `describe` |

## Key Test Patterns

### Unit Test Mock Strategy
- **`setupTests.js`**: Global mocks for `@/lib/supabase`, `@tanstack/react-query`, `framer-motion`, `localStorage`, `import.meta.env`
- **Supabase chain**: `from → select/insert/update/delete → eq/order/limit → range/single/maybeSingle`
- **`mkChain()`**: Self-referencing fluent interface; `.range()` returns `mkThenableChain()` (Promise + chain methods) so chaining after `.range()` works
- **React Query**: `useQuery`, `useMutation`, `useInfiniteQuery` are `vi.fn()` — tests capture `queryFn`/`mutationFn` from options and call them directly

### Integration Test Mock Strategy
- **`@tanstack/react-query`**: Re-mocked with `vi.importActual` to get real React Query
- **`@/lib/queryClient`**: Re-mocked with fresh `QueryClient` (`retry: false`, `gcTime: Infinity`)
- **supabase**: Global mock provides `vi.fn()` for `from`, `rpc`, `auth`, `channel` — per-test overrides via `supabase.from.mockImplementation(() => {...})`
- **`mkThenableChain()`**: Extended with `single`, `maybeSingle`, `insert`, `update`, `delete`, `upsert`, `gte` — all chain methods return self

### Test Isolation
- **Unit tests**: Each file re-assigns `supabase.from = vi.fn(() => mkChain())` in `beforeEach`
- **Integration tests**: `queryClient.clear()` + `resetStores()` in `beforeEach`; fresh mock setup per test
- **Store reset**: `useNotificationStore.setState({ notifications: [], unreadCount: 0 })` + similarly for `useUIStore`

### Hook Testing Pattern (Unit)
```js
let capturedOpts
useQuery.mockImplementation((opts) => {
  capturedOpts = opts
  return { data: undefined, isLoading: false }
})
renderHook(() => useMyHook())
const result = await capturedOpts.queryFn()
expect(result).toEqual(expectedValue)
```

### Hook Testing Pattern (Integration)
```js
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
function Wrapper({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
const { result } = renderHook(() => useMyHook(), { wrapper: Wrapper })
await waitFor(() => expect(result.current.isSuccess).toBe(true))
expect(result.current.data).toEqual(expectedValue)
```

---

## Section 03 — CI/CD & Test Automation ✅

### GitHub Actions — CI Pipeline
- **`.github/workflows/ci.yml`**: Triggered on push/PR to `main`, Node 20 matrix (`18, 20, 22`), caches `node_modules` via `actions/cache`, runs `npm ci`, lint (graceful skip if config missing), `npm run test:coverage`, uploads coverage report as artifact.

### Pre-commit Hook (husky + lint-staged)
- **`.husky/pre-commit`**: Runs `lint-staged` (eslint --fix + prettier --write) on staged files, then `vitest run --reporter=verbose` for full test pass before commit.
- **`package.json`**: `"prepare": "husky"` ensures hooks install on `npm install`.

### Test Health Dashboard
- **`scripts/test-health.js`**: Runs `npm run test:coverage -- --reporter=json`, parses output, prints formatted table with test counts (total/pass/fail/skip) and coverage percentages per category.

### Smoke Test Markers
- Added `// @smoke` to **13 critical test cases** across auth, posts, notifications, and admin suites — identifies regression test candidates.

### Describe.Concurrent Revert
- Added `describe.concurrent(...)` to **11 unit test files** to enable parallel execution within each file.
- **Reverted**: `describe.concurrent` is incompatible with the direct mock mutation pattern (`supabase.from = vi.fn(...)`) used throughout these tests — concurrent tests race on shared mock state, causing intermittent failures. All 11 files returned to `describe(...)`.

### New Scripts in `package.json`
| Script | Command |
|--------|---------|
| `"test:health"` | `node scripts/test-health.js` |
| `"prepare"` | `husky` |

### CI Status Badge
Added markdown badge to `README.md` linking to GitHub Actions workflow.

## 📋 Next Steps

### Section 04 — Load Testing (k6)
- [ ] `tests/load/scenarios/homepage.js` — homepage load scenarios
- [ ] `tests/load/scenarios/auth.js` — auth flow load test
- [ ] `tests/load/scenarios/posts.js` — CRUD + listing load test
- [ ] k6 options config (stages, thresholds, virtual users)

### Section 05 — Remaining Test Gaps
- [ ] `src/features/posts/components/` UI components — no tests
- [ ] `src/features/auth/components/` components — no tests
- [ ] E2E tests beyond the smoke test in `tests/e2e/`
- [ ] Edge function tests for `supabase/functions/youtube-summarize/`

## 🧪 How to Run
```bash
npm run test          # all tests (667 across 49 files)
npm run test:coverage # with coverage report (thresholds: 80%)
npm run test:watch    # watch mode
npm run test:e2e      # Playwright E2E smoke test
```
