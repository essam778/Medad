import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../ui.store'

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      modals: { search: false, auth: false, notice: false, deleteConfirm: false },
      noticeContent: { title: '', message: '', variant: 'info' },
      mobileMenuOpen: false,
    })
  })

  describe('openModal', () => {
    it('should open a modal', () => {
      useUIStore.getState().openModal('search')
      expect(useUIStore.getState().modals.search).toBe(true)
    })

    it('should keep other modals unchanged', () => {
      useUIStore.getState().openModal('search')
      const modals = useUIStore.getState().modals
      expect(modals.search).toBe(true)
      expect(modals.auth).toBe(false)
      expect(modals.notice).toBe(false)
    })
  })

  describe('closeModal', () => {
    it('should close a modal', () => {
      useUIStore.setState({ modals: { ...useUIStore.getState().modals, search: true } })
      useUIStore.getState().closeModal('search')
      expect(useUIStore.getState().modals.search).toBe(false)
    })
  })

  describe('showNotice', () => {
    it('should set notice content and open notice modal', () => {
      useUIStore.getState().showNotice('Title', 'Message', 'success')
      const state = useUIStore.getState()
      expect(state.modals.notice).toBe(true)
      expect(state.noticeContent.title).toBe('Title')
      expect(state.noticeContent.message).toBe('Message')
      expect(state.noticeContent.variant).toBe('success')
    })

    it('should use default variant info', () => {
      useUIStore.getState().showNotice('Title', 'Message')
      expect(useUIStore.getState().noticeContent.variant).toBe('info')
    })
  })

  describe('mobileMenu', () => {
    it('should start closed', () => {
      expect(useUIStore.getState().mobileMenuOpen).toBe(false)
    })

    it('should toggle mobile menu', () => {
      useUIStore.getState().toggleMobileMenu()
      expect(useUIStore.getState().mobileMenuOpen).toBe(true)
      useUIStore.getState().toggleMobileMenu()
      expect(useUIStore.getState().mobileMenuOpen).toBe(false)
    })

    it('should set mobile menu to specific value', () => {
      useUIStore.getState().setMobileMenu(true)
      expect(useUIStore.getState().mobileMenuOpen).toBe(true)
      useUIStore.getState().setMobileMenu(false)
      expect(useUIStore.getState().mobileMenuOpen).toBe(false)
    })
  })
})
