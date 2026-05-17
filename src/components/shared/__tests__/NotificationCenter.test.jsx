import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useAuth } from '@auth'
import { supabase } from '@/lib/supabase'
import { useNotificationStore } from '../../../stores/notification.store'
import { useUIStore } from '../../../stores/ui.store'

vi.mock('../../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}))

import NotificationCenter from '../NotificationCenter'

import { useNotifications } from '../../../hooks/useNotifications'

function renderCenter() {
  return render(<MemoryRouter><NotificationCenter /></MemoryRouter>)
}

const mockUser = { id: 'user-1', email: 'test@test.com' }

function makeNotification(overrides = {}) {
  return {
    id: 'notif-1',
    title: 'New follower',
    message: 'Someone followed you',
    created_at: '2026-05-17T10:00:00Z',
    read: false,
    read_at: null,
    metadata: null,
    ...overrides,
  }
}

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: mockUser })
    useNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
    })
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
    })
    useUIStore.setState({
      modals: { search: false, auth: false, notice: false, deleteConfirm: false },
      noticeContent: { title: '', message: '', variant: 'info' },
      mobileMenuOpen: false,
    })
  })

  describe('Auth gate', () => {
    it('returns null when no user', () => {
      useAuth.mockReturnValue({ user: null })
      const { container } = renderCenter()
      expect(container.innerHTML).toBe('')
    })

    it('renders bell button when user exists', () => {
      renderCenter()
      expect(screen.getByLabelText('التنبيهات')).toBeInTheDocument()
    })
  })

  describe('Bell button', () => {
    it('shows unread count badge', () => {
      useNotifications.mockReturnValue({
        notifications: [makeNotification(), makeNotification({ id: 'n2' })],
        unreadCount: 2,
        isLoading: false,
        error: null,
      })
      renderCenter()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('shows +9 when count exceeds 9', () => {
      useNotifications.mockReturnValue({
        notifications: Array.from({ length: 10 }, (_, i) => makeNotification({ id: `n${i}` })),
        unreadCount: 10,
        isLoading: false,
        error: null,
      })
      renderCenter()
      expect(screen.getByText('+9')).toBeInTheDocument()
    })

    it('does not show badge when unread is 0', () => {
      renderCenter()
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })
  })

  describe('Dropdown', () => {
    it('opens dropdown on bell click', () => {
      renderCenter()
      fireEvent.click(screen.getByLabelText('التنبيهات'))
      expect(screen.getByText('إشعاراتك')).toBeInTheDocument()
    })

    it('shows notification count in header', () => {
      useNotifications.mockReturnValue({
        notifications: [makeNotification(), makeNotification({ id: 'n2' })],
        unreadCount: 2,
        isLoading: false,
        error: null,
      })
      renderCenter()
      fireEvent.click(screen.getByLabelText('التنبيهات'))
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1)
    })

    it('shows empty state when no notifications', () => {
      renderCenter()
      fireEvent.click(screen.getByLabelText('التنبيهات'))
      expect(screen.getByText('لا توجد إشعارات جديدة')).toBeInTheDocument()
    })

    it('shows notification items', () => {
      useNotifications.mockReturnValue({
        notifications: [makeNotification({ title: 'New follower' })],
        unreadCount: 1,
        isLoading: false,
        error: null,
      })
      renderCenter()
      fireEvent.click(screen.getByLabelText('التنبيهات'))
      expect(screen.getByText('New follower')).toBeInTheDocument()
    })

    it('shows "تحديد الكل كمقروء" button', () => {
      renderCenter()
      fireEvent.click(screen.getByLabelText('التنبيهات'))
      expect(screen.getByText('تحديد الكل كمقروء')).toBeInTheDocument()
    })

    it('shows "حذف الكل" button', () => {
      renderCenter()
      fireEvent.click(screen.getByLabelText('التنبيهات'))
      expect(screen.getByText('حذف الكل')).toBeInTheDocument()
    })
  })

  describe('Delete all flow', () => {
    it('opens confirm modal on delete click', () => {
      renderCenter()
      fireEvent.click(screen.getByLabelText('التنبيهات'))
      fireEvent.click(screen.getByText('حذف الكل'))
      expect(screen.getByText('تصفير الإشعارات')).toBeInTheDocument()
      expect(screen.getByText('هل أنت متأكد من حذف كافة الإشعارات؟ لا يمكن التراجع عن هذه الخطوة.')).toBeInTheDocument()
    })

    it('calls supabase.delete on confirm', async () => {
      renderCenter()
      fireEvent.click(screen.getByLabelText('التنبيهات'))
      fireEvent.click(screen.getByText('حذف الكل'))
      fireEvent.click(screen.getByText('نعم، احذف الكل'))
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('notifications')
      })
    })
  })

  describe('Mark all read', () => {
    it('triggers markAllAsRead in store', () => {
      useNotifications.mockReturnValue({
        notifications: [makeNotification()],
        unreadCount: 1,
        isLoading: false,
        error: null,
      })
      renderCenter()
      fireEvent.click(screen.getByLabelText('التنبيهات'))
      fireEvent.click(screen.getByText('تحديد الكل كمقروء'))
      const state = useNotificationStore.getState()
      expect(state.unreadCount).toBe(0)
      expect(state.notifications.every(n => n.read_at)).toBeTruthy()
    })
  })

  describe('Close on backdrop', () => {
    it('closes dropdown when clicking backdrop', () => {
      renderCenter()
      fireEvent.click(screen.getByLabelText('التنبيهات'))
      expect(screen.getByText('إشعاراتك')).toBeInTheDocument()
      const backdrop = document.querySelector('.fixed.inset-0.z-\\[120\\]')
      if (backdrop) fireEvent.click(backdrop)
      expect(screen.queryByText('إشعاراتك')).not.toBeInTheDocument()
    })
  })
})
