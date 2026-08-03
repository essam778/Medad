import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationService } from '../notification.service'

describe('NotificationService', () => {
  let supabase

  beforeEach(async () => {
    vi.clearAllMocks()
    supabase = (await import('../../lib/supabase')).supabase
  })

  describe('notifyFollowers', () => {
    it('should return success with count 0 when no followers', async () => {
      const mockChain = (resolveValue) => {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          is: vi.fn(() => chain),
          then: (resolve) => resolve(resolveValue)
        }
        return chain
      }
      
      supabase.from.mockImplementation(() => mockChain({ data: [], error: null }))
      
      const result = await NotificationService.notifyFollowers('author1', 'Author Name', {
        id: 'post1',
        title: 'New Post',
        slug: 'new-post',
      })
      expect(result).toEqual({ success: true, count: 0 })
    })

    it('should notify all followers and return count', async () => {
      const insertSpy = vi.fn(() => Promise.resolve({ error: null }))
      
      const mockChain = (resolveValue) => {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          is: vi.fn(() => chain),
          insert: insertSpy,
          then: (resolve) => resolve(resolveValue)
        }
        return chain
      }

      supabase.from.mockImplementation((table) => {
        if (table === 'follows') {
          return mockChain({
            data: [{ follower_id: 'f1' }, { follower_id: 'f2' }, { follower_id: 'f3' }],
            error: null,
          })
        }
        return mockChain({ data: [], error: null })
      })

      const result = await NotificationService.notifyFollowers('author1', 'Author Name', {
        id: 'post1',
        title: 'New Post',
        slug: 'new-post',
      })
      expect(result).toEqual({ success: true, count: 3 })
    })

    it('should handle errors gracefully', async () => {
      const mockChain = (resolveValue) => {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          is: vi.fn(() => chain),
          then: (resolve) => resolve(resolveValue)
        }
        return chain
      }

      supabase.from.mockImplementation(() => {
        const chain = mockChain(null)
        chain.then = (resolve, reject) => reject(new Error('network error'))
        return chain
      })

      const result = await NotificationService.notifyFollowers('author1', 'Author Name', {
        id: 'post1',
        title: 'New Post',
        slug: 'new-post',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle insert error', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [{ follower_id: 'f1' }],
            error: null,
          })),
        })),
        insert: vi.fn(() => Promise.resolve({ error: new Error('insert failed') })),
      })

      const result = await NotificationService.notifyFollowers('author1', 'Author Name', {
        id: 'post1',
        title: 'New Post',
        slug: 'new-post',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('markAsRead', () => {
    it('should mark single notification as read', async () => {
      supabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })
      await NotificationService.markAsRead('notif1')
      expect(supabase.from).toHaveBeenCalledWith('notifications')
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      supabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })
      await NotificationService.markAllAsRead('user1')
      expect(supabase.from).toHaveBeenCalledWith('notifications')
    })
  })
})
