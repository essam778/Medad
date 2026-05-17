import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../settings.store'

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: 'light',
      language: 'ar',
      sidebarOpen: true,
      fontSize: 'medium',
    })
  })

  describe('setTheme', () => {
    it('should set theme', () => {
      useSettingsStore.getState().setTheme('dark')
      expect(useSettingsStore.getState().theme).toBe('dark')
    })
  })

  describe('setLanguage', () => {
    it('should set language', () => {
      useSettingsStore.getState().setLanguage('en')
      expect(useSettingsStore.getState().language).toBe('en')
    })
  })

  describe('toggleSidebar', () => {
    it('should toggle sidebar state', () => {
      expect(useSettingsStore.getState().sidebarOpen).toBe(true)
      useSettingsStore.getState().toggleSidebar()
      expect(useSettingsStore.getState().sidebarOpen).toBe(false)
      useSettingsStore.getState().toggleSidebar()
      expect(useSettingsStore.getState().sidebarOpen).toBe(true)
    })
  })

  describe('setSidebar', () => {
    it('should set sidebar to specific value', () => {
      useSettingsStore.getState().setSidebar(false)
      expect(useSettingsStore.getState().sidebarOpen).toBe(false)
      useSettingsStore.getState().setSidebar(true)
      expect(useSettingsStore.getState().sidebarOpen).toBe(true)
    })
  })

  describe('setFontSize', () => {
    it('should set font size', () => {
      useSettingsStore.getState().setFontSize('large')
      expect(useSettingsStore.getState().fontSize).toBe('large')
    })

    it('should accept small font size', () => {
      useSettingsStore.getState().setFontSize('small')
      expect(useSettingsStore.getState().fontSize).toBe('small')
    })
  })

  describe('partialize', () => {
    it('should persist only non-sensitive state', () => {
      const state = useSettingsStore.getState()
      const partial = {
        theme: state.theme,
        language: state.language,
        sidebarOpen: state.sidebarOpen,
        fontSize: state.fontSize,
      }
      expect(partial).toEqual({
        theme: 'light',
        language: 'ar',
        sidebarOpen: true,
        fontSize: 'medium',
      })
    })
  })
})
