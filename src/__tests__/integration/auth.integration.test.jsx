import { vi, describe, it, expect, beforeEach } from 'vitest'
vi.mock('@tanstack/react-query', async () => {
  return await vi.importActual('@tanstack/react-query')
})
vi.mock('@/lib/queryClient', async () => {
  const { QueryClient } = await vi.importActual('@tanstack/react-query')
  return {
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
    }),
  }
})

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext'
import { mkChain } from './testUtils'
import { supabase } from '@/lib/supabase'

function AuthTestComponent() {
  const { user, profile, loading, initialized, isAdmin, isAuthor, isBanned } = useAuth()
  if (loading && !initialized) return <div data-testid="loading">loading</div>
  return (
    <div>
      <div data-testid="initialized">{String(initialized)}</div>
      <div data-testid="user-id">{user?.id || 'null'}</div>
      <div data-testid="user-email">{user?.email || 'null'}</div>
      <div data-testid="profile-role">{profile?.role || 'null'}</div>
      <div data-testid="profile-name">{profile?.full_name || 'null'}</div>
      <div data-testid="is-admin">{String(isAdmin)}</div>
      <div data-testid="is-author">{String(isAuthor)}</div>
      <div data-testid="is-banned">{String(isBanned)}</div>
    </div>
  )
}

function createProfileChain(profileData) {
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: profileData, error: null }),
        single: () => Promise.resolve({ data: profileData, error: null }),
      }),
      order: () => ({
        range: () => Promise.resolve({ data: [], error: null, count: 0 }),
      }),
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: profileData, error: null }),
      }),
    }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
      select: () => ({
        single: () => Promise.resolve({ data: profileData, error: null }),
      }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    upsert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthTestComponent />
    </AuthProvider>
  )
}

describe('Auth Flow Integration', () => {
  let authCallback

  beforeEach(() => {
    vi.clearAllMocks()

    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    supabase.auth.onAuthStateChange.mockImplementation((cb) => {
      authCallback = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    supabase.from.mockImplementation(() => mkChain())
  })

  describe('Initial state - no session', () => {
    it('renders unauthenticated state when no session exists', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true')
      })
      expect(screen.getByTestId('user-id').textContent).toBe('null')
      expect(screen.getByTestId('profile-role').textContent).toBe('null')
      expect(screen.getByTestId('is-admin').textContent).toBe('false')
    })

    it('handles getSession error gracefully', async () => {
      supabase.auth.getSession.mockRejectedValue(new Error('Network error'))

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true')
      })
      expect(screen.getByTestId('user-id').textContent).toBe('null')
      expect(screen.getByTestId('is-admin').textContent).toBe('false')
    })
  })

  describe('Session restore on page load', () => {
    const mockSession = {
      user: { id: 'u1', email: 'test@test.com', user_metadata: { full_name: 'Test User' } },
    }
    const mockProfile = {
      id: 'u1',
      full_name: 'Test User',
      role: 'author',
      is_banned: false,
    }

    it('restores session and fetches profile', async () => { // @smoke
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') return createProfileChain(mockProfile)
        return mkChain()
      })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true')
      })
      expect(screen.getByTestId('user-id').textContent).toBe('u1')
      expect(screen.getByTestId('user-email').textContent).toBe('test@test.com')
      expect(screen.getByTestId('profile-role').textContent).toBe('author')
      expect(screen.getByTestId('profile-name').textContent).toBe('Test User')
      expect(screen.getByTestId('is-admin').textContent).toBe('false')
      expect(screen.getByTestId('is-author').textContent).toBe('true')
      expect(screen.getByTestId('is-banned').textContent).toBe('false')
    })

    it('sets isAdmin when profile has admin role', async () => {
      const adminProfile = { ...mockProfile, role: 'admin' }
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') return createProfileChain(adminProfile)
        return mkChain()
      })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('is-admin').textContent).toBe('true')
      })
      expect(screen.getByTestId('is-author').textContent).toBe('true')
    })

    it('sets isBanned when profile is banned', async () => {
      const bannedProfile = { ...mockProfile, is_banned: true }
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') return createProfileChain(bannedProfile)
        return mkChain()
      })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('is-banned').textContent).toBe('true')
      })
    })

    it('creates profile when none exists for the user', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
      const createdProfile = { id: 'u1', full_name: null, role: 'reader' }
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: createdProfile, error: null }),
              }),
            }),
            update: () => ({
              eq: () => Promise.resolve({ data: null, error: null }),
              select: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
            delete: () => ({
              eq: () => Promise.resolve({ data: null, error: null }),
            }),
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }
        }
        return mkChain()
      })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true')
      })
      expect(screen.getByTestId('user-id').textContent).toBe('u1')
      expect(screen.getByTestId('profile-role').textContent).toBe('reader')
    })
  })

  describe('Sign in and sign out flow', () => {
    const mockProfile = { id: 'u1', full_name: 'User', role: 'reader', is_banned: false }

    it('signs in user and updates auth state', async () => { // @smoke
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') return createProfileChain(mockProfile)
        return mkChain()
      })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true')
      })
      expect(screen.getByTestId('user-id').textContent).toBe('null')

      act(() => {
        authCallback('SIGNED_IN', {
          user: { id: 'u1', email: 'user@test.com' },
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('user-id').textContent).toBe('u1')
      })
      expect(screen.getByTestId('profile-role').textContent).toBe('reader')
    })

    it('signs out user and clears auth state', async () => { // @smoke
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'u1', email: 'user@test.com' } } },
        error: null,
      })
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') return createProfileChain(mockProfile)
        return mkChain()
      })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('user-id').textContent).toBe('u1')
      })

      act(() => {
        authCallback('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user-id').textContent).toBe('null')
      })
      expect(screen.getByTestId('profile-role').textContent).toBe('null')
    })
  })

  describe('Role and permission checks', () => {
    it('correctly identifies reader role', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'u1', email: 'reader@test.com' } } },
        error: null,
      })
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return createProfileChain({ id: 'u1', full_name: 'Reader', role: 'reader', is_banned: false })
        }
        return mkChain()
      })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('profile-role').textContent).toBe('reader')
      })
      expect(screen.getByTestId('is-admin').textContent).toBe('false')
      expect(screen.getByTestId('is-author').textContent).toBe('false')
    })
  })
})
