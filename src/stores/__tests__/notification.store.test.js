import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNotificationStore } from '../notification.store'

describe('useNotificationStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('setNotifications', () => {
    it('should set notifications and calculate unread count', () => {
      const notifs = [
        { id: '1', read_at: null },
        { id: '2', read_at: '2024-01-01' },
        { id: '3', read_at: null },
      ]
      useNotificationStore.getState().setNotifications(notifs)
      const state = useNotificationStore.getState()
      expect(state.notifications).toEqual(notifs)
      expect(state.unreadCount).toBe(2)
    })

    it('should handle empty array', () => {
      useNotificationStore.getState().setNotifications([])
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })

  describe('addNotification', () => {
    it('should add notification to the beginning of the list', () => {
      useNotificationStore.setState({
        notifications: [{ id: '1', read_at: null }],
        unreadCount: 1,
      })
      useNotificationStore.getState().addNotification({ id: '2', read_at: null })
      const state = useNotificationStore.getState()
      expect(state.notifications[0].id).toBe('2')
      expect(state.unreadCount).toBe(2)
    })

    it('should handle read notification correctly', () => {
      useNotificationStore.getState().addNotification({ id: '1', read_at: '2024-01-01' })
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read and update count', () => {
      useNotificationStore.setState({
        notifications: [{ id: '1', read_at: null }, { id: '2', read_at: null }],
        unreadCount: 2,
      })
      useNotificationStore.getState().markAsRead('1')
      const state = useNotificationStore.getState()
      expect(state.notifications[0].read_at).toBeTruthy()
      expect(state.unreadCount).toBe(1)
    })

    it('should handle non-existent id gracefully', () => {
      useNotificationStore.setState({
        notifications: [{ id: '1', read_at: null }],
        unreadCount: 1,
      })
      useNotificationStore.getState().markAsRead('nonexistent')
      expect(useNotificationStore.getState().unreadCount).toBe(1)
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', () => {
      useNotificationStore.setState({
        notifications: [
          { id: '1', read_at: null },
          { id: '2', read_at: null },
          { id: '3', read_at: '2024-01-01' },
        ],
        unreadCount: 2,
      })
      useNotificationStore.getState().markAllAsRead()
      const state = useNotificationStore.getState()
      state.notifications.forEach(n => {
        expect(n.read_at).toBeTruthy()
      })
      expect(state.unreadCount).toBe(0)
    })

    it('should handle empty list', () => {
      useNotificationStore.getState().markAllAsRead()
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })
})
