import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { queryClient } from '../../lib/queryClient'
import * as commentHooks from '../useComments'

function captureQueryOptions() {
  let opts
  useQuery.mockImplementation((o) => {
    opts = o
    return { data: undefined, isLoading: false }
  })
  return () => opts
}

function captureMutationOptions() {
  let opts
  useMutation.mockImplementation((o) => {
    opts = o
    return { mutate: vi.fn(), isLoading: false }
  })
  return () => opts
}

describe('useComments hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useComments', () => {
    it('should fetch comments for a post', async () => {
      useQuery.mockReturnValue({
        data: [{ id: 'c1', content: 'Great!' }],
        isLoading: false,
      })
      const { result } = renderHook(() => commentHooks.useComments('post1'))
      expect(result.current.data).toHaveLength(1)
    })

    it('should not fetch when postId is empty', async () => {
      renderHook(() => commentHooks.useComments(''))
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      )
    })

    it('should fetch when postId is provided (enabled: true)', async () => {
      renderHook(() => commentHooks.useComments('post-1'))
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true })
      )
    })

    function mkCommentChain(resolveValue) {
      const chain = {
        select: () => chain,
        is: () => chain,
        eq: () => chain,
        order: () => Promise.resolve(resolveValue),
      }
      return chain
    }

    it('queryFn should return data from supabase', async () => {
      const getOpts = captureQueryOptions()
      const mockData = [{ id: 'c1', content: 'Hello' }]
      supabase.from.mockImplementation(() => mkCommentChain({ data: mockData, error: null }))
      renderHook(() => commentHooks.useComments('post-1'))
      const opts = getOpts()
      const result = await opts.queryFn()
      expect(result).toEqual(mockData)
      expect(supabase.from).toHaveBeenCalledWith('comments')
    })

    it('queryFn should throw on supabase error', async () => {
      const getOpts = captureQueryOptions()
      supabase.from.mockImplementation(() => mkCommentChain({ data: null, error: new Error('DB error') }))
      renderHook(() => commentHooks.useComments('post-1'))
      const opts = getOpts()
      await expect(opts.queryFn()).rejects.toThrow('DB error')
    })

    it('queryFn should return empty array when data is null', async () => {
      const getOpts = captureQueryOptions()
      supabase.from.mockImplementation(() => mkCommentChain({ data: null, error: null }))
      renderHook(() => commentHooks.useComments('post-1'))
      const opts = getOpts()
      const result = await opts.queryFn()
      expect(result).toEqual([])
    })
  })

  describe('useAddComment', () => {
    it('should add comment and invalidate', async () => {
      const mockMutate = vi.fn()
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      })
      const { result } = renderHook(() => commentHooks.useAddComment())
      result.current.mutate({ postId: 'p1', userId: 'u1', content: 'Nice!' })
    })

    function mkInsertChain(resolveValue) {
      const chain = {
        insert: () => chain,
        select: () => chain,
        single: () => Promise.resolve(resolveValue),
      }
      return chain
    }

    it('mutationFn should insert comment without parentId', async () => {
      const getOpts = captureMutationOptions()
      const mockComment = { id: 'c1', post_id: 'p1', content: 'Nice!' }
      supabase.from.mockImplementation(() => mkInsertChain({ data: mockComment, error: null }))
      renderHook(() => commentHooks.useAddComment())
      const opts = getOpts()
      const result = await opts.mutationFn({ postId: 'p1', userId: 'u1', content: 'Nice!' })
      expect(result).toEqual(mockComment)
      expect(supabase.from).toHaveBeenCalledWith('comments')
    })

    it('mutationFn should insert comment with parentId', async () => {
      const getOpts = captureMutationOptions()
      const mockComment = { id: 'c2', parent_id: 'p1' }
      supabase.from.mockImplementation(() => mkInsertChain({ data: mockComment, error: null }))
      renderHook(() => commentHooks.useAddComment())
      const opts = getOpts()
      const result = await opts.mutationFn({ postId: 'p1', userId: 'u1', content: 'Reply', parentId: 'p1' })
      expect(result).toEqual(mockComment)
    })

    it('mutationFn should throw on supabase error', async () => {
      const getOpts = captureMutationOptions()
      supabase.from.mockImplementation(() => mkInsertChain({ data: null, error: new Error('Insert failed') }))
      renderHook(() => commentHooks.useAddComment())
      const opts = getOpts()
      await expect(opts.mutationFn({ postId: 'p1', userId: 'u1', content: 'Bad' })).rejects.toThrow('Insert failed')
    })

    it('onSuccess should invalidate comments query', async () => {
      const getOpts = captureMutationOptions()
      renderHook(() => commentHooks.useAddComment())
      const opts = getOpts()
      opts.onSuccess({ id: 'c1' }, { postId: 'p1', userId: 'u1', content: 'Nice!' })
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['comments', 'p1'] })
    })
  })

  describe('useDeleteComment', () => {
    it('should delete comment', async () => {
      const mockMutate = vi.fn()
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      })
      const { result } = renderHook(() => commentHooks.useDeleteComment())
      result.current.mutate({ commentId: 'c1', postId: 'p1' })
    })

    function mkDeleteChain(resolveValue) {
      const chain = {
        delete: () => chain,
        eq: () => Promise.resolve(resolveValue),
      }
      return chain
    }

    it('mutationFn should delete comment and return nothing', async () => {
      const getOpts = captureMutationOptions()
      supabase.from.mockImplementation(() => mkDeleteChain({ error: null }))
      renderHook(() => commentHooks.useDeleteComment())
      const opts = getOpts()
      const result = await opts.mutationFn({ commentId: 'c1', postId: 'p1' })
      expect(result).toBeUndefined()
    })

    it('mutationFn should throw on delete error', async () => {
      const getOpts = captureMutationOptions()
      supabase.from.mockImplementation(() => mkDeleteChain({ error: new Error('Delete failed') }))
      renderHook(() => commentHooks.useDeleteComment())
      const opts = getOpts()
      await expect(opts.mutationFn({ commentId: 'c1', postId: 'p1' })).rejects.toThrow('Delete failed')
    })

    it('onSuccess should invalidate comments and admin queries', async () => {
      const getOpts = captureMutationOptions()
      renderHook(() => commentHooks.useDeleteComment())
      const opts = getOpts()
      opts.onSuccess(undefined, { commentId: 'c1', postId: 'p1' })
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['comments', 'p1'] })
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin', 'comments'] })
    })
  })

  describe('useAdminComments', () => {
    it('should fetch admin comments', async () => {
      useQuery.mockReturnValue({
        data: { data: [], count: 0 },
        isLoading: false,
      })
      const { result } = renderHook(() => commentHooks.useAdminComments({ page: 0 }))
      expect(result.current.data).toEqual({ data: [], count: 0 })
    })

    it('should default page to 0 when no arg', async () => {
      useQuery.mockReturnValue({ data: { data: [], count: 0 }, isLoading: false })
      const { result } = renderHook(() => commentHooks.useAdminComments())
      expect(result.current.data).toEqual({ data: [], count: 0 })
    })

    function mkAdminChain(resolveValue) {
      const chain = {
        select: () => chain,
        order: () => chain,
        range: () => Promise.resolve(resolveValue),
      }
      return chain
    }

    it('queryFn should fetch paginated comments with profiles and posts', async () => {
      const getOpts = captureQueryOptions()
      const mockRows = [{ id: 'c1', profiles: { full_name: 'User' }, posts: { title: 'Post' } }]
      supabase.from.mockImplementation(() => mkAdminChain({ data: mockRows, count: 1, error: null }))
      renderHook(() => commentHooks.useAdminComments({ page: 0 }))
      const opts = getOpts()
      const result = await opts.queryFn()
      expect(result).toEqual({ data: mockRows, count: 1 })
    })

    it('queryFn should return empty arrays when data/count is null', async () => {
      const getOpts = captureQueryOptions()
      supabase.from.mockImplementation(() => mkAdminChain({ data: null, count: null, error: null }))
      renderHook(() => commentHooks.useAdminComments({ page: 1 }))
      const opts = getOpts()
      const result = await opts.queryFn()
      expect(result).toEqual({ data: [], count: 0 })
    })

    it('queryFn should throw on supabase error', async () => {
      const getOpts = captureQueryOptions()
      supabase.from.mockImplementation(() => mkAdminChain({ data: null, count: null, error: new Error('Admin fetch error') }))
      renderHook(() => commentHooks.useAdminComments({ page: 0 }))
      const opts = getOpts()
      await expect(opts.queryFn()).rejects.toThrow('Admin fetch error')
    })
  })
})
