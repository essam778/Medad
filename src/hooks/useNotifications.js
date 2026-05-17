import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '@auth'
import { useNotificationStore } from '../stores/notification.store'
import { NotificationService } from '../services/notification.service'

const QUERY_KEY = ['notifications']

export function useNotifications(limit = 20) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const setNotifications = useNotificationStore((s) => s.setNotifications)
  const addNotification = useNotificationStore((s) => s.addNotification)

  const query = useQuery({
    queryKey: QUERY_KEY,
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data || []
    },
    staleTime: 30 * 1000,
  })

  // Sync React Query data to Zustand store
  useEffect(() => {
    if (query.data) {
      setNotifications(query.data)
    }
  }, [query.data, setNotifications])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          addNotification(payload.new)
          queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, user?.id, addNotification])

  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  return {
    ...query,
    notifications,
    unreadCount,
  }
}

export async function markNotificationRead(notificationId) {
  return await NotificationService.markAsRead(notificationId)
}

export async function markAllNotificationsRead(recipientId) {
  return await NotificationService.markAllAsRead(recipientId)
}
