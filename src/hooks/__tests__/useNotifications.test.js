import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'

vi.mock('@auth', () => ({
  useAuth: vi.fn(),
}))

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useNotifications', () => {
    it('should fetch notifications when user is logged in', async () => {
      const useAuth = (await import('@auth')).useAuth
      useAuth.mockReturnValue({ user: { id: 'user1' } })
      useQuery.mockReturnValue({
        data: [{ id: 'n1', read_at: null }],
        isLoading: false,
      })

      const { useNotifications } = await import('../useNotifications')
      const { result } = renderHook(() => useNotifications(20))
      expect(result.current.notifications).toBeDefined()
    })

    it('should not fetch when user is not logged in', async () => {
      const useAuth = (await import('@auth')).useAuth
      useAuth.mockReturnValue({ user: null })

      const { useNotifications } = await import('../useNotifications')
      renderHook(() => useNotifications(20))
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      )
    })
  })

  describe('markNotificationRead', () => {
    it('should call NotificationService.markAsRead', async () => {
      const { markNotificationRead } = await import('../useNotifications')
      const { NotificationService } = await import('../../services/notification.service')
      const spy = vi.spyOn(NotificationService, 'markAsRead').mockResolvedValue(undefined)
      await markNotificationRead('n1')
      expect(spy).toHaveBeenCalledWith('n1')
      spy.mockRestore()
    })
  })

  describe('markAllNotificationsRead', () => {
    it('should call NotificationService.markAllAsRead', async () => {
      const { markAllNotificationsRead } = await import('../useNotifications')
      const { NotificationService } = await import('../../services/notification.service')
      const spy = vi.spyOn(NotificationService, 'markAllAsRead').mockResolvedValue(undefined)
      await markAllNotificationsRead('user1')
      expect(spy).toHaveBeenCalledWith('user1')
      spy.mockRestore()
    })
  })
})
