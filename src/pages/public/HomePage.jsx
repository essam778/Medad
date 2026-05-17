import { supabase } from '@/lib/supabase'
import { getFullImageUrl } from '@/lib/utils'
import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  Search, Sparkles, Clock, 
  ChevronRight, ArrowRight, Tv,
  PenTool, Users, Zap, ChevronDown,
  TrendingUp, PlayCircle, Star, Layers,
  MessageSquare, Eye, Heart
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@auth'
import { PostService, PostCard } from '@posts'
import { Helmet } from 'react-helmet-async'
import OptimizedImage from '@/components/shared/OptimizedImage'
import Newsletter from '@/components/shared/Newsletter'

export default function HomePage() {
  const { user, isAdmin, isAuthor } = useAuth()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const tag = searchParams.get('tag') || ''
  
  // Mobile Pagination State
  const [visibleCount, setVisibleCount] = useState(6) // 6 is a good base for desktop, user asked for 4 on mobile, I'll handle that with a useEffect or just start at 6.
  
  useEffect(() => {
    // If mobile, set to 4
    if (window.innerWidth < 768) {
      setVisibleCount(4)
    }
  }, [])

  // 1. Fetch Featured Channels (Standard)
  const { data: featuredChannels = [] } = useQuery({
    queryKey: ['featuredChannels'],
    queryFn: async () => {
      const { data, error } = await PostService.getFeaturedChannels()
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000,
    enabled: !searchQuery // Only show featured if not searching
  })

  // 2. Fetch Searched Channels (Search Mode)
  const { data: searchedChannels = [] } = useQuery({
    queryKey: ['searchChannels', searchQuery],
    queryFn: async () => {
      const { data, error } = await PostService.searchChannels(searchQuery)
      if (error) throw error
      return data || []
    },
    enabled: !!searchQuery // Only run if there is a search query
  })

  // 3. Fetch Posts (Standard or Filtered)
  const { data: posts = [], isLoading: loading } = useQuery({
    queryKey: ['posts', searchQuery, tag],
    queryFn: async () => {
      const { data, error } = await PostService.getPosts({ searchQuery, tag })
      if (error) throw error
      return data || []
    },
    staleTime: 60 * 1000
  })
// 4. Fetch Site Settings (Hero & Trending)
  const { data: siteSettings } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('hero_post_id, trending_post_ids')
        .limit(1)
        .single()
      return data || {}
    },
    staleTime: 5 * 60 * 1000,
    enabled: !searchQuery && !tag
  })
  // 5. Logic for Hero and Trending (Admin Selected)
