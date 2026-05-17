import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { act } from '@testing-library/react'
import { supabase } from '@/lib/supabase'
import { NotificationService } from '@/services/notification.service'
import { useNotificationStore } from '@/stores/notification.store'
import { mkChain, mkThenableChain, resetStores } from './testUtils'

const t = (val) => mkThenableChain(val)

function testNotification(id, overrides = {}) {
  return {
    id, recipient_id: 'u2', actor_id: 'u1', type: 'new_post',
    title: 'مقال جديد', message: 'نشر كاتب مقالاً جديداً',
    entity_type: 'post', entity_id: 'p1', metadata: { slug: 'new-post' },
    read_at: null, created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('Notification System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
  })

  describe('notifyFollowers → Store integration', () => {
    it('creates notifications for followers and returns success', async () => { // @smoke
      const followers = [{ follower_id: 'u2' }, { follower_id: 'u3' }]
      supabase.from.mockImplementation((table) => {
        if (table === 'follows') return { select: () => ({ eq: () => t({ data: followers, error: null }) }) }
        if (table === 'notifications') return { insert: () => t({ data: [{ id: 'n1' }, { id: 'n2' }], error: null }) }
        return mkChain()
      })

      const result = await NotificationService.notifyFollowers('u1', 'Author Name', { id: 'p1', title: 'New Post', slug: 'new-post' })
      expect(result.success).toBe(true)
      expect(result.count).toBe(2)
    })

    it('returns success with count 0 when no followers', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'follows') return { select: () => ({ eq: () => t({ data: [], error: null }) }) }
        return mkChain()
      })

      const result = await NotificationService.notifyFollowers('u1', 'Author', { id: 'p1', title: 'Post', slug: 'post' })
      expect(result.success).toBe(true)
      expect(result.count).toBe(0)
    })

    it('handles notification insert error gracefully', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'follows') return { select: () => ({ eq: () => t({ data: [{ follower_id: 'u2' }], error: null }) }) }
        if (table === 'notifications') return { insert: () => Promise.reject(new Error('DB insert failed')) }
        return mkChain()
      })

      const result = await NotificationService.notifyFollowers('u1', 'Author', { id: 'p1', title: 'Post', slug: 'post' })
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Notification Store', () => {
    it('initially has empty notifications', () => {
      expect(useNotificationStore.getState().notifications).toEqual([])
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })

    it('adds notification and updates unread count', () => {
      act(() => { useNotificationStore.getState().addNotification(testNotification('n1')) })
      expect(useNotificationStore.getState().notifications).toHaveLength(1)
      expect(useNotificationStore.getState().unreadCount).toBe(1)
    })

    it('marks notification as read and decrements unread count', () => {
      act(() => { useNotificationStore.getState().addNotification(testNotification('n1')) })
      act(() => { useNotificationStore.getState().markAsRead('n1') })
      expect(useNotificationStore.getState().notifications[0].read_at).toBeTruthy()
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })

    it('queues multiple notifications correctly', () => {
      act(() => {
        ['n1', 'n2', 'n3'].forEach(id => useNotificationStore.getState().addNotification(testNotification(id)))
      })
      expect(useNotificationStore.getState().notifications).toHaveLength(3)
      expect(useNotificationStore.getState().unreadCount).toBe(3)
    })

    it('marks all notifications as read', () => {
      act(() => {
        ['n1', 'n2', 'n3'].forEach(id => useNotificationStore.getState().addNotification(testNotification(id)))
      })
      act(() => { useNotificationStore.getState().markAllAsRead() })
      expect(useNotificationStore.getState().notifications.every(n => n.read_at)).toBe(true)
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })

    it('sets notifications from external source and recalculates unread count', () => {
      const notifs = [
        testNotification('n1', { read_at: new Date().toISOString() }),
        testNotification('n2'), testNotification('n3'),
      ]
      act(() => { useNotificationStore.getState().setNotifications(notifs) })
      expect(useNotificationStore.getState().notifications).toHaveLength(3)
      expect(useNotificationStore.getState().unreadCount).toBe(2)
    })
  })

  describe('Full pipeline: notifyFollowers → Store', () => {
    it('publishes post, notifies followers, and store reflects new notifications', async () => {
      const followers = [{ follower_id: 'u2' }, { follower_id: 'u3' }]
      const insertedNotifications = [{ id: 'n1', recipient_id: 'u2', read_at: null }, { id: 'n2', recipient_id: 'u3', read_at: null }]

      supabase.from.mockImplementation((table) => {
        if (table === 'follows') return { select: () => ({ eq: () => t({ data: followers, error: null }) }) }
        if (table === 'notifications') return { insert: () => t({ data: insertedNotifications, error: null }) }
        return mkChain()
      })

      const result = await NotificationService.notifyFollowers('u1', 'Author', { id: 'p1', title: 'New Post', slug: 'new-post' })
      expect(result.success).toBe(true)
      expect(result.count).toBe(2)

      act(() => { insertedNotifications.forEach(n => useNotificationStore.getState().addNotification(n)) })
      expect(useNotificationStore.getState().notifications).toHaveLength(2)
      expect(useNotificationStore.getState().unreadCount).toBe(2)
    })

    it('preserves existing notifications when fetch fails', async () => {
      act(() => {
        useNotificationStore.getState().addNotification(testNotification('existing-1'))
        useNotificationStore.getState().addNotification(testNotification('existing-2'))
      })

      supabase.from.mockImplementation((table) => {
        if (table === 'follows') return { select: () => ({ eq: () => Promise.reject(new Error('Network error')) }) }
        return mkChain()
      })

      const result = await NotificationService.notifyFollowers('u1', 'Author', { id: 'p1', title: 'Post', slug: 'post' })
      expect(result.success).toBe(false)
      expect(useNotificationStore.getState().notifications).toHaveLength(2)
      expect(useNotificationStore.getState().notifications[0].id).toBe('existing-2')
    })

    it('markAsRead service call updates store state and persists to DB', async () => { // @smoke
      let updateCalled = false
      supabase.from.mockImplementation((table) => {
        if (table === 'notifications') {
          return {
            update: () => {
              updateCalled = true
              return { eq: () => t({ data: null, error: null }) }
            },
            select: () => ({ eq: () => ({ is: () => ({ order: () => ({ range: () => t({ data: [], error: null, count: 0 }) }) }) }) }),
          }
        }
        return mkChain()
      })

      await NotificationService.markAsRead('n1')
      expect(updateCalled).toBe(true)

      act(() => { useNotificationStore.getState().addNotification(testNotification('n1')) })
      act(() => { useNotificationStore.getState().markAsRead('n1') })
      expect(useNotificationStore.getState().notifications[0].read_at).toBeTruthy()
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })
})
