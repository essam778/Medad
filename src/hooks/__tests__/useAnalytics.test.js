import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

function mkThenableChain(data) {
  const p = Promise.resolve(data)
  p.eq = () => p; p.neq = () => p; p.order = () => p
  p.range = () => p; p.select = () => p; p.or = () => p
  p.gte = () => p; p.limit = () => p; p.contains = () => p
  p.overlaps = () => p; p.filter = () => p; p.in = () => p
  p.is = () => p
  return p
}

function mkChain() {
  const tc = mkThenableChain({ data: [], error: null, count: 0 })
  const chain = {
    select: () => chain,
    eq: () => chain, neq: () => chain, order: () => chain, limit: () => chain,
    gte: () => chain, contains: () => chain, overlaps: () => chain,
    or: () => chain, filter: () => chain, in: () => chain, is: () => chain,
    range: () => tc,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    then: undefined,
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
  }
  return chain
}

describe('useAnalytics', () => {
  let capturedOpts

  beforeEach(() => {
    vi.clearAllMocks()
    capturedOpts = {}
    supabase.from = vi.fn(() => mkChain())
    supabase.rpc = vi.fn(() => Promise.resolve({}))
    useQuery.mockImplementation((opts) => {
      capturedOpts = opts
      return { data: undefined, isLoading: false }
    })
  })

  it('should use correct queryKey with userId', async () => {
    const { useAnalytics } = await import('../useAnalytics')
    renderHook(() => useAnalytics('user1'))
    expect(capturedOpts.queryKey).toEqual(['analytics', 'user1'])
  })

  it('should use correct queryKey without userId', async () => {
    const { useAnalytics } = await import('../useAnalytics')
    renderHook(() => useAnalytics(null))
    expect(capturedOpts.queryKey).toEqual(['analytics', null])
  })

  it('queryFn should return default analytics for admin (no userId)', async () => {
    const { useAnalytics } = await import('../useAnalytics')
    renderHook(() => useAnalytics(null))
    const result = await capturedOpts.queryFn()
    expect(result).toHaveProperty('totalUsers')
    expect(result).toHaveProperty('publishedCount')
    expect(result).toHaveProperty('draftCount')
    expect(result).toHaveProperty('scheduledCount')
    expect(result).toHaveProperty('totalComments')
    expect(result).toHaveProperty('totalViews')
    expect(result).toHaveProperty('dailyViews')
    expect(result).toHaveProperty('topPosts')
    expect(result).toHaveProperty('tagStats')
    expect(result).toHaveProperty('monthlyUsersChart')
    expect(result.totalUsers).toBe(0)
    expect(result.monthlyUsersChart).toEqual([])
  })

  it('queryFn should return author analytics with userId', async () => {
    const { useAnalytics } = await import('../useAnalytics')
    renderHook(() => useAnalytics('author1'))
    const result = await capturedOpts.queryFn()
    expect(result).toHaveProperty('totalUsers')
    expect(result.totalUsers).toBe(0)
  })

  it('queryFn should count published, draft, and scheduled posts', async () => {
    supabase.from = vi.fn(() => ({
      select: vi.fn(() => mkThenableChain({
        data: [
          { status: 'published' },
          { status: 'published' },
          { status: 'draft' },
          { status: 'scheduled' },
        ],
        error: null, count: 0,
      })),
      eq: () => ({
        select: vi.fn(() => mkThenableChain({ data: [], error: null, count: 0 })),
      }),
      gte: () => mkThenableChain({ data: [], error: null }),
      order: () => ({
        limit: () => mkThenableChain({ data: [], error: null }),
      }),
    }))
    const { useAnalytics } = await import('../useAnalytics')
    renderHook(() => useAnalytics(null))
    const result = await capturedOpts.queryFn()
    expect(result.publishedCount).toBe(2)
    expect(result.draftCount).toBe(1)
    expect(result.scheduledCount).toBe(1)
  })

  it('queryFn should calculate total views from daily_views', async () => {
    supabase.from = vi.fn(() => ({
      select: vi.fn(() => mkThenableChain({
        data: [{ view_count: 10 }, { view_count: 20 }, { view_count: 30 }],
        error: null, count: 0,
      })),
      eq: () => ({
        select: vi.fn(() => mkThenableChain({ data: [], error: null, count: 0 })),
      }),
      gte: () => mkThenableChain({ data: [], error: null }),
      order: () => ({
        limit: () => mkThenableChain({ data: [], error: null }),
      }),
    }))
    const { useAnalytics } = await import('../useAnalytics')
    renderHook(() => useAnalytics(null))
    const result = await capturedOpts.queryFn()
    expect(result.totalViews).toBe(60)
  })

  it('queryFn should build monthlyUsersChart from profile data', async () => {
    supabase.from = vi.fn(() => ({
      select: vi.fn(() => mkThenableChain({
        data: [
          { created_at: '2024-01-15' },
          { created_at: '2024-01-20' },
          { created_at: '2024-02-10' },
        ],
        error: null, count: 0,
      })),
      eq: () => ({
        select: vi.fn(() => mkThenableChain({ data: [], error: null, count: 0 })),
      }),
      gte: () => mkThenableChain({
        data: [
          { created_at: '2024-01-15T10:00:00Z' },
          { created_at: '2024-01-20T10:00:00Z' },
          { created_at: '2024-02-10T10:00:00Z' },
        ],
        error: null,
      }),
      order: () => ({
        limit: () => mkThenableChain({ data: [], error: null }),
      }),
    }))
    const { useAnalytics } = await import('../useAnalytics')
    renderHook(() => useAnalytics(null))
    const result = await capturedOpts.queryFn()
    expect(result.monthlyUsersChart).toEqual([
      { month: '2024-01', count: 2 },
      { month: '2024-02', count: 1 },
    ])
  })

  it('should have staleTime of 2 minutes', async () => {
    const { useAnalytics } = await import('../useAnalytics')
    renderHook(() => useAnalytics('user1'))
    expect(capturedOpts.staleTime).toBe(120000)
  })
})