const { featuredPost, trendingPosts, otherPosts } = useMemo(() => {
  if (searchQuery || tag) {
    return { featuredPost: null, trendingPosts: [], otherPosts: posts }
  }

  const heroId = siteSettings?.hero_post_id || null
  const trendingIds = siteSettings?.trending_post_ids || []

  let hero = null
  let trending = []
  let remaining = []

  if (posts.length > 0) {
    hero = posts.find(p => p.id === heroId) || posts[0]

    const availableForTrending = posts.filter(p => p.id !== hero?.id)
    trendingIds.forEach(id => {
      const p = availableForTrending.find(x => x.id === id)
      if (p) trending.push(p)
    })

    if (trending.length < 3) {
      const extra = availableForTrending
        .filter(p => !trending.find(t => t.id === p.id))
        .slice(0, 3 - trending.length)
      trending = [...trending, ...extra]
    }

    const usedIds = [hero?.id, ...trending.map(t => t.id)]
    remaining = posts.filter(p => !usedIds.includes(p.id))
  }

  return { featuredPost: hero, trendingPosts: trending.slice(0, 3), otherPosts: remaining }
}, [posts, searchQuery, tag, siteSettings])

  return (
    <main className="min-h-screen bg-[#050505] text-white font-arabic pb-24" dir="rtl">
      <Helmet>
        <title>مداد - مستقبل الحبر الرقمي</title>
      </Helmet>

      {/* Hero Section (Hidden if searching) */}
      {!searchQuery && !tag && (
        <section className="container mx-auto px-4 md:px-8 pt-8 md:pt-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3 relative group cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl bg-[#0d0d0d]">
              {featuredPost ? (
                <>
                  <Link to={`/post/${featuredPost.slug}`} className="block aspect-[16/9] relative">
                    <OptimizedImage 
                      src={getFullImageUrl(featuredPost.cover_image_url)} 
                      alt={featuredPost.title}
                      width={1200}
                      height={675}
                      loading="eager"
                      fetchpriority="high"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                  </Link>
                  <div className="absolute bottom-0 right-0 p-8 md:p-12 text-right pointer-events-none w-full">
                    <span className="px-4 py-1.5 bg-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">{featuredPost.tags?.[0] || 'مقال متميز'}</span>
                    <Link to={`/post/${featuredPost.slug}`} className="block text-3xl md:text-6xl font-black mb-6 hover:text-purple-400 transition-colors leading-tight pointer-events-auto line-clamp-2">
                      {featuredPost.title}
                    </Link>
                    <div className="flex items-center gap-6 text-white/60 text-xs font-black">
                      <span className="flex items-center gap-2"><Clock size={14} /> {formatDate(featuredPost.published_at || featuredPost.created_at)}</span>
                      <span className="flex items-center gap-2"><Eye size={14} /> {featuredPost.views || 0}</span>
                      <span className="flex items-center gap-2"><MessageSquare size={14} /> {featuredPost.comments_count || 0}</span>
                      <span className="flex items-center gap-2"><Heart size={14} /> {featuredPost.reactions_count || 0}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="aspect-[16/9] flex items-center justify-center bg-white/5 animate-pulse rounded-[2.5rem]">
                  <p className="text-white/20 font-black">جاري تحميل المحتوى المتميز...</p>
                </div>
              )}
            </div>

            <div className="lg:w-1/3 flex flex-col gap-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black flex items-center gap-3"><TrendingUp className="text-purple-500" /> الرائج الآن</h2>
              </div>
              <div className="space-y-4">
                {trendingPosts.map((post) => (
                  <Link key={`trending-${post.id}`} to={`/post/${post.slug}`} className="block p-6 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all group text-right">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-2">{post.tags?.[0] || 'تحليلات'}</span>
                    <h3 className="text-lg font-black leading-snug group-hover:text-purple-300 transition-colors line-clamp-2">{post.title}</h3>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-[#050505] bg-purple-600 overflow-hidden">
                           <OptimizedImage src={post.profiles?.avatar_url} alt={post.profiles?.full_name} />
                        </div>
                        <span className="text-[10px] text-white/60 font-bold">{post.profiles?.full_name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Feed / Search Content */}
      <div className="container mx-auto px-4 md:px-8 mt-16 space-y-24">
        
        {/* 1. Searched Channels (Only if searching) */}
        {searchQuery && (
          <section>
             <h2 className="text-3xl font-black italic mb-12 text-white/90">القنوات المطابقة لـ "{searchQuery}"</h2>
             {searchedChannels.length > 0 ? (
                <div className="flex flex-wrap gap-8">
                  {searchedChannels.map(channel => (
                    <Link key={channel.channel_slug} to={`/c/${channel.channel_slug}`} className="flex flex-col items-center gap-4 group bg-white/5 p-8 rounded-[3rem] border border-white/5 hover:border-purple-500/30 transition-all">
                        <div className="w-24 h-24 rounded-full p-1 border-2 border-purple-500/20 group-hover:border-purple-500 transition-all shadow-2xl">
                          <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#050505]">
                             <OptimizedImage src={getFullImageUrl(channel.logo_url)} alt={channel.site_name} width={96} height={96} className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div className="text-center">
                           <p className="font-black text-white group-hover:text-purple-400 transition-colors">{channel.site_name}</p>
                           <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">زيارة القناة</p>
                        </div>
                    </Link>
                  ))}
                </div>
             ) : (
                <div className="p-12 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 text-center">
                   <p className="text-white/40 font-black italic">لم نجد قنوات تطابق هذا الاسم.</p>
                </div>
             )}
          </section>
        )}

        {/* 2. Posts (Filtered or General) */}
        <section>
          <div className="flex items-center justify-between mb-12">
            <div className="flex flex-col gap-2">
               <h2 className="text-3xl font-black italic text-white/90 text-right">
                  {searchQuery ? `المقالات والوسوم المطابقة لـ "${searchQuery}"` : tag ? `مقالات في: #${tag}` : 'أحدث المنشورات'}
               </h2>
               {(searchQuery || tag) && (
                  <Link to="/" className="text-xs text-purple-400 font-bold hover:underline">إلغاء الفلترة والعودة للمقالات العامة</Link>
               )}
            </div>
          </div>
          
          {posts.length === 0 && !loading && (
            <div className="py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10 text-center">
               <Search size={48} className="mx-auto text-white/10 mb-6" />
               <p className="text-white/40 font-black italic text-xl">عذراً، لم نجد أي مقالات تطابق بحثك...</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {otherPosts.slice(0, visibleCount).map(post => (
              <Link key={post.id} to={`/post/${post.slug}`} className="group block text-right">
                <div className="aspect-[16/10] rounded-[2.5rem] overflow-hidden border border-white/10 mb-6 relative bg-[#0d0d0d] shadow-2xl">
                  <OptimizedImage 
                    src={getFullImageUrl(post.cover_image_url)} 
                    alt={post.title}
                    width={600}
                    height={375}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" 
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-[#050505]/60 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black border border-white/10 text-white/90">
                      <span className="flex items-center gap-1.5"><Eye size={12} /> {post.views || 0}</span>
                      <span className="flex items-center gap-1.5"><MessageSquare size={12} /> {post.comments_count || 0}</span>
                      <span className="flex items-center gap-1.5"><Heart size={12} /> {post.reactions_count || 0}</span>
                  </div>
                </div>
                <div className="space-y-3">
                   <div className="flex flex-wrap gap-2">
                      {post.tags?.slice(0, 2).map(t => (
                        <span key={t} className="text-[10px] font-black text-purple-400 uppercase tracking-widest">#{t}</span>
                      ))}
                   </div>
                   <h3 className="text-2xl font-black group-hover:text-purple-400 transition-colors leading-tight line-clamp-2">{post.title}</h3>
                   <div className="flex items-center gap-3 pt-2 text-white/80 text-xs font-bold">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-purple-600/20">
                         <OptimizedImage src={post.profiles?.avatar_url} alt={post.profiles?.full_name} width={24} height={24} />
                      </div>
                      <span>{post.profiles?.full_name}</span>
                   </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Load More Button (Mobile Focused) */}
          {visibleCount < otherPosts.length && (
            <div className="mt-16 flex justify-center">
              <button 
                onClick={() => setVisibleCount(prev => prev + 4)}
                aria-label="تحميل المزيد من المقالات"
                title="عرض المزيد من المقالات"
                className="w-full md:w-fit bg-white/5 border border-white/10 text-white px-12 py-5 rounded-2xl font-black text-sm hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl"
              >
                عرض المزيد من المقالات
                <ChevronDown size={20} />
              </button>
            </div>
          )}
        </section>

        {/* Featured Authors (Standard Mode) */}
        {!searchQuery && (
          <section className="pt-12 border-t border-white/5">
            <h2 className="text-3xl font-black text-white/90 mb-12">مبدعون ننصح بمتابعتهم</h2>
            <div className="flex flex-wrap gap-10 md:gap-16">
              {featuredChannels.map((channel, idx) => (
                <Link key={`creator-${idx}`} to={`/c/${channel.channel_slug}`} className="flex flex-col items-center gap-4 group">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 border-2 border-purple-500/10 group-hover:border-purple-500 transition-all shadow-2xl bg-white/5">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#050505]">
                          <OptimizedImage src={getFullImageUrl(channel.logo_url)} alt={channel.site_name} width={128} height={128} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />
                      </div>
                    </div>
                    <span className="text-sm font-black text-white/80 group-hover:text-white transition-colors">{channel.site_name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Newsletter />
      </div>
    </main>
  )
}


