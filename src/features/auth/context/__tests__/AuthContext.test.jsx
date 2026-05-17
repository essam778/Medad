import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'

vi.mock('../../services/auth.service', () => ({
  AuthService: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  },
}))

vi.mock('../../services/profile.service', () => ({
  ProfileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    createProfile: vi.fn(),
  },
}))

function TestComponent() {
  const auth = useAuth()
  return (
    <div>
      <div data-testid="loading">{String(auth.loading)}</div>
      <div data-testid="initialized">{String(auth.initialized)}</div>
      <div data-testid="user">{auth.user?.id || 'no-user'}</div>
      <div data-testid="isAdmin">{String(auth.isAdmin)}</div>
      <div data-testid="isAuthor">{String(auth.isAuthor)}</div>
      <div data-testid="isBanned">{String(auth.isBanned)}</div>
      <button data-testid="btn-update" onClick={() => auth.updateProfile({ full_name: 'New Name' })}>
        Update
      </button>
      <button data-testid="btn-refresh" onClick={auth.refreshProfile}>
        Refresh
      </button>
    </div>
  )
}

describe('AuthProvider', () => { // @smoke
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children', () => {
    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    )
    expect(screen.getByText('child')).toBeInTheDocument()
  })

  it('should throw when useAuth used outside provider', () => {
    expect(() => render(<TestComponent />)).toThrow()
  })

  describe('session handling', () => {
    it('should set loading false when no session', async () => {
      const { AuthService } = await import('../../services/auth.service')
      AuthService.getSession.mockResolvedValue({ data: { session: null }, error: null })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true')
      })
      expect(screen.getByTestId('user').textContent).toBe('no-user')
    })

    it('should set user when session exists', async () => {
      const { AuthService } = await import('../../services/auth.service')
      const { ProfileService } = await import('../../services/profile.service')
      AuthService.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user1', email: 'test@test.com' } } },
        error: null,
      })
      ProfileService.getProfile.mockResolvedValue({
        data: { id: 'user1', role: 'admin', is_banned: false },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('user1')
      })
      expect(screen.getByTestId('isAdmin').textContent).toBe('true')
      expect(screen.getByTestId('isAuthor').textContent).toBe('true')
      expect(screen.getByTestId('isBanned').textContent).toBe('false')
    })

    it('should handle session error gracefully', async () => {
      const { AuthService } = await import('../../services/auth.service')
      AuthService.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('session error'),
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('no-user')
      })
    })
  })

  describe('profile handling', () => {
    it('should create profile when getProfile returns no data', async () => {
      const { AuthService } = await import('../../services/auth.service')
      const { ProfileService } = await import('../../services/profile.service')
      AuthService.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user1', email: 'test@test.com' } } },
        error: null,
      })
      ProfileService.getProfile.mockResolvedValue({ data: null, error: null })
      ProfileService.createProfile.mockResolvedValue({
        data: { id: 'user1', role: 'reader' },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(ProfileService.createProfile).toHaveBeenCalledWith({
          id: 'user1',
          email: 'test@test.com',
          role: 'reader',
        })
      })
    })

    it('should handle profile fetch error', async () => {
      const { AuthService } = await import('../../services/auth.service')
      const { ProfileService } = await import('../../services/profile.service')
      AuthService.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user1' } } },
        error: null,
      })
      ProfileService.getProfile.mockResolvedValue({
        data: null,
        error: new Error('profile error'),
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true')
      })
    })
  })

  describe('auth state change subscription', () => {
    it('should call onAuthStateChange on mount', async () => {
      const { AuthService } = await import('../../services/auth.service')
      AuthService.getSession.mockResolvedValue({ data: { session: null }, error: null })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(AuthService.onAuthStateChange).toHaveBeenCalled()
      })
    })

    it('should handle SIGNED_IN events', async () => {
      let authCallback
      const { AuthService } = await import('../../services/auth.service')
      const { ProfileService } = await import('../../services/profile.service')
      AuthService.getSession.mockResolvedValue({ data: { session: null }, error: null })
      AuthService.onAuthStateChange.mockImplementation((cb) => {
        authCallback = cb
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })
      ProfileService.getProfile.mockResolvedValue({
        data: { id: 'user1', role: 'reader' },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() =>
        expect(screen.getByTestId('initialized').textContent).toBe('true')
      )

      act(() => {
        authCallback('SIGNED_IN', { user: { id: 'user1', email: 'test@test.com' } })
      })

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('user1')
      })
    })

    it('should handle SIGNED_OUT events', async () => {
      let authCallback
      const { AuthService } = await import('../../services/auth.service')
      const { ProfileService } = await import('../../services/profile.service')
      AuthService.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user1' } } },
        error: null,
      })
      ProfileService.getProfile.mockResolvedValue({
        data: { id: 'user1', role: 'reader' },
        error: null,
      })
      AuthService.onAuthStateChange.mockImplementation((cb) => {
        authCallback = cb
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('user1'))

      act(() => {
        authCallback('SIGNED_OUT', { user: null })
      })

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('no-user')
      })
    })
  })

  describe('author roles', () => {
    it('should detect author role', async () => {
      const { AuthService } = await import('../../services/auth.service')
      const { ProfileService } = await import('../../services/profile.service')
      AuthService.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user1' } } },
        error: null,
      })
      ProfileService.getProfile.mockResolvedValue({
        data: { id: 'user1', role: 'author', is_banned: false },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isAuthor').textContent).toBe('true')
        expect(screen.getByTestId('isAdmin').textContent).toBe('false')
      })
    })

    it('should detect banned user', async () => {
      const { AuthService } = await import('../../services/auth.service')
      const { ProfileService } = await import('../../services/profile.service')
      AuthService.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user1' } } },
        error: null,
      })
      ProfileService.getProfile.mockResolvedValue({
        data: { id: 'user1', role: 'reader', is_banned: true },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isBanned').textContent).toBe('true')
      })
    })
  })

  describe('updateProfile', () => {
    it('should update profile and merge with existing', async () => {
      const { AuthService } = await import('../../services/auth.service')
      const { ProfileService } = await import('../../services/profile.service')
      AuthService.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user1' } } },
        error: null,
      })
      ProfileService.getProfile.mockResolvedValue({
        data: { id: 'user1', full_name: 'Old', role: 'reader' },
        error: null,
      })
      ProfileService.updateProfile.mockResolvedValue({ error: null })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => expect(screen.getByTestId('initialized').textContent).toBe('true'))

      fireEvent.click(screen.getByTestId('btn-update'))

      await waitFor(() => {
        expect(ProfileService.updateProfile).toHaveBeenCalledWith('user1', { full_name: 'New Name' })
      })
    })

    it('should return error when no user logged in', async () => {
      const { AuthService } = await import('../../services/auth.service')
      AuthService.getSession.mockResolvedValue({ data: { session: null }, error: null })

      let updateResult
      function CaptureComponent() {
        const auth = useAuth()
        updateResult = auth.updateProfile
        return null
      }

      render(
        <AuthProvider>
          <CaptureComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        const result = updateResult({ full_name: 'New' })
        expect(result).resolves.toEqual({ error: new Error('No user logged in') })
      })
    })
  })
})
