import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const PAGE_SIZE = 20

export function useAdminUsers({ page = 0, search = '', role = '' } = {}) {
  return useQuery({
    queryKey: ['admin', 'users', page, search, role],
    queryFn: async () => {
      let query = supabase
        .rpc('get_profiles_with_email', {}, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (role) query = query.eq('role', role)
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data, count, error } = await query
      if (error) throw error
      return { data: data || [], count: count || 0 }
    },
  })
}

export function useAdminChannels({ page = 0, search = '' } = {}) {
  return useQuery({
    queryKey: ['admin', 'channels', page, search],
    queryFn: async () => {
      let query = supabase
        .from('site_settings')
        .select(`
          *,
          profiles:author_id (id, full_name, email, avatar_url, role, is_banned)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (search) {
        query = query.or(`site_name.ilike.%${search}%,channel_slug.ilike.%${search}%`)
      }

      const { data, count, error } = await query
      if (error) throw error

      // Enriched data with post counts and follower counts
      // Note: In a real "huge scale" app, you'd use a DB view or RPC for this
      const enriched = await Promise.all((data || []).map(async ch => {
        const { count: postsCount } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', ch.author_id)
          .eq('status', 'published')
          
        const { count: followersCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', ch.author_id)
          
        return { ...ch, postsCount: postsCount || 0, followersCount: followersCount || 0 }
      }))

      return { data: enriched, count: count || 0 }
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId) => {
      const { data, error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId })
      if (error) throw error
      if (data && !data.success) throw new Error(data.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
