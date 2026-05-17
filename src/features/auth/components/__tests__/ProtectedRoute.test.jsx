import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('@/components/shared/LoadingSpinner', () => ({
  default: ({ fullPage }) => <div data-testid="loading-spinner" data-fullpage={fullPage} />,
}))

const mockUseAuth = vi.fn()
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Wraps ProtectedRoute in a MemoryRouter with a fake /login and / fallback
 * so Navigate redirects can be asserted via URL.
 */
const renderRoute = (authState, routeProps = {}) => {
  mockUseAuth.mockReturnValue(authState)

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute {...routeProps}>
              <div data-testid="protected-content">محتوى محمي</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">صفحة الدخول</div>} />
        <Route path="/" element={<div data-testid="home-page">الرئيسية</div>} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page">لوحة التحكم</div>} />
      </Routes>
    </MemoryRouter>
  )
}

const loading    = { user: null, profile: null, loading: true,  initialized: false }
const notInit    = { user: null, profile: null, loading: false, initialized: false }
const guest      = { user: null, profile: null, loading: false, initialized: true }
const reader     = { user: { id: 'u1' }, profile: { role: 'reader' },  loading: false, initialized: true }
const author     = { user: { id: 'u2' }, profile: { role: 'author' },  loading: false, initialized: true }
const admin      = { user: { id: 'u3' }, profile: { role: 'admin' },   loading: false, initialized: true }

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('ProtectedRoute', () => {
  beforeEach(() => mockUseAuth.mockReset())

  // ── Loading state ────────────────────────────────────────────────────────────
  describe('Loading / initializing', () => {
    it('shows LoadingSpinner while loading=true', () => {
      renderRoute(loading)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('shows LoadingSpinner while initialized=false', () => {
      renderRoute(notInit)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('does not render protected content while loading', () => {
      renderRoute(loading)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  // ── Unauthenticated guest ─────────────────────────────────────────────────
  describe('Guest (no user)', () => {
    it('redirects to /login by default', () => {
      renderRoute(guest)
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('redirects to custom redirectTo path', () => {
      renderRoute(guest, { redirectTo: '/dashboard' })
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })
  })

  // ── Authenticated reader ──────────────────────────────────────────────────
  describe('Authenticated reader (basic access)', () => {
    it('renders children for logged-in user with no role requirements', () => {
      renderRoute(reader)
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('redirects reader away from requireAdmin route', () => {
      renderRoute(reader, { requireAdmin: true })
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    it('redirects reader when requiredRole is "author"', () => {
      renderRoute(reader, { requiredRole: 'author' })
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })
  })

  // ── Author access ─────────────────────────────────────────────────────────
  describe('Author role', () => {
    it('allows author when allowAuthor=true on requireAdmin route', () => {
      renderRoute(author, { requireAdmin: true, allowAuthor: true })
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('blocks author when allowAuthor=false on requireAdmin route', () => {
      renderRoute(author, { requireAdmin: true, allowAuthor: false })
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    it('allows author when requiredRole="author"', () => {
      renderRoute(author, { requiredRole: 'author' })
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })

  // ── Admin access ──────────────────────────────────────────────────────────
  describe('Admin role', () => {
    it('allows admin on requireAdmin route', () => {
      renderRoute(admin, { requireAdmin: true })
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('allows admin even when requiredRole is "author" (admin bypasses)', () => {
      renderRoute(admin, { requiredRole: 'author' })
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('allows admin on basic protected route', () => {
      renderRoute(admin)
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })
})
