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
import { useInfinitePosts, useUpsertPost, useDeletePost, useAdminPosts, useMyPosts, usePost } from '@/features/posts/hooks/usePosts'
import { mkChain, mkThenableChain, resetStores } from './testUtils'

const POSTS_PER_PAGE = 9
const t = (val) => mkThenableChain(val)

function makePostChain(posts, count) {
  const postsData = { data: posts, error: null, count }
  const singleData = { data: posts?.[0] || null, error: null }
  return {
    select: () => t(postsData),
    eq: () => t(postsData),
    neq: () => t(postsData),
    order: () => t(postsData),
    range: () => t(postsData),
    single: () => t(singleData),
    maybeSingle: () => t(singleData),
    insert: () => t(singleData),
    update: () => t(singleData),
    delete: () => t({ data: null, error: null }),
    upsert: () => t(singleData),
    contains: () => t(postsData),
    overlaps: () => t(postsData),
    or: () => t(postsData),
    limit: () => t(postsData),
  }
}

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

describe('Posts Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    resetStores()
  })

  describe('useInfinitePosts', () => {
    it('loads first page of published posts', async () => { // @smoke
      const posts = Array.from({ length: 5 }, (_, i) => ({
        id: `p${i}`, title: `Post ${i}`, slug: `post-${i}`,
        status: 'published', published_at: new Date().toISOString(),
        views: i * 10, tags: ['test'],
        profiles: { id: 'u1', full_name: 'Author', avatar_url: null },
      }))
      supabase.from.mockImplementation(() => makePostChain(posts, 5))

      const { result } = renderWithQuery(useInfinitePosts)
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.pages[0]).toHaveLength(5)
      expect(result.current.data?.pages[0][0].id).toBe('p0')
      expect(result.current.hasNextPage).toBe(false)
    })

    it('indicates next page when page is full', async () => {
      const posts = Array.from({ length: POSTS_PER_PAGE }, (_, i) => ({
        id: `p${i}`, title: `Post ${i}`, slug: `post-${i}`,
        status: 'published', published_at: new Date().toISOString(),
        views: i, tags: [],
        profiles: { id: 'u1', full_name: 'Author', avatar_url: null },
      }))
      supabase.from.mockImplementation(() => makePostChain(posts, POSTS_PER_PAGE))

      const { result } = renderWithQuery(useInfinitePosts)
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.pages[0]).toHaveLength(POSTS_PER_PAGE)
      expect(result.current.hasNextPage).toBe(true)
    })

    it('appends data on fetchNextPage', async () => {
      const page1posts = Array.from({ length: POSTS_PER_PAGE }, (_, i) => ({
        id: `p${i}`, title: `Post ${i}`, slug: `post-${i}`,
        status: 'published', published_at: new Date().toISOString(),
        views: i, tags: [],
        profiles: { id: 'u1', full_name: 'Author', avatar_url: null },
      }))
      const page2posts = Array.from({ length: 3 }, (_, i) => ({
        id: `p${i + POSTS_PER_PAGE}`, title: `Post ${i + POSTS_PER_PAGE}`,
        slug: `post-${i + POSTS_PER_PAGE}`, status: 'published',
        published_at: new Date().toISOString(), views: i, tags: [],
        profiles: { id: 'u1', full_name: 'Author', avatar_url: null },
      }))

      let callCount = 0
      supabase.from.mockImplementation(() => {
        callCount++
        const p = callCount <= 1 ? page1posts : page2posts
        return makePostChain(p, POSTS_PER_PAGE + 3)
      })

      const { result } = renderWithQuery(useInfinitePosts)
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.pages).toHaveLength(1)

      await act(async () => { result.current.fetchNextPage() })
      await waitFor(() => { expect(result.current.data?.pages).toHaveLength(2) })
      expect(result.current.data?.pages[1]).toHaveLength(3)
      expect(result.current.data?.pages.flat()).toHaveLength(POSTS_PER_PAGE + 3)
    })

    it('returns error state when supabase fails', async () => {
      const errChain = { ...t({ data: null, error: null }), range: () => Promise.reject(new Error('DB error')) }
      supabase.from.mockImplementation(() => ({
        ...makePostChain([], 0), select: () => ({ eq: () => ({ order: () => ({ range: () => Promise.reject(new Error('DB error')) }) }) }),
      }))

      const { result } = renderWithQuery(useInfinitePosts)
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeDefined()
    })

    it('filters by tag when provided', async () => {
      const callLog = []
      supabase.from.mockImplementation(() => {
        callLog.push('from called')
        return makePostChain([], 0)
      })
      renderWithQuery(useInfinitePosts, { tag: 'javascript' })
      await waitFor(() => { expect(callLog.length).toBeGreaterThan(0) })
    })
  })

  describe('useUpsertPost', () => {
    it('creates a new post', async () => { // @smoke
      const createdPost = { id: 'p-new', title: 'New Post', slug: 'new-post', content: 'hello', author_id: 'u1' }
      supabase.from.mockImplementation(() => ({
        ...makePostChain([createdPost], 1), select: () => t({ data: createdPost, error: null }),
      }))

      const { result } = renderWithQuery(useUpsertPost)
      act(() => { result.current.mutate({ title: 'New Post', content: 'hello', author_id: 'u1', status: 'published' }) })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(createdPost)
    })

    it('updates existing post when id is provided', async () => {
      const updatedPost = { id: 'p1', title: 'Updated', slug: 'updated', content: 'new content', author_id: 'u1' }
      supabase.from.mockImplementation(() => ({
        ...makePostChain([updatedPost], 1), select: () => t({ data: updatedPost, error: null }),
      }))

      const { result } = renderWithQuery(useUpsertPost)
      act(() => { result.current.mutate({ id: 'p1', title: 'Updated', content: 'new content', author_id: 'u1', status: 'published' }) })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(updatedPost)
    })

    it('handles create error', async () => {
      supabase.from.mockImplementation(() => ({
        ...makePostChain([], 0), insert: () => { throw new Error('Insert failed') },
      }))

      const { result } = renderWithQuery(useUpsertPost)
      act(() => { result.current.mutate({ title: 'Bad Post', content: 'x', author_id: 'u1', status: 'published' }) })
      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useDeletePost', () => {
    it('deletes a post', async () => { // @smoke
      let deleteCalled = false
      supabase.from.mockImplementation(() => ({
        ...makePostChain([], 0), delete: () => { deleteCalled = true; return t({ data: null, error: null }) },
      }))

      const { result } = renderWithQuery(useDeletePost)
      act(() => { result.current.mutate('p1') })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(deleteCalled).toBe(true)
    })

    it('handles delete error', async () => {
      supabase.from.mockImplementation(() => ({
        ...makePostChain([], 0), delete: () => t({ data: null, error: new Error('Delete failed') }),
      }))

      const { result } = renderWithQuery(useDeletePost)
      act(() => { result.current.mutate('p1') })
      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useAdminPosts', () => {
    it('fetches admin posts list with count', async () => {
      const posts = [{ id: 'p1', title: 'Admin Post', slug: 'admin-post', status: 'published', views: 10, profiles: { id: 'u1', full_name: 'Author' } }]
      supabase.from.mockImplementation(() => makePostChain(posts, 1))

      const { result } = renderWithQuery(useAdminPosts, {})
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.data).toHaveLength(1)
      expect(result.current.data?.count).toBe(1)
    })

    it('filters by status', async () => {
      supabase.from.mockImplementation(() => makePostChain([], 0))

      const { result } = renderWithQuery(useAdminPosts, { status: 'draft' })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.data).toEqual([])
    })
  })

  describe('useMyPosts', () => {
    it('fetches posts for a specific user', async () => {
      const posts = [{ id: 'p1', title: 'My Post', slug: 'my-post', status: 'published', views: 5 }]
      supabase.from.mockImplementation(() => makePostChain(posts, 1))

      const { result } = renderWithQuery(useMyPosts, 'u1')
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data[0].title).toBe('My Post')
    })

    it('returns empty array when enabled but no posts', async () => {
      supabase.from.mockImplementation(() => makePostChain([], 0))

      const { result } = renderWithQuery(useMyPosts, 'u1')
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([])
    })
  })

  describe('usePost', () => {
    it('fetches a single post by slug', async () => {
      const post = { id: 'p1', title: 'Single Post', slug: 'single-post', content: 'body' }
      const singleResp = t({ data: post, error: null })
      supabase.from.mockImplementation(() => ({
        select: () => singleResp,
        eq: () => singleResp,
        order: () => singleResp,
        range: () => singleResp,
        single: () => singleResp,
        maybeSingle: () => singleResp,
        insert: () => singleResp,
        update: () => singleResp,
        delete: () => singleResp,
        upsert: () => singleResp,
        contains: () => singleResp,
        overlaps: () => singleResp,
        or: () => singleResp,
        limit: () => singleResp,
      }))

      const { result } = renderWithQuery(usePost, 'single-post')
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.title).toBe('Single Post')
    })

    it('returns undefined when slug is empty (not enabled)', () => {
      const { result } = renderWithQuery(usePost, '')
      expect(result.current.isFetching).toBe(false)
      expect(result.current.data).toBeUndefined()
    })
  })
})
