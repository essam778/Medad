import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'light',
      language: 'ar',
      sidebarOpen: true,
      fontSize: 'medium',
      
      // Actions
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebar: (open) => set({ sidebarOpen: open }),
      setFontSize: (size) => set({ fontSize: size }),
    }),
    {
      name: 'midad-settings', // اسم المفتاح في localStorage
      partialize: (state) => ({ 
        theme: state.theme, 
        language: state.language,
        sidebarOpen: state.sidebarOpen,
        fontSize: state.fontSize 
      }), // نحفظ فقط الإعدادات غير الحساسة
    }
  )
)
