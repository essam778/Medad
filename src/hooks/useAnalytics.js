import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useAnalytics(userId = null) {
  return useQuery({
    queryKey: ['analytics', userId],
    queryFn: async () => {
      // إذا كان userId موجوداً، فهذا كاتب، سنقوم بتصفية كل الطلبات بناءً عليه
      
      const requests = [
        // 1. عدد المستخدمين (للأدمن فقط)
        !userId ? supabase.from('profiles').select('id', { count: 'exact', head: true }) : Promise.resolve({ count: 0 }),
        
        // 2. إحصائيات المقالات
        userId 
          ? supabase.from('posts').select('status').eq('author_id', userId)
          : supabase.from('posts').select('status'),
          
        // 3. المشاهدات اليومية
        userId
          ? supabase.from('daily_views').select('*').eq('author_id', userId)
          : supabase.from('daily_views').select('*'),
          
        // 4. أفضل المقالات
        userId
          ? supabase.from('top_posts').select('*').eq('author_id', userId).limit(5)
          : supabase.from('top_posts').select('*').limit(5),
          
        // 5. التصنيفات (للأدمن فقط أو عامة)
        supabase.from('tags').select('name, usage_count').order('usage_count', { ascending: false }).limit(8),
        
        // 6. التعليقات
        userId
          ? supabase.from('comments_with_authors').select('id', { count: 'exact', head: true }).eq('post_author_id', userId)
          : supabase.from('comments').select('id', { count: 'exact', head: true }),
          
        // 7. المستخدمون الجدد (للأدمن فقط)
        !userId 
          ? supabase.from('profiles').select('created_at').gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
          : Promise.resolve({ data: [] }),
      ]

      const [
        { count: totalUsers },
        { data: postStats },
        { data: dailyViews },
        { data: topPosts },
        { data: tagStats },
        { count: totalComments },
        { data: monthlyUsers },
      ] = await Promise.all(requests)

      const publishedCount = postStats?.filter(p => p.status === 'published').length || 0
      const draftCount = postStats?.filter(p => p.status === 'draft').length || 0
      const scheduledCount = postStats?.filter(p => p.status === 'scheduled').length || 0
      const totalViews = dailyViews?.reduce((sum, d) => sum + (d.view_count || 0), 0) || 0

      // تجميع المستخدمين الجدد شهريًا
      const monthlyMap = {}
      monthlyUsers?.forEach(u => {
        const month = u.created_at?.slice(0, 7) // YYYY-MM
        if (month) monthlyMap[month] = (monthlyMap[month] || 0) + 1
      })
      const monthlyUsersChart = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, count]) => ({ month, count }))

      return {
        totalUsers: totalUsers || 0,
        publishedCount,
        draftCount,
        scheduledCount,
        totalComments: totalComments || 0,
        totalViews,
        dailyViews: dailyViews || [],
        topPosts: topPosts || [],
        tagStats: tagStats || [],
        monthlyUsersChart,
      }
    },
    staleTime: 1000 * 60 * 2,
  })
}
