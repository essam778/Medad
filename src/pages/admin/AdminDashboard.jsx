import { useState, useEffect, lazy, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { PostService } from '@/features/posts/services/post.service'
import { useAuth } from '@auth'
import { Link } from 'react-router-dom'
import { 
  FileText, Eye, TrendingUp, 
  Clock, Award, Sparkles, Zap, Tv, Plus
} from 'lucide-react'
import { motion } from 'framer-motion'
import { CardSkeleton } from '../../components/shared/Skeletons'
import { useToast } from '../../components/shared/ToastProvider'

// Lazy load Recharts — 300KB library only for admin charts
const LazyAreaChart = lazy(() => import('recharts').then(m => ({
  default: ({ data }) => {
    const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = m
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" opacity={0.03} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#444' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#444' }} dx={-10} />
          <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '10px', color: '#fff' }} itemStyle={{ color: '#a855f7' }} />
          <Area type="monotone" dataKey="views" stroke="#9333ea" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
        </AreaChart>
      </ResponsiveContainer>
    )
  }
})))

export default function AdminDashboard() {
  const { user, profile, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    postsCount: 0,
    commentsCount: 0,
    viewsCount: 0,
    topPosts: [],
    avgCtr: 0,
    retention: 0,
    channelsCount: 0,
    categoryStats: [],
    pendingRequests: 0,
  })
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchStats()
  }, [user])

  async function fetchStats() {
    setLoading(true)
    try {
      const { postsCount, viewsCount, commentsCount, topPosts } = await PostService.getAdminStats(isAdmin, user.id)

      let avgCtr = 0
      let analyticsQuery = supabase.from('author_content_analytics').select('ctr_estimate')
      if (!isAdmin) analyticsQuery = analyticsQuery.eq('author_id', user.id)
      const { data: analyticsRows } = await analyticsQuery
      if (analyticsRows?.length) {
        const totalCtr = analyticsRows.reduce((acc, row) => acc + Number(row.ctr_estimate || 0), 0)
        avgCtr = Number((totalCtr / analyticsRows.length).toFixed(2))
      }

      // Fetch Channels Count (Admin Only)
      let channelsCount = 0
      if (isAdmin) {
        const { count } = await supabase.from('site_settings').select('id', { count: 'exact', head: true })
        channelsCount = count || 0
      }

      // Fetch Tags/Categories Stats
      const { data: allTags } = await supabase.from('tags').select('name')
      const { data: allPostsTags } = await supabase.from('posts').select('tags')
      
      const tagCounts = {}
      allPostsTags?.forEach(p => {
        p.tags?.forEach(t => {
          tagCounts[t] = (tagCounts[t] || 0) + 1
        })
      })

      const categoryStats = (allTags || []).map(tag => ({
        name: tag.name,
        count: tagCounts[tag.name] || 0
      })).sort((a, b) => b.count - a.count)

      // Fetch Pending Creator Requests (Admin Only)
      let pendingRequests = 0
      if (isAdmin) {
        pendingRequests = await PostService.getCreatorRequests()
      }

      setStats({
        postsCount: postsCount || 0,
        commentsCount,
        viewsCount,
        topPosts: topPosts || [],
        avgCtr,
        retention: Math.min(100, Math.max(20, Math.round(avgCtr * 2.5))),
        channelsCount,
        categoryStats,
        pendingRequests,
      })

      setChartData([
        { name: 'السبت', views: Math.floor(viewsCount * 0.1) },
        { name: 'الأحد', views: Math.floor(viewsCount * 0.15) },
        { name: 'الإثنين', views: Math.floor(viewsCount * 0.2) },
        { name: 'الثلاثاء', views: Math.floor(viewsCount * 0.1) },
        { name: 'الأربعاء', views: Math.floor(viewsCount * 0.25) },
        { name: 'الخميس', views: Math.floor(viewsCount * 0.1) },
        { name: 'الجمعة', views: Math.floor(viewsCount * 0.1) },
      ])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'نقاط المبدع', value: profile?.points || 0, icon: Zap, color: 'from-purple-600/30 to-purple-600/5', iconColor: 'text-purple-400' },
    { label: 'المستوى الحالي', value: Math.floor((profile?.points || 0) / 100) + 1, icon: Award, color: 'from-gold/20 to-gold/5', iconColor: 'text-gold' },
    { label: 'المقالات المنشورة', value: stats.postsCount, icon: FileText, color: 'from-blue-600/20 to-blue-600/5', iconColor: 'text-blue-400' },
    { label: 'مشاهدات الجمهور', value: stats.viewsCount, icon: Eye, color: 'from-orange-600/20 to-orange-600/5', iconColor: 'text-orange-400' },
    isAdmin && { label: 'القنوات المفعلة', value: stats.channelsCount, icon: Tv, color: 'from-green-600/20 to-green-600/5', iconColor: 'text-green-400' },
    isAdmin && stats.pendingRequests > 0 && { label: 'طلبات مبدعين', value: stats.pendingRequests, icon: Sparkles, color: 'from-yellow-600/20 to-yellow-600/5', iconColor: 'text-yellow-400' },
  ].filter(Boolean)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" dir="rtl">
        {[1,2,3,4].map(i => <CardSkeleton key={i} className="h-40 rounded-[2rem]" />)}
      </div>
    )
  }

  return (
    <div className="pb-20" dir="rtl">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-3">
             أهلاً بك، {profile?.full_name?.split(' ')[0] || 'مبدعنا'} <span className="inline-block animate-bounce text-lg">👋</span>
          </h1>
          <p className="text-white/30 mt-1 font-black uppercase tracking-[0.2em] text-[8px]">استوديو مداد للإبداع</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-2 rounded-xl backdrop-blur-3xl">
           <div className="w-7 h-7 bg-purple-600/20 text-purple-400 rounded-lg flex items-center justify-center border border-purple-500/10">
              <Clock size={14} />
           </div>
           <div className="text-right">
              <p className="text-[8px] text-white/30 font-black uppercase tracking-widest leading-none">آخر تحديث</p>
              <p className="text-[9px] font-black text-white mt-0.5">الآن</p>
           </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div 
            key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`relative overflow-hidden bg-gradient-to-br ${card.color} border border-white/5 p-4 md:p-5 rounded-2xl shadow-xl group`}
          >
            <div className={`w-8 h-8 md:w-10 md:h-10 bg-black/40 rounded-lg flex items-center justify-center mb-4 shadow-xl border border-white/5 group-hover:scale-105 transition-all ${card.iconColor}`}>
              <card.icon size={16} />
            </div>
            <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.15em] mb-0.5">{card.label}</p>
            <h3 className="text-lg md:text-2xl font-black tabular-nums text-white group-hover:text-purple-400 transition-colors">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Analytics Chart */}
        <div className="xl:col-span-2 bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-sm font-black flex items-center gap-2 italic text-white uppercase tracking-tight">
                <Zap className="text-purple-500" size={16} /> تحليل المشاهدات
              </h3>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <Suspense fallback={<div className="h-full w-full bg-white/5 rounded-xl animate-pulse" />}>
              <LazyAreaChart data={chartData} />
            </Suspense>
          </div>
        </div>

        {/* Top Content */}
        <div className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black flex items-center gap-2 italic text-white">
              <Award className="text-orange-500" size={16} /> الأكثر قراءة
            </h3>
            <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
               <TrendingUp size={16} className="text-white/20" />
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {stats.topPosts.length > 0 ? stats.topPosts.map((post, idx) => (
              <Link key={post.id} to={`/post/${post.slug}`} className="block group/item relative">
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/0 hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-white/5 rounded-lg flex items-center justify-center font-black text-xs md:text-lg italic group-hover/item:bg-purple-600 group-hover/item:text-white transition-all shrink-0 border border-white/10">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-[10px] md:text-sm truncate text-white/80 group-hover/item:text-white transition-colors">{post.title}</p>
                    <p className="text-[8px] text-white/20 font-black uppercase tracking-widest mt-1 flex items-center gap-1.5">
                      <Eye size={10} className="text-purple-500" /> {post.views.toLocaleString('ar-EG')} مشاهدة
                    </p>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="py-10 text-center opacity-20 italic font-bold text-xs">لا يوجد بيانات</div>
            )}
          </div>
        </div>

        {/* Category Breakdown (New Wonders) */}
        {isAdmin && (
          <div className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Award size={60} className="text-pink-500" /></div>
             <div className="relative z-10 flex flex-col h-full">
                <h3 className="text-sm font-black flex items-center gap-2 italic text-white mb-6">
                  <Sparkles size={16} className="text-pink-400" /> تحليل التصنيفات
                </h3>
                <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
                   {stats.categoryStats.map((cat, i) => (
                     <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group/cat">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center font-black group-hover/cat:bg-pink-500 group-hover/cat:text-white transition-all text-[10px]">#{i+1}</div>
                           <span className="font-black text-[10px] text-white/80">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-black tabular-nums">{cat.count}</span>
                           <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">مقال</span>
                        </div>
                     </div>
                   ))}
                   {stats.categoryStats.length === 0 && <p className="text-white/20 italic text-center py-10 text-xs">لا توجد تصنيفات</p>}
                </div>
                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                   <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">إجمالي المقالات المصنفة</p>
                   <span className="text-xl font-black italic text-pink-400">{stats.categoryStats.reduce((acc, c) => acc + c.count, 0)}</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Quick Actions (الوصول السريع) */}
      <div className="mt-12 flex flex-wrap items-center gap-4">
         <Link to="/studio/new-post" className="bg-white text-black px-8 py-4 rounded-2xl font-black text-xs hover:bg-purple-600 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-2">
            <Plus size={14} /> مقال جديد
         </Link>
         {isAdmin && (
           <Link to="/admin/settings" className="bg-white/5 text-white/40 border border-white/5 px-8 py-4 rounded-2xl font-black text-xs hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
              إعدادات المنصة
           </Link>
         )}
         <button onClick={() => window.location.reload()} className="p-4 bg-white/5 text-white/20 border border-white/5 rounded-2xl hover:text-purple-400 transition-all" title="تحديث البيانات">
            <Clock size={16} />
         </button>
      </div>

      {/* Admin Content Manager (Hero & Trending) */}
      {isAdmin && (
        <AdminFeaturedManager posts={stats.topPosts} />
      )}
    </div>
  )
}

