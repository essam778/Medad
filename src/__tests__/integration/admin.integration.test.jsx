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
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { useAdminUsers, useAdminChannels, useUpdateUserRole, useDeleteUser } from '@/hooks/useAdmin'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import { useAnalytics } from '@/hooks/useAnalytics'
import { mkChain, mkThenableChain, resetStores } from './testUtils'

const t = (val) => mkThenableChain(val)

function Wrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

function renderWithQuery(useHook, ...args) {
  return renderHook(() => useHook(...args), { wrapper: Wrapper })
}

describe('Admin Operations Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    resetStores()
  })

  describe('Admin user deletion', () => {
    it('useDeleteUser removes user via RPC', async () => { // @smoke
      let rpcCalled = false
      supabase.rpc.mockImplementation((fnName, params) => {
        if (fnName === 'delete_user_by_admin') {
          rpcCalled = true
          expect(params.target_user_id).toBe('u2')
          return Promise.resolve({ data: { success: true }, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      const { result } = renderWithQuery(useDeleteUser)
      act(() => { result.current.mutate('u2') })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(rpcCalled).toBe(true)
    })

    it('handles admin RPC error', async () => {
      supabase.rpc.mockImplementation(() => Promise.reject(new Error('Forbidden')))

      const { result } = renderWithQuery(useDeleteUser)
      act(() => { result.current.mutate('u2') })
      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('Admin role change effect', () => {
    it('useUpdateUserRole updates role and invalidates cache', async () => { // @smoke
      let updateCalled = false
      const updatedProfile = { id: 'u2', role: 'author', updated_at: new Date().toISOString() }

      supabase.from.mockImplementation(() => ({
        update: () => {
          updateCalled = true
          return t({ data: updatedProfile, error: null })
        },
        select: () => t({ data: [updatedProfile], error: null, count: 1 }),
        eq: () => t({ data: [updatedProfile], error: null, count: 1 }),
        order: () => t({ data: [updatedProfile], error: null, count: 1 }),
        range: () => t({ data: [updatedProfile], error: null, count: 1 }),
        single: () => t({ data: updatedProfile, error: null }),
        maybeSingle: () => t({ data: null, error: null }),
        delete: () => t({ data: null, error: null }),
        insert: () => t({ data: null, error: null }),
        upsert: () => t({ data: null, error: null }),
      }))

      const { result } = renderWithQuery(useUpdateUserRole)
      act(() => { result.current.mutate({ userId: 'u2', role: 'author' }) })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(updateCalled).toBe(true)
      expect(result.current.data).toEqual(updatedProfile)
    })

    it('handles role update error', async () => {
      supabase.from.mockImplementation(() => ({
        ...t({}), update: () => { throw new Error('Update failed') },
        select: () => t({ data: [], error: null, count: 0 }),
      }))

      const { result } = renderWithQuery(useUpdateUserRole)
      act(() => { result.current.mutate({ userId: 'u2', role: 'admin' }) })
      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useAdminUsers', () => {
    it('fetches users via RPC with pagination', async () => {
      const users = [
        { id: 'u1', email: 'admin@test.com', full_name: 'Admin', role: 'admin', created_at: new Date().toISOString() },
        { id: 'u2', email: 'user@test.com', full_name: 'User', role: 'reader', created_at: new Date().toISOString() },
      ]
      supabase.rpc.mockImplementation(() => ({
        order: () => ({
          range: () => t({ data: users, error: null, count: 2 }),
        }),
      }))

      const { result } = renderWithQuery(useAdminUsers, {})
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.data).toHaveLength(2)
      expect(result.current.data?.count).toBe(2)
    })

    it('filters by role', async () => {
      supabase.rpc.mockImplementation(() => ({
        eq: () => ({
          order: () => ({
            range: () => t({ data: [], error: null, count: 0 }),
          }),
        }),
        order: () => ({
          range: () => t({ data: [], error: null, count: 0 }),
        }),
      }))

      const { result } = renderWithQuery(useAdminUsers, { role: 'author' })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.data).toEqual([])
    })

    it('handles RPC error', async () => {
      supabase.rpc.mockImplementation(() => { throw new Error('RPC failed') })

      const { result } = renderWithQuery(useAdminUsers, {})
      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useAdminChannels', () => {
    it('fetches channels with enriched data', async () => {
      const channels = [{
        id: 'ch1', site_name: 'My Channel', channel_slug: 'my-channel',
        author_id: 'u1', profiles: { id: 'u1', full_name: 'Author', email: 'author@test.com' },
        created_at: new Date().toISOString(),
      }]
      const channelData = { data: channels, error: null, count: 1 }

      supabase.from.mockImplementation((table) => {
        if (table === 'site_settings') {
          return {
            select: () => ({
              order: () => ({
                range: () => t(channelData),
              }),
            }),
          }
        }
        return mkChain()
      })

      supabase.rpc.mockImplementation(() => t({ data: [], error: null }))

      const { result } = renderWithQuery(useAdminChannels, {})
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.data).toHaveLength(1)
      expect(result.current.data?.count).toBe(1)
    })
  })

  describe('Non-admin access controls', () => {
    it('useSettings fetches general settings', async () => {
      const settings = { id: 1, site_name: 'My Blog', allow_registration: true }
      supabase.from.mockImplementation(() => ({
        select: () => ({
          limit: () => ({
            single: () => t({ data: settings, error: null }),
          }),
        }),
      }))

      const { result } = renderWithQuery(useSettings)
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.site_name).toBe('My Blog')
    })

    it('useUpdateSettings updates settings', async () => {
      const existingSettings = { id: 1, site_name: 'Old Name' }
      const updatedSettings = { id: 1, site_name: 'New Name' }

      supabase.from.mockImplementation(() => ({
        select: () => ({
          limit: () => ({
            single: () => t({ data: existingSettings, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => t({ data: updatedSettings, error: null }),
            }),
          }),
        }),
      }))

      const { result } = renderWithQuery(useUpdateSettings)
      act(() => { result.current.mutate({ site_name: 'New Name' }) })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  describe('useAnalytics', () => {
    it('fetches admin analytics without userId', async () => {
      supabase.from.mockImplementation((table) => {
        const chains = {
          profiles: { select: () => t({ count: 10, data: [{ created_at: '2025-01-01T00:00:00Z' }], error: null }) },
          posts: { select: () => t({ data: [{ status: 'published' }, { status: 'draft' }], error: null }) },
          daily_views: { select: () => t({ data: [{ view_count: 100 }], error: null }) },
          top_posts: { select: () => t({ data: [{ id: 'p1', title: 'Top Post', views: 50 }], error: null }) },
          tags: { select: () => ({ order: () => ({ limit: () => t({ data: [{ name: 'js', usage_count: 5 }], error: null }) }) }) },
          comments: { select: () => t({ count: 20, error: null }) },
          comments_with_authors: { select: () => t({ count: 20, error: null }) },
        }
        return chains[table] || mkChain()
      })

      const { result } = renderWithQuery(useAnalytics, null)
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.totalUsers).toBe(10)
      expect(result.current.data?.publishedCount).toBe(1)
      expect(result.current.data?.draftCount).toBe(1)
      expect(result.current.data?.totalViews).toBe(100)
      expect(result.current.data?.totalComments).toBe(20)
    })

    it('fetches author analytics with userId', async () => {
      supabase.from.mockImplementation((table) => {
        const chains = {
          posts: { select: () => ({ eq: () => t({ data: [{ status: 'published' }], error: null }) }) },
          daily_views: { select: () => ({ eq: () => t({ data: [{ view_count: 50 }], error: null }) }) },
          top_posts: { select: () => ({ eq: () => ({ limit: () => t({ data: [], error: null }) }) }) },
          tags: { select: () => ({ order: () => ({ limit: () => t({ data: [], error: null }) }) }) },
          comments_with_authors: { select: () => ({ eq: () => t({ count: 5, error: null }) }) },
        }
        return chains[table] || mkChain()
      })

      const { result } = renderWithQuery(useAnalytics, 'u1')
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.totalUsers).toBe(0)
      expect(result.current.data?.publishedCount).toBe(1)
      expect(result.current.data?.draftCount).toBe(0)
      expect(result.current.data?.totalViews).toBe(50)
      expect(result.current.data?.totalComments).toBe(5)
    })
  })
})
