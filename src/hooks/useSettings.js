import { useQuery, useMutation } from '@tanstack/react-query'
import { PostService } from '@/features/posts/services/post.service'
import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'

// الإعدادات العامة للمنصة
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await PostService.getGeneralSettings()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10,
  })
}

// إعدادات الموقع المخصصة لكاتب معين (SaaS Logic)
export function useSiteSettings(authorId) {
  return useQuery({
    queryKey: ['site-settings', authorId],
    queryFn: async () => {
      if (!authorId) return null
      const { data, error } = await PostService.getSiteSettingsByAuthor(authorId)
      
      if (error) throw error
      return data
    },
    enabled: !!authorId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: async (updates) => {
      const { data: existing } = await supabase.from('settings').select('id').limit(1).single()
      const { data, error } = await supabase
        .from('settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}