function AdminFeaturedManager({ posts }) {
  const [heroId, setHeroId] = useState(null)
  const [trendingIds, setTrendingIds] = useState([])
  const [loadingSettings, setLoadingSettings] = useState(true)
  const toast = useToast()

  // تحميل البيانات من Supabase
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await PostService.getSiteSettings()

        if (data) {
          setHeroId(data.hero_post_id || null)
          setTrendingIds(data.trending_post_ids || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingSettings(false)
      }
    }
    loadSettings()
  }, [])

  // حفظ في Supabase
  const save = async () => {
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1)
        .single()

      if (existing) {
        await supabase
          .from('site_settings')
          .update({
            hero_post_id: heroId,
            trending_post_ids: trendingIds
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('site_settings')
          .insert({
            hero_post_id: heroId,
            trending_post_ids: trendingIds
          })
      }

      toast.success('تم حفظ الترتيب الجديد للمحتوى بنجاح')
    } catch (err) {
      toast.error('حدث خطأ أثناء الحفظ')
      console.error(err)
    }
  }

  const toggleTrending = (id) => {
    if (trendingIds.includes(id)) {
      setTrendingIds(prev => prev.filter(i => i !== id))
    } else {
      if (trendingIds.length >= 3) return toast.error('يمكنك اختيار 3 مقالات فقط للرائج')
      setTrendingIds(prev => [...prev, id])
    }
  }

  if (loadingSettings) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="mt-12 bg-[#0d0d0d]/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="text-right">
          <h2 className="text-2xl font-black text-white italic flex items-center gap-3">
            <Sparkles className="text-purple-500" /> إدارة المحتوى المتميز
          </h2>
          <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-1">حدد المقال الرئيسي والمقالات الرائجة في الصفحة الرئيسية</p>
        </div>
        <button 
          onClick={save}
          className="bg-white text-black px-10 py-4 rounded-2xl font-black text-sm hover:bg-purple-600 hover:text-white transition-all shadow-xl shadow-purple-600/10 active:scale-95"
        >
          حفظ التغييرات
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">اختر المقال الرئيسي (Hero)</h3>
          <div className="space-y-3">
            {posts.map(post => (
              <div key={`hero-${post.id}`} className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${heroId === post.id ? 'bg-purple-600/10 border-purple-500/40 shadow-lg' : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100'}`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 overflow-hidden shrink-0 italic flex items-center justify-center font-black">
                    {post.title[0]}
                  </div>
                  <p className="text-xs font-black text-white truncate">{post.title}</p>
                </div>
                <button 
                  onClick={() => setHeroId(post.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${heroId === post.id ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/40 hover:bg-white/20'}`}
                >
                  {heroId === post.id ? 'مختار' : 'اختيار'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">اختر الرائج (Trending - 3 مقالات)</h3>
          <div className="space-y-3">
            {posts.map(post => (
              <div key={`trending-${post.id}`} className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${trendingIds.includes(post.id) ? 'bg-orange-600/10 border-orange-500/40 shadow-lg' : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100'}`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 overflow-hidden shrink-0 italic flex items-center justify-center font-black text-orange-400">
                    {post.title[0]}
                  </div>
                  <p className="text-xs font-black text-white truncate">{post.title}</p>
                </div>
                <button 
                  onClick={() => toggleTrending(post.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${trendingIds.includes(post.id) ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/40 hover:bg-white/20'}`}
                >
                  {trendingIds.includes(post.id) ? 'مختار' : 'اختيار'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
