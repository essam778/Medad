/**
 * usePosts.js — React Query hooks للمقالات
 * ─────────────────────────────────────────
 * المسؤولية: إدارة الـ cache + الـ mutations فقط.
 * كل مكالمات Supabase المباشرة تمر عبر PostService في post.service.js.
 * استثناء: الـ infinite scroll والـ admin list لأنهم بيحتاجوا pagination خاصة.
 */
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PostService } from "../services/post.service";
import { queryClient } from "@/lib/queryClient";
import {
  calculateReadingTime,
  generateSlug,
  sanitizeSearchInput,
} from "@/lib/utils";

const POSTS_PER_PAGE = 9;

// =============================================
// Infinite Scroll للصفحة الرئيسية
// =============================================
export function useInfinitePosts({ tag = null, search = "" } = {}) {
  return useInfiniteQuery({
    queryKey: ["posts", "infinite", tag, search],
    queryFn: async ({ pageParam = 0 }) => {
      return await PostService.getInfinitePosts({
        pageParam,
        tag,
        search,
        perPage: POSTS_PER_PAGE,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === POSTS_PER_PAGE ? allPages.length : undefined,
  });
}

// =============================================
// مقال واحد بالـ slug — يستخدم PostService
// =============================================
export function usePost(slug) {
  return useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data, error } = await PostService.getPostBySlug(slug);
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

// =============================================
// جلب مقال للتعديل (بالـ id) — يستخدم PostService
// =============================================
export function usePostById(id) {
  return useQuery({
    queryKey: ["post", "edit", id],
    queryFn: async () => {
      const { data, error } = await PostService.getPostById(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// =============================================
// كل المقالات للأدمن مع pagination
// =============================================
export function useAdminPosts({
  status = "",
  page = 0,
  authorId = null,
  excludeMe = null,
} = {}) {
  return useQuery({
    queryKey: ["admin", "posts", status, page, authorId, excludeMe],
    queryFn: async () => {
      return await PostService.getAdminPostsList({
        status,
        page,
        authorId,
        excludeMe,
      });
    },
  });
}

// =============================================
// مقالات المستخدم الحالي
// =============================================
export function useMyPosts(userId) {
  return useQuery({
    queryKey: ["my-posts", userId],
    queryFn: async () => {
      return await PostService.getMyPosts(userId);
    },
    enabled: !!userId,
  });
}

// =============================================
// المقالات المحفوظة للمستخدم
// =============================================
export function useSavedPosts(userId) {
  return useQuery({
    queryKey: ["saved-posts", userId],
    queryFn: async () => {
      return await PostService.getSavedPosts(userId);
    },
    enabled: !!userId,
  });
}

// =============================================
// مقالات مشابهة
// =============================================
export function useRelatedPosts(postId, tags = []) {
  return useQuery({
    queryKey: ["related-posts", postId, tags],
    queryFn: async () => {
      return await PostService.getRelatedPosts(postId, tags);
    },
    enabled: !!postId && tags.length > 0,
  });
}

// =============================================
// إنشاء / تحديث مقال
// =============================================
export function useUpsertPost() {
  return useMutation({
    mutationFn: async (postData) => {
      const slug = postData.slug || generateSlug(postData.title);
      const reading_time = calculateReadingTime(postData.content);

      // حذف الـ columns اللي Supabase بيحسبها تلقائياً (generated columns)
      // search_vector بيتحسب تلقائياً عن طريق DB trigger — لو اتبعت بترجع 400
      const { id, search_vector, cover_image_url: _cov, ...rest } = postData;

      const payload = {
        ...rest,
        cover_image_url: _cov,
        slug,
        reading_time,
        updated_at: new Date().toISOString(),
        published_at:
          postData.status === "published" && !postData.published_at
            ? new Date().toISOString()
            : postData.published_at,
      };

      return await PostService.upsertPost(payload, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
    },
  });
}

// =============================================
// حذف مقال
// =============================================
export function useDeletePost() {
  return useMutation({
    mutationFn: async (postId) => {
      return await PostService.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
    },
  });
}
