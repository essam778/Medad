import { describe, it, expect, vi } from 'vitest'
import { queryClient } from '../queryClient'

describe('queryClient', () => {
  it('should have default retry of 1', () => {
    expect(queryClient.getDefaultOptions().queries.retry).toBe(1)
  })

  it('should have refetchOnWindowFocus disabled', () => {
    expect(queryClient.getDefaultOptions().queries.refetchOnWindowFocus).toBe(false)
  })

  it('should have staleTime of 5 minutes', () => {
    expect(queryClient.getDefaultOptions().queries.staleTime).toBe(1000 * 60 * 5)
  })

  it('should have cacheTime of 10 minutes', () => {
    expect(queryClient.getDefaultOptions().queries.cacheTime).toBe(1000 * 60 * 10)
  })
})
