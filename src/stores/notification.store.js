import { create } from 'zustand'

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  
  // Actions
  setNotifications: (notifications) => set({ 
    notifications,
    unreadCount: notifications.filter(n => !n.read_at).length
  }),

  addNotification: (notification) => set((state) => {
    const newNotifications = [notification, ...state.notifications]
    return {
      notifications: newNotifications,
      unreadCount: newNotifications.filter(n => !n.read_at).length
    }
  }),

  markAsRead: (id) => set((state) => {
    const newNotifications = state.notifications.map(n => 
      n.id === id ? { ...n, read_at: new Date().toISOString() } : n
    )
    return {
      notifications: newNotifications,
      unreadCount: newNotifications.filter(n => !n.read_at).length
    }
  }),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read_at: new Date().toISOString() })),
    unreadCount: 0
  }))
}))
