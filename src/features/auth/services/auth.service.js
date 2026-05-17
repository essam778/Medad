import { supabase } from '@/lib/supabase'

export const AuthService = {
  async signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password })
  },

  async signOut() {
    return await supabase.auth.signOut()
  },

  async signInWithGoogle() {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  },

  async getSession() {
    return await supabase.auth.getSession()
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },

  async updatePassword(password) {
    return await supabase.auth.updateUser({ password })
  },

  async signUp(email, password, fullName, role) {
    return await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } }
    })
  },

  async checkInviteCode(code) {
    return await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.trim())
      .eq('is_used', false)
      .maybeSingle()
  },

  async markInviteCodeUsed(code) {
    return await supabase
      .from('invite_codes')
      .update({ is_used: true })
      .eq('code', code.trim())
  }
}
