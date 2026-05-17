/**
 * usePosts.js — React Query hooks للمقالات
 * ─────────────────────────────────────────
 * المسؤولية: إدارة الـ cache + الـ mutations فقط.
 * كل مكالمات Supabase المباشرة تمر عبر PostService في post.service.js.
 * استثناء: الـ infinite scroll والـ admin list لأنهم بيحتاجوا pagination خاصة.
 */
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PostService } from '../services/post.service'
import { queryClient } from '@/lib/queryClient'
import { calculateReadingTime, generateSlug } from '@/lib/utils'

const POSTS_PER_PAGE = 9

// =============================================
// Infinite Scroll للصفحة الرئيسية
// =============================================
export function useInfinitePosts({ tag = null, search = '' } = {}) {
  return useInfiniteQuery({
    queryKey: ['posts', 'infinite', tag, search],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('posts')
        .select(`
          id, title, slug, cover_image_url, tags, status,
          published_at, views, likes_count, comments_count,
          reading_time, created_at, content,
          profiles!posts_author_id_fkey (id, full_name, avatar_url)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1)

      if (tag) query = query.contains('tags', [tag])
      if (search) {
        query = query.or(`title.ilike.%${search}%,tags.cs.{"${search}"}`)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === POSTS_PER_PAGE ? allPages.length : undefined,
  })
}

// =============================================
// مقال واحد بالـ slug — يستخدم PostService
// =============================================
export function usePost(slug) {
  return useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      const { data, error } = await PostService.getPostBySlug(slug)
      if (error) throw error
      return data
    },
    enabled: !!slug,
  })
}

// =============================================
// جلب مقال للتعديل (بالـ id) — يستخدم PostService
// =============================================
export function usePostById(id) {
  return useQuery({
    queryKey: ['post', 'edit', id],
    queryFn: async () => {
      const { data, error } = await PostService.getPostById(id)
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// =============================================
// كل المقالات للأدمن مع pagination
// =============================================
export function useAdminPosts({ status = '', page = 0, authorId = null, excludeMe = null } = {}) {
  return useQuery({
    queryKey: ['admin', 'posts', status, page, authorId, excludeMe],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          id, title, slug, status, published_at, views,
          likes_count, comments_count, reading_time, tags, created_at,
          profiles!posts_author_id_fkey (id, full_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * 20, (page + 1) * 20 - 1)

      if (status) query = query.eq('status', status)
      if (authorId) query = query.eq('author_id', authorId)
      if (excludeMe) query = query.neq('author_id', excludeMe)

      const { data, count, error } = await query
      if (error) throw error
      return { data: data || [], count: count || 0 }
    },
  })
}

// =============================================
// مقالات المستخدم الحالي
// =============================================
export function useMyPosts(userId) {
  return useQuery({
    queryKey: ['my-posts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, status, published_at, views, likes_count, comments_count, reading_time, tags, created_at')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

// =============================================
// المقالات المحفوظة للمستخدم
// =============================================
export function useSavedPosts(userId) {
  return useQuery({
    queryKey: ['saved-posts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          id, created_at,
          posts (id, title, slug, cover_image_url, published_at, reading_time,
            profiles!posts_author_id_fkey (full_name))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

// =============================================
// مقالات مشابهة
// =============================================
export function useRelatedPosts(postId, tags = []) {
  return useQuery({
    queryKey: ['related-posts', postId, tags],
    queryFn: async () => {
      if (!tags.length) return []
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, cover_image_url, published_at, reading_time, profiles!posts_author_id_fkey (full_name)')
        .eq('status', 'published')
        .neq('id', postId)
        .overlaps('tags', tags)
        .limit(3)
      if (error) throw error
      return data || []
    },
    enabled: !!postId && tags.length > 0,
  })
}

// =============================================
// إنشاء / تحديث مقال
// =============================================
export function useUpsertPost() {
  return useMutation({
    mutationFn: async (postData) => {
      const slug = postData.slug || generateSlug(postData.title)
      const reading_time = calculateReadingTime(postData.content)

      // حذف الـ columns اللي Supabase بيحسبها تلقائياً (generated columns)
      // search_vector بيتحسب تلقائياً عن طريق DB trigger — لو اتبعت بترجع 400
      const {
        id,
        search_vector,
        cover_image_url: _cov,
        ...rest
      } = postData

      const payload = {
        ...rest,
        cover_image_url: _cov,
        slug,
        reading_time,
        updated_at: new Date().toISOString(),
        published_at:
          postData.status === 'published' && !postData.published_at
            ? new Date().toISOString()
            : postData.published_at,
      }

      // insertPayload بدون id
      const insertPayload = payload

      if (id) {
        const { data, error } = await supabase
          .from('posts')
          .update(payload)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase
          .from('posts')
          .insert(insertPayload)
          .select()
          .single()
        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['my-posts'] })
    },
  })
}

// =============================================
// حذف مقال
// =============================================
export function useDeletePost() {
  return useMutation({
    mutationFn: async (postId) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['my-posts'] })
    },
  })
}