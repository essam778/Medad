import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'

function mkChain() {
  const chain = {
    select: () => chain, eq: () => chain, neq: () => chain,
    in: () => chain, is: () => chain, order: () => chain, limit: () => chain,
    contains: () => chain, overlaps: () => chain, or: () => chain, filter: () => chain,
    range: () => Promise.resolve({ data: [], error: null, count: 0 }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    then: undefined,
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    update: () => ({
      eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }), maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
      select: () => ({ single: () => Promise.resolve({ data: null, error: null }), maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
    }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    upsert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
  }
  return chain
}

function mkThenableChain(data) {
  const p = Promise.resolve(data)
  p.eq = () => p; p.neq = () => p; p.order = () => p; p.range = () => p
  p.select = () => p; p.or = () => p; p.limit = () => p; p.contains = () => p
  return p
}

describe('useAdmin hooks', () => {
  let capturedOpts

  beforeEach(() => {
    vi.clearAllMocks()
    capturedOpts = {}
    supabase.from = vi.fn(() => mkChain())
    supabase.rpc = vi.fn(() => mkThenableChain({ data: [], error: null, count: 0 }))
  })

  describe('useAdminUsers', () => {
    beforeEach(() => {
      useQuery.mockImplementation((opts) => {
        capturedOpts = opts
        return { data: undefined, isLoading: false }
      })
    })

    it('should use correct queryKey', async () => {
      const { useAdminUsers } = await import('../useAdmin')
      renderHook(() => useAdminUsers({ page: 1, search: 'test', role: 'author' }))
      expect(capturedOpts.queryKey).toEqual(['admin', 'users', 1, 'test', 'author'])
    })

    it('queryFn should call rpc', async () => {
      const { useAdminUsers } = await import('../useAdmin')
      renderHook(() => useAdminUsers())
      const result = await capturedOpts.queryFn()
      expect(supabase.rpc).toHaveBeenCalledWith('get_profiles_with_email', {}, { count: 'exact' })
      expect(result).toEqual({ data: [], count: 0 })
    })

    it('queryFn should filter by role', async () => {
      const { useAdminUsers } = await import('../useAdmin')
      renderHook(() => useAdminUsers({ role: 'author' }))
      await capturedOpts.queryFn()
      expect(supabase.rpc).toHaveBeenCalledWith('get_profiles_with_email', {}, { count: 'exact' })
    })

    it('queryFn should filter by search', async () => {
      const { useAdminUsers } = await import('../useAdmin')
      renderHook(() => useAdminUsers({ search: 'test' }))
      await capturedOpts.queryFn()
      expect(supabase.rpc).toHaveBeenCalledWith('get_profiles_with_email', {}, { count: 'exact' })
    })

    it('queryFn should throw on error', async () => {
      supabase.rpc = vi.fn(() => mkThenableChain({ data: null, error: new Error('rpc error') }))
      const { useAdminUsers } = await import('../useAdmin')
      renderHook(() => useAdminUsers())
      await expect(capturedOpts.queryFn()).rejects.toThrow('rpc error')
    })
  })

  describe('useAdminChannels', () => {
    beforeEach(() => {
      useQuery.mockImplementation((opts) => {
        capturedOpts = opts
        return { data: undefined, isLoading: false }
      })
    })

    it('should use correct queryKey', async () => {
      const { useAdminChannels } = await import('../useAdmin')
      renderHook(() => useAdminChannels({ page: 1, search: 'test' }))
      expect(capturedOpts.queryKey).toEqual(['admin', 'channels', 1, 'test'])
    })

    it('queryFn should fetch site_settings with enrichment', async () => {
      supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => mkThenableChain({
              data: [{ author_id: 'u1', site_name: 'My Channel' }],
              error: null, count: 1,
            })),
          })),
          eq: vi.fn(() => mkThenableChain({ count: 5, error: null })),
        })),
      }))
      const { useAdminChannels } = await import('../useAdmin')
      renderHook(() => useAdminChannels())
      const result = await capturedOpts.queryFn()
      expect(supabase.from).toHaveBeenCalledWith('site_settings')
      expect(result.data).toHaveLength(1)
      expect(result.data[0].site_name).toBe('My Channel')
      expect(typeof result.data[0].postsCount).toBe('number')
    })

    it('queryFn should filter by search', async () => {
      supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => mkThenableChain({
              data: [{ author_id: 'u1', site_name: 'My Channel' }],
              error: null, count: 1,
            })),
          })),
          eq: vi.fn(() => mkThenableChain({ count: 5, error: null })),
        })),
      }))
      const { useAdminChannels } = await import('../useAdmin')
      renderHook(() => useAdminChannels({ search: 'test' }))
      await capturedOpts.queryFn()
      expect(supabase.from).toHaveBeenCalledWith('site_settings')
    })

    it('queryFn should throw on error', async () => {
      supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => mkThenableChain({ data: null, error: new Error('db error') })),
          })),
        })),
      }))
      const { useAdminChannels } = await import('../useAdmin')
      renderHook(() => useAdminChannels())
      await expect(capturedOpts.queryFn()).rejects.toThrow('db error')
    })
  })

  describe('useUpdateUserRole', () => {
    let mutationFn
    let onSuccess

    beforeEach(() => {
      useMutation.mockImplementation((opts) => {
        capturedOpts = opts
        mutationFn = opts.mutationFn
        onSuccess = opts.onSuccess
        return { mutate: vi.fn(), isLoading: false }
      })
    })

    it('mutationFn should update profile role', async () => {
      const { useUpdateUserRole } = await import('../useAdmin')
      renderHook(() => useUpdateUserRole())
      const result = await mutationFn({ userId: 'u1', role: 'author' })
      expect(supabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toBeNull()
    })

    it('mutationFn should throw on error', async () => {
      supabase.from = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: new Error('update failed') })),
            })),
          })),
        })),
      }))
      const { useUpdateUserRole } = await import('../useAdmin')
      renderHook(() => useUpdateUserRole())
      await expect(mutationFn({ userId: 'u1', role: 'author' })).rejects.toThrow('update failed')
    })

    it('onSuccess should invalidate queries', async () => {
      const { useUpdateUserRole } = await import('../useAdmin')
      renderHook(() => useUpdateUserRole())
      onSuccess()
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin', 'users'] })
    })
  })

  describe('useDeleteUser', () => {
    let mutationFn
    let onSuccess

    beforeEach(() => {
      useMutation.mockImplementation((opts) => {
        capturedOpts = opts
        mutationFn = opts.mutationFn
        onSuccess = opts.onSuccess
        return { mutate: vi.fn(), isLoading: false }
      })
    })

    it('mutationFn should call rpc', async () => {
      supabase.rpc = vi.fn(() => Promise.resolve({ data: { success: true }, error: null }))
      const { useDeleteUser } = await import('../useAdmin')
      renderHook(() => useDeleteUser())
      await mutationFn('u1')
      expect(supabase.rpc).toHaveBeenCalledWith('delete_user_by_admin', { target_user_id: 'u1' })
    })

    it('mutationFn should throw if data.success is false', async () => {
      supabase.rpc = vi.fn(() => Promise.resolve({ data: { success: false, message: 'Cannot delete self' }, error: null }))
      const { useDeleteUser } = await import('../useAdmin')
      renderHook(() => useDeleteUser())
      await expect(mutationFn('u1')).rejects.toThrow('Cannot delete self')
    })

    it('mutationFn should throw on error', async () => {
      supabase.rpc = vi.fn(() => Promise.resolve({ data: null, error: new Error('rpc failed') }))
      const { useDeleteUser } = await import('../useAdmin')
      renderHook(() => useDeleteUser())
      await expect(mutationFn('u1')).rejects.toThrow('rpc failed')
    })

    it('onSuccess should invalidate queries', async () => {
      const { useDeleteUser } = await import('../useAdmin')
      renderHook(() => useDeleteUser())
      onSuccess()
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin', 'users'] })
    })
  })
})
