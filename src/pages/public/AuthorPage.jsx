import { getFullImageUrl } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { PostService } from '@/features/posts/services/post.service'
import { ProfileService } from '@/features/auth/services/profile.service'
import { supabase } from '../../lib/supabase'
import { useAuth } from '@auth'
import { formatDate } from '../../lib/utils'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import NoticeModal from '../../components/shared/NoticeModal'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, FileText, Share2, Tv, UserPlus, UserCheck, Bell, PenLine, Layers, TrendingUp, ArrowRight, ListVideo, PlayCircle, Eye, Clock } from 'lucide-react'
import OptimizedImage from '../../components/shared/OptimizedImage'

export default function AuthorPage() {
  const { slug: rawSlug } = useParams()
  const slug = rawSlug?.replace('@', '').trim().toLowerCase()
  const { user, profile, isAdmin, isAuthor } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState(null)
  const [posts, setPosts] = useState([])
  const [playlists, setPlaylists] = useState({})
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState({ open: false, title: '', message: '', variant: 'info' })
  
  const [activeTab, setActiveTab] = useState('posts') 
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)

  function showNotice(title, message, variant = 'info') {
    setNotice({ open: true, title, message, variant })
  }

  useEffect(() => {
    if (slug) {
      fetchChannelData()
    } else {
      setLoading(false)
      setError('رابط القناة غير صحيح')
    }
  }, [slug, user])

  async function fetchChannelData() {
    setLoading(true)
    setError(null)
    try {
      const { data: channelData } = await PostService.getChannelBySlug(slug)
      if (!channelData) throw new Error('القناة غير موجودة')

      const { data: profileData } = await ProfileService.getProfile(channelData.author_id)
      setChannel({ ...channelData, profiles: profileData })

      const { data: postsData } = await PostService.getAuthorPosts(channelData.author_id)
      setPosts(postsData || [])

      const { data: collectionsData } = await PostService.getCollectionsByAuthor(channelData.author_id)

      const grouped = {}
      ;(collectionsData || []).forEach(collection => {
        const validPosts = (collection.collection_posts || [])
          .map(cp => cp.posts)
          .filter(p => p && p.status === 'published')
          .sort((a, b) => new Date(a.published_at) - new Date(b.published_at))
        
        if (validPosts.length > 0) {
          grouped[collection.name] = validPosts
        }
      })
      setPlaylists(grouped)

      const count = await PostService.getFollowersCount(channelData.author_id)
      setFollowerCount(count)

      if (user) {
        const { data: followData } = await PostService.checkFollowStatus(user.id, channelData.author_id)
        setFollowing(!!followData)
      }
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  async function toggleFollow() {
    if (!user) {
      showNotice('تسجيل الدخول مطلوب', 'يرجى تسجيل الدخول لمتابعة القناة.')
      return
    }
    if (!channel?.author_id) return
    if (user.id === channel.author_id) {
      showNotice('لا يمكن المتابعة', 'لا يمكنك متابعة قناتك الخاصة.')
      return
    }

    try {
      await PostService.toggleFollow(user.id, channel.author_id)
      setFollowing(!following)
      const count = await PostService.getFollowersCount(channel.author_id)
      setFollowerCount(count)
    } catch (err) { console.error(err) }
  }

  if (loading) return <LoadingSpinner fullPage />
  if (error) return (
    <div className="min-h-screen flex flex-col bg-[#050505] items-center justify-center text-center p-6">
      <Tv size={64} className="text-white/10 mb-8" />
      <h1 className="text-2xl text-white font-black mb-8">{error}</h1>
      <Link to="/writers" className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-purple-600/20 hover:bg-purple-500 transition-all">استكشاف القنوات</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white font-arabic pb-24" dir="rtl">
      <NoticeModal
        open={notice.open}
        title={notice.title}
        message={notice.message}
        variant={notice.variant}
        onAction={notice.onAction}
        onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
      />

      {/* Channel Header (Premium) */}
      <div className="relative pt-24 md:pt-32 pb-16 overflow-hidden">
        {/* Background Decorative */}
        <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-purple-600/10 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

         <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-10 md:gap-16">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="relative"
            >
              <div className="w-44 h-44 md:w-64 md:h-64 rounded-[3.5rem] p-1.5 border-2 border-purple-500/20 shadow-[0_50px_100px_rgba(0,0,0,0.5)] bg-[#050505] rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-[3rem] overflow-hidden border-4 border-[#0d0d0d] bg-[#0d0d0d]">
                  <OptimizedImage src={getFullImageUrl(channel.logo_url)} alt={channel.site_name} width={256} height={256} fetchpriority="high" loading="eager" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center border-4 border-[#050505] shadow-xl">
                 <Tv size={20} />
              </div>
            </motion.div>

            <div className="flex-1 text-center md:text-right space-y-6">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-none">{channel.site_name}</h1>
                {user?.id !== channel.author_id && (
                  <button 
                    onClick={toggleFollow}
                    className={`px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-2xl ${
                      following ? 'bg-white/10 text-white border border-white/10' : 'bg-white text-black hover:bg-purple-600 hover:text-white'
                    }`}
                  >
                    {following ? 'متابع ✓' : 'متابعة القناة'}
                  </button>
                )}
              </div>
              
              <p className="text-white/40 text-lg md:text-2xl font-bold max-w-3xl leading-relaxed italic">
                {channel.site_description || 'نشارككم أعمق الأفكار والقصص التي تستحق القراءة.'}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                 {[
                   { label: 'متابع', value: followerCount, icon: UserPlus },
                   { label: 'مقال', value: posts.length, icon: FileText },
                   { label: 'مشاهدة', value: posts.reduce((acc, p) => acc + (p.views || 0), 0), icon: Eye },
                 ].map((stat, i) => (
                   <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/5 px-6 py-3 rounded-2xl">
                      <stat.icon size={16} className="text-purple-500" />
                      <span className="text-lg font-black tabular-nums">{stat.value.toLocaleString('ar-EG')}</span>
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{stat.label}</span>
                   </div>
                 ))}
                 <button className="mr-auto md:mr-0 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-white">
                    <Share2 size={20} />
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <main className="container mx-auto px-4 md:px-8 mt-12">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] w-fit mb-16 mx-auto md:mx-0 max-w-full overflow-x-auto no-scrollbar">
          {[
            { id: 'posts', label: 'المقالات', icon: FileText },
            { id: 'trending', label: 'الرائج', icon: TrendingUp },
            { id: 'playlists', label: 'سلاسل المعرفة', icon: ListVideo },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedPlaylist(null); }}
              className={`flex items-center gap-2 px-6 md:px-8 py-3 rounded-full text-xs md:text-sm font-black transition-all shrink-0 ${
                activeTab === tab.id ? 'bg-purple-600 text-white shadow-xl' : 'text-white/40 hover:text-white'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selectedPlaylist ? (
            <motion.div key="playlist-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
               <button onClick={() => setSelectedPlaylist(null)} className="flex items-center gap-3 text-white/40 hover:text-white font-black text-sm transition-all group">
                 <ArrowRight className="group-hover:-translate-x-2 transition-transform" /> العودة للقوائم
               </button>
               <div className="flex flex-col md:flex-row gap-8 items-center md:items-end mb-16">
                  <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center text-purple-400 border border-purple-500/20"><ListVideo size={32} /></div>
                  <div>
                    <h2 className="text-3xl md:text-5xl font-black italic">{selectedPlaylist}</h2>
                    <p className="text-white/40 font-bold mt-2">تتضمن هذه السلسلة {playlists[selectedPlaylist].length} أجزاء معرفية.</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {playlists[selectedPlaylist].map((post, i) => (
                    <PostCard key={post.id} post={post} index={i} isPlaylist getFullImageUrl={getFullImageUrl} />
                  ))}
               </div>
            </motion.div>
          ) : (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {activeTab === 'playlists' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {Object.entries(playlists).map(([name, pPosts], idx) => (
                    <button key={name} onClick={() => setSelectedPlaylist(name)} className="text-right group block">
                      <div className="aspect-video bg-[#0d0d0d] rounded-[2.5rem] overflow-hidden mb-6 relative border border-white/5 group-hover:border-purple-500/30 transition-all shadow-2xl">
                        <OptimizedImage src={getFullImageUrl(pPosts[0]?.cover_image_url)} alt={name} width={600} height={337} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-y-0 right-0 w-28 bg-[#050505]/80 backdrop-blur-xl flex flex-col items-center justify-center border-l border-white/10">
                           <ListVideo size={32} className="text-purple-400 mb-3" />
                           <span className="font-black text-xl">{pPosts.length}</span>
                        </div>
                        <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pr-28">
                            <PlayCircle size={48} className="text-white drop-shadow-2xl" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-black mb-2 group-hover:text-purple-400 transition-colors">{name}</h3>
                      <p className="text-white/40 text-xs font-black uppercase tracking-widest">اضغط لعرض السلسلة</p>
                    </button>
                  ))}
                  {Object.keys(playlists).length === 0 && <EmptyState message="لم يتم إنشاء قوائم تشغيل لهذه القناة بعد." />}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {(activeTab === 'posts' ? posts : [...posts].sort((a,b) => (b.views||0) - (a.views||0))).map((post, i) => (
                    <PostCard key={post.id} post={post} index={i} getFullImageUrl={getFullImageUrl} />
                  ))}
                  {posts.length === 0 && <EmptyState message="لا توجد منشورات حالياً في هذه القناة." />}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function PostCard({ post, index, isPlaylist, getFullImageUrl }) {
  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Link to={`/post/${post.slug}`} className="block">
        <div className="aspect-[16/10] bg-[#0d0d0d] rounded-[2.5rem] overflow-hidden mb-6 border border-white/5 group-hover:border-purple-500/30 transition-all shadow-2xl relative">
          <OptimizedImage 
            src={getFullImageUrl(post.cover_image_url)} 
            alt={post.title}
            width={600}
            height={375}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            fallback="https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop"
          />
          {isPlaylist && (
            <div className="absolute top-4 right-4 bg-purple-600 px-4 py-1.5 rounded-full text-[10px] font-black shadow-xl">الجزء {index + 1}</div>
          )}
          <div className="absolute bottom-4 right-4 bg-[#050505]/60 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black border border-white/10 text-white/80">
            {post.views || 0} مشاهدة
          </div>
        </div>
        <h3 className="text-xl md:text-2xl font-black mb-3 leading-tight group-hover:text-purple-400 transition-colors line-clamp-2">{post.title}</h3>
        <div className="flex items-center gap-4 text-[10px] font-black text-white/60 uppercase tracking-widest">
           <span className="flex items-center gap-1.5"><Clock size={14} /> {formatDate(post.published_at)}</span>
        </div>
      </Link>
    </motion.article>
  )
}

function EmptyState({ message }) {
  return (
    <div className="col-span-full py-32 bg-white/5 rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center gap-6">
       <Layers size={48} className="text-white/10" />
       <p className="text-white/40 font-black italic text-xl">{message}</p>
    </div>
  )
}

