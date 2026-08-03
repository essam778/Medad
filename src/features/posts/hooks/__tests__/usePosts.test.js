import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'

vi.mock('@/lib/utils', () => ({
  generateSlug: vi.fn(() => 'test-slug'),
  calculateReadingTime: vi.fn(() => 5),
}))

vi.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}))

vi.mock('@/features/posts/services/post.service', () => ({
  PostService: {
    getPostBySlug: vi.fn(),
    getPostById: vi.fn(),
    getRelatedPosts: vi.fn(),
    upsertPost: vi.fn(),
    deletePost: vi.fn(),
    getMyPosts: vi.fn(),
    getSavedPosts: vi.fn(),
    getInfinitePosts: vi.fn(),
    getAdminPostsList: vi.fn(),
  },
}))

function mkChain() {
  const chain = {
    select: () => chain,
    eq: () => chain,
    neq: () => chain,
    in: () => chain,
    is: () => chain,
    order: () => chain,
    limit: () => chain,
    contains: () => chain,
    overlaps: () => chain,
    or: () => chain,
    filter: () => chain,
    range: () => mkThenableChain({ data: [], error: null, count: 0 }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    then: undefined,
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    update: () => mkU(),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    upsert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }
  return chain
}

function mkU() {
  return {
    eq: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    is: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    select: () => ({
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    }),
  }
}

function mkThenableChain(data) {
  const p = Promise.resolve(data)
  p.eq = () => p; p.neq = () => p; p.order = () => p; p.range = () => p
  p.select = () => p; p.contains = () => p; p.or = () => p; p.limit = () => p
  p.overlaps = () => p; p.in = () => p; p.is = () => p; p.filter = () => p
  return p
}

describe('usePosts hooks', () => { // @smoke
  let capturedOpts

  beforeEach(() => {
    vi.clearAllMocks()
    capturedOpts = {}
    supabase.from = vi.fn(() => mkChain())
    supabase.rpc = vi.fn(() => Promise.resolve({}))
  })

  describe('useInfinitePosts', () => {
    beforeEach(() => {
      useInfiniteQuery.mockImplementation((opts) => {
        capturedOpts = opts
        return {
          data: { pages: [[]], pageParams: [0] },
          isLoading: false,
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        }
      })
    })

    it('should use correct queryKey', async () => {
      const { useInfinitePosts } = await import('../usePosts')
      renderHook(() => useInfinitePosts())
      expect(capturedOpts.queryKey).toEqual(['posts', 'infinite', null, ''])
    })

    it('should include tag and search in queryKey', async () => {
      const { useInfinitePosts } = await import('../usePosts')
      renderHook(() => useInfinitePosts({ tag: 'js', search: 'react' }))
      expect(capturedOpts.queryKey).toEqual(['posts', 'infinite', 'js', 'react'])
    })

    it('queryFn should return data on success', async () => {
      const { useInfinitePosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getInfinitePosts.mockResolvedValue([])
      renderHook(() => useInfinitePosts())
      const data = await capturedOpts.queryFn({ pageParam: 0 })
      expect(PostService.getInfinitePosts).toHaveBeenCalledWith(expect.objectContaining({ pageParam: 0 }))
      expect(Array.isArray(data)).toBe(true)
    })

    it('queryFn should filter by tag when provided', async () => {
      const { useInfinitePosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getInfinitePosts.mockResolvedValue([])
      renderHook(() => useInfinitePosts({ tag: 'js' }))
      await capturedOpts.queryFn({ pageParam: 0 })
      expect(PostService.getInfinitePosts).toHaveBeenCalledWith(expect.objectContaining({ tag: 'js' }))
    })

    it('queryFn should apply search when provided', async () => {
      const { useInfinitePosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getInfinitePosts.mockResolvedValue([])
      renderHook(() => useInfinitePosts({ search: 'test' }))
      await capturedOpts.queryFn({ pageParam: 0 })
      expect(PostService.getInfinitePosts).toHaveBeenCalledWith(expect.objectContaining({ search: 'test' }))
    })

    it('queryFn should throw on error', async () => {
      const { useInfinitePosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getInfinitePosts.mockRejectedValue(new Error('db error'))
      renderHook(() => useInfinitePosts())
      await expect(capturedOpts.queryFn({ pageParam: 0 })).rejects.toThrow('db error')
    })

    it('getNextPageParam should return next page when full', async () => {
      const { useInfinitePosts } = await import('../usePosts')
      renderHook(() => useInfinitePosts())
      const fullPage = Array(9).fill({ id: '1' })
      const result = capturedOpts.getNextPageParam(fullPage, [fullPage])
      expect(result).toBe(1)
    })

    it('getNextPageParam should return undefined when partial', async () => {
      const { useInfinitePosts } = await import('../usePosts')
      renderHook(() => useInfinitePosts())
      const partialPage = [{ id: '1' }]
      const result = capturedOpts.getNextPageParam(partialPage, [partialPage])
      expect(result).toBeUndefined()
    })
  })

  describe('usePost', () => {
    beforeEach(() => {
      useQuery.mockImplementation((opts) => {
        capturedOpts = opts
        return { data: undefined, isLoading: false }
      })
    })

    it('should use correct queryKey', async () => {
      const { usePost } = await import('../usePosts')
      renderHook(() => usePost('test-slug'))
      expect(capturedOpts.queryKey).toEqual(['post', 'test-slug'])
    })

    it('should be enabled only when slug exists', async () => {
      const { usePost } = await import('../usePosts')
      renderHook(() => usePost(''))
      expect(capturedOpts.enabled).toBe(false)
    })

    it('queryFn should call PostService.getPostBySlug', async () => {
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getPostBySlug.mockResolvedValue({ data: { id: '1', title: 'Test' }, error: null })
      const { usePost } = await import('../usePosts')
      renderHook(() => usePost('test-slug'))
      const result = await capturedOpts.queryFn()
      expect(PostService.getPostBySlug).toHaveBeenCalledWith('test-slug')
      expect(result).toEqual({ id: '1', title: 'Test' })
    })

    it('queryFn should throw on error', async () => {
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getPostBySlug.mockResolvedValue({ data: null, error: new Error('not found') })
      const { usePost } = await import('../usePosts')
      renderHook(() => usePost('test-slug'))
      await expect(capturedOpts.queryFn()).rejects.toThrow('not found')
    })
  })

  describe('usePostById', () => {
    beforeEach(() => {
      useQuery.mockImplementation((opts) => {
        capturedOpts = opts
        return { data: undefined, isLoading: false }
      })
    })

    it('queryFn should call PostService.getPostById', async () => {
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getPostById.mockResolvedValue({ data: { id: '1' }, error: null })
      const { usePostById } = await import('../usePosts')
      renderHook(() => usePostById('post1'))
      const result = await capturedOpts.queryFn()
      expect(PostService.getPostById).toHaveBeenCalledWith('post1')
      expect(result).toEqual({ id: '1' })
    })

    it('queryFn should throw on error', async () => {
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getPostById.mockResolvedValue({ data: null, error: new Error('not found') })
      const { usePostById } = await import('../usePosts')
      renderHook(() => usePostById('post1'))
      await expect(capturedOpts.queryFn()).rejects.toThrow('not found')
    })

    it('should disable when id is empty', async () => {
      const { usePostById } = await import('../usePosts')
      renderHook(() => usePostById(''))
      expect(capturedOpts.enabled).toBe(false)
    })
  })

  describe('useAdminPosts', () => {
    beforeEach(() => {
      useQuery.mockImplementation((opts) => {
        capturedOpts = opts
        return { data: undefined, isLoading: false }
      })
    })

    it('should use correct queryKey', async () => {
      const { useAdminPosts } = await import('../usePosts')
      renderHook(() => useAdminPosts({ status: 'published', page: 1, authorId: 'u1', excludeMe: 'u2' }))
      expect(capturedOpts.queryKey).toEqual(['admin', 'posts', 'published', 1, 'u1', 'u2'])
    })

    it('queryFn should fetch data with default params', async () => {
      const { useAdminPosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getAdminPostsList.mockResolvedValue({ data: [], count: 0 })
      renderHook(() => useAdminPosts())
      await capturedOpts.queryFn()
      expect(PostService.getAdminPostsList).toHaveBeenCalledWith({
        status: "",
        page: 0,
        authorId: null,
        excludeMe: null,
      })
    })

    it('queryFn should filter by status', async () => {
      const { useAdminPosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getAdminPostsList.mockResolvedValue({ data: [], count: 0 })
      renderHook(() => useAdminPosts({ status: 'draft' }))
      await capturedOpts.queryFn()
      expect(PostService.getAdminPostsList).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft' }))
    })

    it('queryFn should filter by authorId', async () => {
      const { useAdminPosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getAdminPostsList.mockResolvedValue({ data: [], count: 0 })
      renderHook(() => useAdminPosts({ authorId: 'u1' }))
      await capturedOpts.queryFn()
      expect(PostService.getAdminPostsList).toHaveBeenCalledWith(expect.objectContaining({ authorId: 'u1' }))
    })

    it('queryFn should filter by excludeMe', async () => {
      const { useAdminPosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getAdminPostsList.mockResolvedValue({ data: [], count: 0 })
      renderHook(() => useAdminPosts({ excludeMe: 'u1' }))
      await capturedOpts.queryFn()
      expect(PostService.getAdminPostsList).toHaveBeenCalledWith(expect.objectContaining({ excludeMe: 'u1' }))
    })

    it('queryFn should throw on error', async () => {
      const { useAdminPosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getAdminPostsList.mockRejectedValue(new Error('db error'))
      renderHook(() => useAdminPosts())
      await expect(capturedOpts.queryFn()).rejects.toThrow('db error')
    })
  })

  describe('useMyPosts', () => {
    beforeEach(() => {
      useQuery.mockImplementation((opts) => {
        capturedOpts = opts
        return { data: undefined, isLoading: false }
      })
    })

    it('should use correct queryKey', async () => {
      const { useMyPosts } = await import('../usePosts')
      renderHook(() => useMyPosts('user1'))
      expect(capturedOpts.queryKey).toEqual(['my-posts', 'user1'])
    })

    it('should enable only when userId exists', async () => {
      const { useMyPosts } = await import('../usePosts')
      renderHook(() => useMyPosts(''))
      expect(capturedOpts.enabled).toBe(false)
    })

    it('queryFn should call PostService.getMyPosts', async () => {
      const { useMyPosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getMyPosts.mockResolvedValue([])
      renderHook(() => useMyPosts('user1'))
      const result = await capturedOpts.queryFn()
      expect(PostService.getMyPosts).toHaveBeenCalledWith('user1')
      expect(Array.isArray(result)).toBe(true)
    })

    it('queryFn should throw on error', async () => {
      const { useMyPosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getMyPosts.mockRejectedValue(new Error('db error'))
      renderHook(() => useMyPosts('user1'))
      await expect(capturedOpts.queryFn()).rejects.toThrow('db error')
    })
  })

  describe('useSavedPosts', () => {
    beforeEach(() => {
      useQuery.mockImplementation((opts) => {
        capturedOpts = opts
        return { data: undefined, isLoading: false }
      })
    })

    it('queryFn should fetch from saved_posts', async () => {
      const { useSavedPosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getSavedPosts.mockResolvedValue([])
      renderHook(() => useSavedPosts('user1'))
      await capturedOpts.queryFn()
      expect(PostService.getSavedPosts).toHaveBeenCalledWith('user1')
    })

    it('should enable only when userId exists', async () => {
      const { useSavedPosts } = await import('../usePosts')
      renderHook(() => useSavedPosts(''))
      expect(capturedOpts.enabled).toBe(false)
    })

    it('queryFn should throw on error', async () => {
      const { useSavedPosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getSavedPosts.mockRejectedValue(new Error('db error'))
      renderHook(() => useSavedPosts('user1'))
      await expect(capturedOpts.queryFn()).rejects.toThrow('db error')
    })
  })

  describe('useRelatedPosts', () => {
    beforeEach(() => {
      useQuery.mockImplementation((opts) => {
        capturedOpts = opts
        return { data: undefined, isLoading: false }
      })
    })

    it('queryFn should return empty array when no tags', async () => {
      const { useRelatedPosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getRelatedPosts.mockResolvedValue([])
      renderHook(() => useRelatedPosts('post1', []))
      const result = await capturedOpts.queryFn()
      expect(result).toEqual([])
    })

    it('queryFn should fetch related posts when tags exist', async () => {
      const { useRelatedPosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getRelatedPosts.mockResolvedValue([])
      renderHook(() => useRelatedPosts('post1', ['js']))
      const result = await capturedOpts.queryFn()
      expect(PostService.getRelatedPosts).toHaveBeenCalledWith('post1', ['js'])
      expect(Array.isArray(result)).toBe(true)
    })

    it('should disable when no postId or tags', async () => {
      const { useRelatedPosts } = await import('../usePosts')
      renderHook(() => useRelatedPosts('', []))
      expect(capturedOpts.enabled).toBe(false)
    })

    it('queryFn should throw on error', async () => {
      const { useRelatedPosts } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.getRelatedPosts.mockRejectedValue(new Error('db error'))
      renderHook(() => useRelatedPosts('post1', ['js']))
      await expect(capturedOpts.queryFn()).rejects.toThrow('db error')
    })
  })

  describe('useUpsertPost', () => {
    let onSuccess

    beforeEach(() => {
      useMutation.mockImplementation((opts) => {
        capturedOpts = opts
        onSuccess = opts.onSuccess
        return { mutate: vi.fn(), isLoading: false }
      })
    })

    it('mutationFn should update post when id exists', async () => {
      const { useUpsertPost } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.upsertPost.mockResolvedValue(null)
      renderHook(() => useUpsertPost())
      const result = await capturedOpts.mutationFn({ id: 'post1', title: 'Updated', content: '<p>Hi</p>' })
      expect(PostService.upsertPost).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated', content: '<p>Hi</p>' }),
        'post1'
      )
      expect(result).toBeNull()
    })

    it('mutationFn should insert post when no id', async () => {
      const { useUpsertPost } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.upsertPost.mockResolvedValue(null)
      renderHook(() => useUpsertPost())
      const result = await capturedOpts.mutationFn({ title: 'New', content: '<p>Hello</p>' })
      expect(PostService.upsertPost).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New', content: '<p>Hello</p>' }),
        undefined
      )
      expect(result).toBeNull()
    })

    it('mutationFn should throw on update error', async () => {
      const { useUpsertPost } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.upsertPost.mockRejectedValue(new Error('update failed'))
      renderHook(() => useUpsertPost())
      await expect(capturedOpts.mutationFn({ id: 'post1', title: 'Test' })).rejects.toThrow('update failed')
    })

    it('mutationFn should throw on insert error', async () => {
      const { useUpsertPost } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.upsertPost.mockRejectedValue(new Error('insert failed'))
      renderHook(() => useUpsertPost())
      await expect(capturedOpts.mutationFn({ title: 'New Post' })).rejects.toThrow('insert failed')
    })

    it('onSuccess should invalidate queries', async () => {
      const { useUpsertPost } = await import('../usePosts')
      renderHook(() => useUpsertPost())
      onSuccess()
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['posts'] })
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin', 'posts'] })
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['my-posts'] })
    })
  })

  describe('useDeletePost', () => {
    let onSuccess

    beforeEach(() => {
      useMutation.mockImplementation((opts) => {
        capturedOpts = opts
        onSuccess = opts.onSuccess
        return { mutate: vi.fn(), isLoading: false }
      })
    })

    it('mutationFn should call delete chain', async () => {
      const { useDeletePost } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.deletePost.mockResolvedValue(null)
      renderHook(() => useDeletePost())
      await capturedOpts.mutationFn('post1')
      expect(PostService.deletePost).toHaveBeenCalledWith('post1')
    })

    it('mutationFn should throw on error', async () => {
      const { useDeletePost } = await import('../usePosts')
      const { PostService } = await import('@/features/posts/services/post.service')
      PostService.deletePost.mockRejectedValue(new Error('delete failed'))
      renderHook(() => useDeletePost())
      await expect(capturedOpts.mutationFn('post1')).rejects.toThrow('delete failed')
    })

    it('onSuccess should invalidate queries', async () => {
      const { useDeletePost } = await import('../usePosts')
      renderHook(() => useDeletePost())
      onSuccess()
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['posts'] })
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin', 'posts'] })
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['my-posts'] })
    })
  })
})
