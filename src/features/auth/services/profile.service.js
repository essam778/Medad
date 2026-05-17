import { supabase } from '@/lib/supabase'

export const ProfileService = {
  async getUserStats(userId) {
    const { count: commentCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    const { count: likeCount } = await supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    return { comments: commentCount || 0, likes: likeCount || 0 }
  },

  async getProfile(id) {
    return await supabase
      .from('profiles')
      .select('*, site_settings(channel_slug, site_name)')
      .eq('id', id)
      .maybeSingle()
  },

  async getPublicProfile(id) {
    return await supabase
      .from('profiles_public')
      .select('*, site_settings(channel_slug, site_name)')
      .eq('id', id)
      .maybeSingle()
  },

  async updateRole(id, role) {
    return await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', id)
  },

  async toggleBan(id, currentBanStatus) {
    return await supabase.from('profiles').update({ is_banned: !currentBanStatus, updated_at: new Date().toISOString() }).eq('id', id)
  },

  async deleteUser(userId) {
    // Calling the RPC function instead of direct delete
    return await supabase.rpc('delete_user_by_admin', { target_user_id: userId })
  },

  async updateProfile(id, updates) {
    return await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
  },

  async getPoints(id) {
    return await supabase
      .from('profiles')
      .select('points')
      .eq('id', id)
      .single()
  },

  async updatePoints(id, points) {
    return await supabase
      .from('profiles')
      .update({ points })
      .eq('id', id)
  },

  async getCreatorRequest(userId) {
    return await supabase
      .from('creator_requests')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
  },

  async createCreatorRequest(userId, message) {
    return await supabase
      .from('creator_requests')
      .insert({ user_id: userId, message })
  },

  async getPendingCreatorRequests() {
    return await supabase
      .from('creator_requests')
      .select(`
        id,
        user_id,
        status,
        message,
        created_at,
        profiles (
          full_name,
          avatar_url,
          role,
          email
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
  },

  async approveCreatorRequest(requestId, userId) {
    // 1. Update profile role to author
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'author' })
      .eq('id', userId)
    
    if (profileError) throw profileError

    // 2. Update request status to approved
    return await supabase
      .from('creator_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)
  },

  async rejectCreatorRequest(requestId) {
    return await supabase
      .from('creator_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
  }
}
