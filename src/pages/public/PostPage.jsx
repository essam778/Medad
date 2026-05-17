import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '@auth'
import { formatDate, getFullImageUrl } from '@/lib/utils'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import NoticeModal from '../../components/shared/NoticeModal'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, User, Clock, Share2, 
  Heart, MessageCircle, ChevronLeft, Bookmark,
  Sparkles, Hash, BookmarkCheck, Copy, Check, Send,
  Eye, ArrowRight, LogIn, List, ThumbsUp, MessageSquare
} from 'lucide-react'
import { PostService, CommentSection } from '@posts'
import { NotificationService } from '@/services/notification.service'
import DOMPurify from 'dompurify'
import OptimizedImage from '@/components/shared/OptimizedImage'

export default function PostPage() {
  const { slug } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [authorChannel, setAuthorChannel] = useState(null)
  const [comments, setComments] = useState([])
  const [notice, setNotice] = useState({ open: false, title: '', message: '', variant: 'info', onAction: null })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [readTime, setReadTime] = useState(0)
  const [following, setFollowing] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [hidePopover, setHidePopover] = useState(false)
  const [toc, setToc] = useState([])
  const [reactionStats, setReactionStats] = useState({ like: 0, love: 0, haha: 0, sad: 0, angry: 0, total: 0 })
  const reactionTimeoutRef = useRef(null)


  useEffect(() => {
    if (post?.content) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(post.content, 'text/html')
      const headers = Array.from(doc.querySelectorAll('h2, h3')).map((h, i) => {
        const id = `heading-${i}`
        return { text: h.innerText, level: h.tagName, id }
      })
      setToc(headers)
    }
  }, [post])

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.scrollY / totalHeight) * 100
      setScrollProgress(progress)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (post?.content) {
      const words = post.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length
      const time = Math.ceil(words / 200)
      setReadTime(time)
    }
  }, [post])

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchPost()
  }, [slug, user])

  async function fetchPost() {
    setLoading(true)
    try {
      const { data, error } = await PostService.getPostBySlug(slug)
      if (error) throw error
      
      // Increment views once per session
      const viewedKey = `viewed_${data.id}`
      if (!sessionStorage.getItem(viewedKey)) {
        await PostService.incrementViews(data.id)
        sessionStorage.setItem(viewedKey, 'true')
        data.views = (data.views || 0) + 1 // Update local state immediately
      }

      setPost(data)
      setLikeCount(data.likes_count || 0)

      const { data: channelData } = await PostService.getAuthorChannel(data.author_id)
      setAuthorChannel(channelData)

      const { data: commentsData } = await PostService.getComments(data.id)
      setComments(commentsData || [])

      if (user) {
        const { data: likeData } = await PostService.checkLikeStatus(data.id, user.id)
        setLiked(likeData ? likeData.type : false)
        const { data: saveData } = await PostService.checkSaveStatus(data.id, user.id)
        setSaved(!!saveData)
        const { data: followData } = await PostService.checkFollowStatus(user.id, data.author_id)
        setFollowing(!!followData)
      }

      // Fetch Reaction Breakdown
      const { data: counts } = await PostService.getReactionCounts(data.id)
      if (counts) {
        const total = Object.values(counts).reduce((a, b) => a + b, 0)
        setReactionStats({
          like: counts.like || 0,
          love: counts.love || 0,
          haha: counts.haha || 0,
          sad: counts.sad || 0,
          angry: counts.angry || 0,
          total: total
        })
      }

    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const showAuthNotice = (action) => {
    setNotice({
      open: true,
      title: 'تسجيل الدخول مطلوب',
      message: `يجب عليك تسجيل الدخول لتتمكن من ${action}. انضم لمداد الآن وشاركنا إبداعك.`,
      variant: 'info'
    })
  }

  const toggleAuthorFollow = async () => {
    if (!user) return showAuthNotice('متابعة المبدعين')
    
    // Warning before Unfollow
    if (following) {
      setNotice({
        open: true,
        title: 'إلغاء المتابعة؟',
        message: `هل أنت متأكد أنك تريد إلغاء متابعة "${authorChannel?.site_name}"؟ لن تصلك إشعارات بمنشوراته الجديدة بعد الآن.`,
        variant: 'warning',
        onAction: async () => {
          await PostService.toggleFollow(user.id, post.author_id)
          setFollowing(false)
          setNotice(prev => ({ ...prev, open: false }))
        }
      })
      return
    }

    try {
      await PostService.toggleFollow(user.id, post.author_id)
      setFollowing(true)
    } catch (err) { console.error(err) }
  }

  async function handleReaction(type) {
    if (!user) return showAuthNotice('التفاعل مع المقالات')
    
    // Immediate UI Feedback
    const prevLiked = liked
    setLiked(liked === type ? false : type)
    setHidePopover(true)

    // Operational Safety (Debouncing): Prevent network spamming
    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current)
    
    reactionTimeoutRef.current = setTimeout(async () => {
      try {
        await PostService.setReaction(post.id, user.id, type)
        // Refresh stats from server for 100% accuracy
        const { data: counts } = await PostService.getReactionCounts(post.id)
        if (counts) {
          const total = Object.values(counts).reduce((a, b) => a + b, 0)
          setReactionStats({
            like: counts.like || 0,
            love: counts.love || 0,
            haha: counts.haha || 0,
            sad: counts.sad || 0,
            angry: counts.angry || 0,
            total: total
          })
        }
      } catch (err) {
        setLiked(prevLiked)
      }
    }, 500)
  }

  const handleLongPressStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setShowEmojis(true)
    }, 500) // Show emojis after 500ms
  }

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
  }

  async function toggleSave() {
    if (!user) return showAuthNotice('حفظ المقالات لمراجعتها لاحقاً')
    try {
      await PostService.toggleSave(post.id, user.id)
      setSaved(!saved)
    } catch (err) { console.error(err) }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url: window.location.href }) } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }


  if (loading) return <LoadingSpinner fullPage />
  if (!post) return <div className="min-h-screen bg-[#050505] flex items-center justify-center font-black">المقال غير موجود</div>

  return (
    <div className="min-h-screen bg-[#050505] text-white font-arabic pb-32" dir="rtl">
      <Helmet>
        <title>{post.title} | {authorChannel?.site_name || 'مداد'}</title>
      </Helmet>
      
      <NoticeModal
        open={notice.open}
        title={notice.title}
        message={notice.message}
        variant={notice.variant}
        onAction={notice.onAction}
        onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
      />

      <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-white/5 pointer-events-none origin-right">
        <motion.div 
          className="h-full bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.5)] origin-right" 
          style={{ scaleX: scrollProgress / 100 }}
        />
      </div>

      <header className="relative w-full h-[60vh] md:h-[85vh] flex items-end pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <OptimizedImage 
            src={getFullImageUrl(post.cover_image_url)} 
            alt={post.title}
            width={1600}
            height={900}
            loading="eager"
            fetchpriority="high"
            className="w-full h-full object-cover scale-105 blur-sm brightness-[0.3]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
        </div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6 text-purple-400 font-black text-xs uppercase tracking-widest">
               <span className="bg-purple-600/20 px-4 py-2 rounded-xl border border-purple-500/20"># {post.tags?.[0] || 'تحليل'}</span>
               {post.views > 100 && (
                 <span className="bg-orange-500/10 text-orange-400 px-4 py-2 rounded-xl border border-orange-500/20 flex items-center gap-2 animate-pulse">
                    <Sparkles size={12} /> رائج الآن
                 </span>
               )}
               <span className="flex items-center gap-2 text-white/80"><Clock size={16} /> {readTime} دقائق قراءة</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black italic leading-[1.1] mb-12 drop-shadow-2xl">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-6">
              {authorChannel && (
                <Link to={`/c/${authorChannel.channel_slug}`} className="flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-2 pl-8 rounded-full hover:bg-white/10 transition-all group">
                   <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/30">
                       <OptimizedImage src={getFullImageUrl(authorChannel.logo_url)} alt={authorChannel.site_name} width={48} height={48} className="w-full h-full object-cover" />
                   </div>
                   <div className="text-right">
                       <p className="text-xs font-black group-hover:text-purple-400 transition-colors">{authorChannel.site_name}</p>
                       <p className="text-[10px] text-white/80 font-bold">زيارة القناة</p>
                   </div>
                </Link>
              )}
              <button onClick={toggleAuthorFollow} className={`px-10 py-3.5 rounded-full text-xs font-black transition-all ${following ? 'bg-white/10 border border-white/10 text-white/80' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-xl shadow-purple-600/20'}`}>
                {following ? 'متابع ✓' : 'متابعة المبدع'}
              </button>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 -mt-20 relative z-20">
        <div className="flex flex-col lg:flex-row gap-16">
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-32 space-y-8 p-8 bg-[#0d0d0d]/50 backdrop-blur-3xl border border-white/5 rounded-[3rem] shadow-2xl">
              <div className="flex items-center gap-3 text-purple-400 font-black text-xs uppercase tracking-widest"><List size={18} /> فهرس المحتويات</div>
              <nav className="flex flex-col gap-4">
                {toc.map((item, i) => (
                  <button key={i} onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })} className={`text-right text-sm font-bold transition-all hover:text-purple-400 ${item.level === 'H3' ? 'pr-6 text-white/70 text-xs' : 'text-white/70'}`}>{item.text}</button>
                ))}
              </nav>
            </div>
          </aside>
          <article className="flex-1 max-w-4xl">
            <div className="aspect-video rounded-[3rem] overflow-hidden border border-white/10 mb-16 shadow-2xl">
                <OptimizedImage src={getFullImageUrl(post.cover_image_url)} alt={post.title} width={1200} height={675} className="w-full h-full object-cover" />
            </div>
            <div className="prose prose-invert prose-purple max-w-none prose-p:text-white/90 prose-p:text-xl prose-p:leading-[1.8] prose-p:font-bold prose-p:mb-10 prose-headings:font-black prose-headings:italic prose-headings:mb-8 prose-headings:text-white prose-h2:text-3xl md:prose-h2:text-5xl prose-h2:mt-20 prose-blockquote:border-r-4 prose-blockquote:border-purple-600 prose-blockquote:bg-purple-600/5 prose-blockquote:p-8 prose-blockquote:rounded-3xl prose-blockquote:italic prose-img:rounded-[2.5rem] prose-img:shadow-2xl prose-img:border prose-img:border-white/5" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content).replace(/<(h[23])>(.*?)<\/\1>/gi, (match, tag, content, offset) => `<${tag} id="heading-${offset}">${content}</${tag}>`) }} />
            <div className="mt-32 pt-16 border-t border-white/5" id="comments-section">
                <CommentSection postId={post.id} initialComments={comments} user={user} profile={profile} disabled={post.comments_disabled} />
            </div>
          </article>
        </div>
      </main>

      {/* Floating Bar - DEFINITIVE CENTERED FIX (No-transform Outer Container for Mobile GPU) */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-0 right-0 z-[110] flex justify-center pointer-events-none px-4"
      >
        <div className="bg-[#0d0d0d]/95 md:bg-[#0d0d0d]/90 md:backdrop-blur-3xl border border-white/10 rounded-full px-4 md:px-10 py-2.5 md:py-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2 md:gap-10 pointer-events-auto max-w-[95vw] md:max-w-none">
          
          {/* Reaction */}
          <div 
            className="relative flex items-center"
            onMouseEnter={() => setShowEmojis(true)}
            onMouseLeave={() => setShowEmojis(false)}
          >
            <AnimatePresence>
              {showEmojis && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#050505]/98 md:bg-[#050505]/95 md:backdrop-blur-2xl border border-white/10 p-3 rounded-[2.5rem] shadow-2xl z-[120]"
                >
                  {['like', 'love', 'haha', 'sad', 'angry'].map(type => (
                    <button key={type} onClick={() => { handleReaction(type); setShowEmojis(false) }} className="flex flex-col items-center gap-1 hover:scale-125 hover:-translate-y-2 transition-transform px-2 group/emoji">
                      <span className="text-2xl md:text-3xl">{type === 'like' ? '👍' : type === 'love' ? '❤️' : type === 'haha' ? '😂' : type === 'sad' ? '😢' : '😡'}</span>
                      <span className="text-[8px] font-black text-white/20 group-hover/emoji:text-purple-400 tabular-nums">{reactionStats[type] || 0}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              onClick={() => { if(!showEmojis) handleReaction(liked || 'like') }} 
              className={`flex items-center gap-2 font-black text-[10px] md:text-sm px-2 py-2 rounded-full transition-all ${liked ? 'text-purple-400' : 'text-white/70 hover:text-white'}`}
            >
              <span className="text-xl md:text-2xl">{liked ? (liked === 'like' ? '👍' : liked === 'love' ? '❤️' : liked === 'haha' ? '😂' : liked === 'sad' ? '😢' : '😡') : <ThumbsUp size={20} />}</span>
              <div className="flex flex-col items-start leading-none">
                 <span className="hidden sm:inline text-[9px] mb-0.5">{liked ? 'تفاعلت' : 'أعجبني'}</span>
                 <span className="text-[10px] tabular-nums text-white/70">{reactionStats.total.toLocaleString('ar-EG')}</span>
              </div>
            </button>
          </div>

          <div className="w-[1px] h-6 bg-white/10 shrink-0" />

          {/* Comment */}
          <button onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-2 text-white/70 hover:text-white font-black text-[10px] md:text-sm px-2 py-2 transition-all shrink-0">
            <MessageSquare size={20} />
            <span className="hidden sm:inline">تعليق</span>
            {comments.length > 0 && <span className="bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-lg ml-1">{comments.length}</span>}
          </button>

          {/* Share */}
          <button onClick={handleShare} className="flex items-center gap-2 text-white/70 hover:text-white font-black text-[10px] md:text-sm px-2 py-2 transition-all shrink-0">
             {copied ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
             <span className="hidden sm:inline">{copied ? 'تم النسخ' : 'مشاركة'}</span>
          </button>

          {/* Save */}
          <button onClick={toggleSave} className={`flex items-center gap-2 font-black text-[10px] md:text-sm px-2 py-2 rounded-full transition-all ${saved ? 'text-purple-400' : 'text-white/70 hover:text-white'} shrink-0`}>
             <Bookmark size={20} className={saved ? 'fill-purple-400' : ''} />
             <span className="hidden sm:inline">{saved ? 'محفوظ' : 'حفظ'}</span>
          </button>

        </div>
      </motion.div>
    </div>
  )
}


