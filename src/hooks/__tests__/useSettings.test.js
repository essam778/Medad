import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { PostService } from '@/features/posts/services/post.service'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'

vi.mock('@/features/posts/services/post.service', () => ({
  PostService: {
    getGeneralSettings: vi.fn(),
    getSiteSettingsByAuthor: vi.fn(),
  },
}))

function mkChain() {
  const chain = {
    select: () => chain, eq: () => chain, neq: () => chain,
    in: () => chain, is: () => chain, order: () => chain, limit: () => chain,
    contains: () => chain, overlaps: () => chain, or: () => chain, filter: () => chain,
    range: () => Promise.resolve({ data: [], error: null, count: 0 }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
    then: undefined,
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    update: () => ({
      eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
    }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
  }
  return chain
}

describe('useSettings hooks', () => {
  let capturedOpts

  beforeEach(() => {
    vi.clearAllMocks()
    capturedOpts = {}
    supabase.from = vi.fn(() => mkChain())
    supabase.rpc = vi.fn(() => Promise.resolve({}))
  })

  describe('useSettings', () => {
    beforeEach(() => {
      useQuery.mockImplementation((opts) => {
        capturedOpts = opts
        return { data: undefined, isLoading: false }
      })
    })

    it('should use correct queryKey', async () => {
      const { useSettings } = await import('../useSettings')
      renderHook(() => useSettings())
      expect(capturedOpts.queryKey).toEqual(['settings'])
    })

    it('queryFn should call PostService.getGeneralSettings', async () => {
      PostService.getGeneralSettings.mockResolvedValue({ data: { site_name: 'My Blog' }, error: null })
      const { useSettings } = await import('../useSettings')
      renderHook(() => useSettings())
      const result = await capturedOpts.queryFn()
      expect(PostService.getGeneralSettings).toHaveBeenCalled()
      expect(result).toEqual({ site_name: 'My Blog' })
    })

    it('queryFn should throw on error', async () => {
      PostService.getGeneralSettings.mockResolvedValue({ data: null, error: new Error('fetch failed') })
      const { useSettings } = await import('../useSettings')
      renderHook(() => useSettings())
      await expect(capturedOpts.queryFn()).rejects.toThrow('fetch failed')
    })

    it('should have staleTime of 10 minutes', async () => {
      const { useSettings } = await import('../useSettings')
      renderHook(() => useSettings())
      expect(capturedOpts.staleTime).toBe(600000)
    })
  })

  describe('useSiteSettings', () => {
    beforeEach(() => {
      useQuery.mockImplementation((opts) => {
        capturedOpts = opts
        return { data: undefined, isLoading: false }
      })
    })

    it('should use correct queryKey', async () => {
      const { useSiteSettings } = await import('../useSettings')
      renderHook(() => useSiteSettings('author1'))
      expect(capturedOpts.queryKey).toEqual(['site-settings', 'author1'])
    })

    it('queryFn should return null when no authorId', async () => {
      const { useSiteSettings } = await import('../useSettings')
      renderHook(() => useSiteSettings(null))
      const result = await capturedOpts.queryFn()
      expect(result).toBeNull()
    })

    it('queryFn should call PostService.getSiteSettingsByAuthor', async () => {
      PostService.getSiteSettingsByAuthor.mockResolvedValue({ data: { site_name: 'My Channel' }, error: null })
      const { useSiteSettings } = await import('../useSettings')
      renderHook(() => useSiteSettings('author1'))
      const result = await capturedOpts.queryFn()
      expect(PostService.getSiteSettingsByAuthor).toHaveBeenCalledWith('author1')
      expect(result).toEqual({ site_name: 'My Channel' })
    })

    it('queryFn should throw on error', async () => {
      PostService.getSiteSettingsByAuthor.mockResolvedValue({ data: null, error: new Error('fetch failed') })
      const { useSiteSettings } = await import('../useSettings')
      renderHook(() => useSiteSettings('author1'))
      await expect(capturedOpts.queryFn()).rejects.toThrow('fetch failed')
    })

    it('should be disabled without authorId', async () => {
      const { useSiteSettings } = await import('../useSettings')
      renderHook(() => useSiteSettings(''))
      expect(capturedOpts.enabled).toBe(false)
    })
  })

  describe('useUpdateSettings', () => {
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

    it('mutationFn should update existing settings', async () => {
      const { useUpdateSettings } = await import('../useSettings')
      renderHook(() => useUpdateSettings())
      const result = await mutationFn({ site_name: 'Updated' })
      expect(supabase.from).toHaveBeenCalledWith('settings')
      expect(result).toBeNull()
    })

    it('mutationFn should throw on update error', async () => {
      supabase.from = vi.fn(() => {
        let selectCount = 0
        return {
          select: vi.fn(() => {
            selectCount++
            if (selectCount === 1) {
              return { limit: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 's1' }, error: null })) })) }
            }
            return { single: vi.fn(() => Promise.resolve({ data: null, error: new Error('update failed') })) }
          }),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: new Error('update failed') })),
              })),
            })),
          })),
        }
      })
      const { useUpdateSettings } = await import('../useSettings')
      renderHook(() => useUpdateSettings())
      await expect(mutationFn({ site_name: 'Updated' })).rejects.toThrow('update failed')
    })

    it('onSuccess should invalidate settings query', async () => {
      const { useUpdateSettings } = await import('../useSettings')
      renderHook(() => useUpdateSettings())
      onSuccess()
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['settings'] })
    })
  })
})
