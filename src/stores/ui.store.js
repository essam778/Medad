import { create } from 'zustand'

export const useUIStore = create((set) => ({
  // Modals state
  modals: {
    search: false,
    auth: false,
    notice: false,
    deleteConfirm: false,
  },
  
  // Notice modal content
  noticeContent: {
    title: '',
    message: '',
    variant: 'info'
  },

  // Actions
  openModal: (modalName) => set((state) => ({
    modals: { ...state.modals, [modalName]: true }
  })),
  
  closeModal: (modalName) => set((state) => ({
    modals: { ...state.modals, [modalName]: false }
  })),

  showNotice: (title, message, variant = 'info') => set({
    modals: { ...useUIStore.getState().modals, notice: true },
    noticeContent: { title, message, variant }
  }),

  // Mobile navigation
  mobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenu: (open) => set({ mobileMenuOpen: open }),
}))
