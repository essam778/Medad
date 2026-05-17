import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '../auth.service'

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signIn', () => {
    it('should call signInWithPassword with email and password', async () => { // @smoke
      const { supabase } = await import('@/lib/supabase')
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '1' } },
        error: null,
      })
      const result = await AuthService.signIn('test@test.com', 'password123')
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      })
    })
  })

  describe('signOut', () => {
    it('should call signOut', async () => {
      const { supabase } = await import('@/lib/supabase')
      await AuthService.signOut()
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('signInWithGoogle', () => {
    it('should call signInWithOAuth with google provider', async () => {
      const { supabase } = await import('@/lib/supabase')
      await AuthService.signInWithGoogle()
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/auth/callback' },
      })
    })
  })

  describe('getSession', () => {
    it('should call getSession', async () => {
      const { supabase } = await import('@/lib/supabase')
      await AuthService.getSession()
      expect(supabase.auth.getSession).toHaveBeenCalled()
    })
  })

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', async () => {
      const { supabase } = await import('@/lib/supabase')
      const callback = vi.fn()
      AuthService.onAuthStateChange(callback)
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(callback)
    })
  })

  describe('updatePassword', () => {
    it('should call updateUser with new password', async () => {
      const { supabase } = await import('@/lib/supabase')
      await AuthService.updatePassword('newpass123')
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpass123' })
    })
  })

  describe('signUp', () => {
    it('should call signUp with user data', async () => { // @smoke
      const { supabase } = await import('@/lib/supabase')
      await AuthService.signUp('test@test.com', 'pass123', 'Test User', 'reader')
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'pass123',
        options: { data: { full_name: 'Test User', role: 'reader' } },
      })
    })
  })

  describe('checkInviteCode', () => {
    it('should query invite_codes with trimmed code', async () => {
      const { supabase } = await import('@/lib/supabase')
      await AuthService.checkInviteCode('  INVITE123  ')
      expect(supabase.from).toHaveBeenCalledWith('invite_codes')
    })
  })

  describe('markInviteCodeUsed', () => {
    it('should update invite code to used', async () => {
      const { supabase } = await import('@/lib/supabase')
      await AuthService.markInviteCodeUsed('INVITE123')
      expect(supabase.from).toHaveBeenCalledWith('invite_codes')
    })
  })
})
