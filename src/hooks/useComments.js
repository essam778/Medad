import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'

export function useComments(postId) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (id, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!postId,
  })
}

export function useAddComment() {
  return useMutation({
    mutationFn: async ({ postId, userId, content, parentId = null }) => {
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: userId, content, parent_id: parentId })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] })
    },
  })
}

export function useDeleteComment() {
  return useMutation({
    mutationFn: async ({ commentId, postId }) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] })
    },
  })
}

export function useAdminComments({ page = 0 } = {}) {
  return useQuery({
    queryKey: ['admin', 'comments', page],
    queryFn: async () => {
      const { data, count, error } = await supabase
        .from('comments')
        .select(`
          *, profiles (full_name, email),
          posts (title, slug)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * 20, (page + 1) * 20 - 1)
      if (error) throw error
      return { data: data || [], count: count || 0 }
    },
  })
}
