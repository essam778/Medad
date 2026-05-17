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
      .select('id, full_name, avatar_url, bio, role, points, is_banned, created_at, site_settings(channel_slug, site_name)')
      .eq('id', id)
      .maybeSingle()
  },

  async getPublicProfile(id) {
    return await supabase
      .from('profiles_public')
      .select('id, full_name, avatar_url, bio, role, points, created_at, site_settings(channel_slug, site_name)')
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
    // 1. Fetch pending requests
    const { data: requests, error: requestsError } = await supabase
      .from('creator_requests')
      .select('id, user_id, status, message, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (requestsError) return { data: null, error: requestsError }
    if (!requests || requests.length === 0) return { data: [], error: null }

    // 2. Fetch profiles using RPC
    const userIds = requests.map(r => r.user_id)
    const { data: profiles, error: profilesError } = await supabase
      .rpc('get_profiles_with_email')
      .in('id', userIds)

    if (profilesError) return { data: null, error: profilesError }

    const profileMap = (profiles || []).reduce((acc, p) => {
      acc[p.id] = p
      return acc
    }, {})

    const merged = requests.map(r => ({
      ...r,
      profiles: profileMap[r.user_id] || null
    }))

    return { data: merged, error: null }
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
