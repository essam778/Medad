import { useState, useEffect, lazy, Suspense } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '@auth'
import { useUpsertPost, usePostById } from '@posts'
import { uploadImage, supabase } from '../../lib/supabase'
import { generateSlug } from '../../lib/utils'
import { ArrowRight, Upload, X, Tag as TagIcon, Plus, Save, Send, Image as ImageIcon, Settings as SettingsIcon, Layout, Sparkles, Loader2, LayoutDashboard, Clock, Youtube, Wand2 } from 'lucide-react'
import { useToast } from '../../components/shared/ToastProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { NotificationService } from '../../services/notification.service'
import { PostService } from '@posts'
import DOMPurify from 'dompurify'
import NoticeModal from '../../components/shared/NoticeModal'

const RichEditor = lazy(() => import('../../components/editor/RichEditor'))

const INITIAL = {
  title: '', slug: '', content: '', cover_image_url: '',
  tags: [], series: '', status: 'draft', seo_title: '', seo_description: '', scheduled_for: '',
  comments_disabled: false,
}

export default function PostEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile, updateProfile } = useAuth()
  const upsertPost = useUpsertPost()
  const { data: existing, isLoading: loadingPost } = usePostById(id)

  const [form, setForm] = useState(INITIAL)
  const [tagInput, setTagInput] = useState('')
  const [availableTags, setAvailableTags] = useState([])
  const [availableSeries, setAvailableSeries] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState({ open: false, title: '', message: '', variant: 'info', onAction: null })
  const [youtubeModal, setYoutubeModal] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [manualText, setManualText] = useState('')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const toast = useToast()

  useEffect(() => {
    async function fetchTags() {
      try {
        const data = await PostService.getTags()
        if (data) {
          const names = data.map(t => t.name)
          setAvailableTags(names.filter(t => !t.startsWith('series:')))
          setAvailableSeries(names.filter(t => t.startsWith('series:')).map(t => t.replace('series:', '')))
        }
      } catch (err) { console.error(err) }
    }
    fetchTags()
  }, [])

  useEffect(() => {
    if (existing) {
      const allTags = existing.tags || []
      const seriesTag = allTags.find(t => t.startsWith('series:'))
      const regularTags = allTags.filter(t => !t.startsWith('series:'))

      setForm({
        ...INITIAL,
        ...existing,
        tags: regularTags,
        series: seriesTag ? seriesTag.replace('series:', '') : '',
        scheduled_for: existing.scheduled_for ? new Date(existing.scheduled_for).toISOString().slice(0, 16) : '',
      })
    } else {
      const saved = localStorage.getItem('midad_post_draft')
      if (saved) {
        try {
          const { is_autosaved: _old, ...rest } = JSON.parse(saved)
          setForm(prev => ({ ...prev, ...rest }))
          toast.success('تم استعادة المسودة التلقائية')
        } catch (e) { console.error('Failed to load autosave') }
      }
    }
  }, [existing])

  useEffect(() => {
    if (!id && (form.title || form.content)) {
      const timeout = setTimeout(() => {
        localStorage.setItem('midad_post_draft', JSON.stringify({
          title: form.title,
          content: form.content,
          tags: form.tags,
          series: form.series,
          cover_image_url: form.cover_image_url
        }))
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [form, id])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  async function handleCoverUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, 'covers')
      set('cover_image_url', url)
      toast.success('تم رفع الغلاف بنجاح')
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setUploading(false) }
  }

  function handleTitleChange(e) {
    const title = e.target.value
    setForm(prev => ({
      ...prev,
      title,
      slug: id ? prev.slug : generateSlug(title)
    }))
  }

  function addTag(tag) {
    const t = tag.trim().toLowerCase()
    if (t && !form.tags.includes(t)) {
      set('tags', [...form.tags, t])
      setTagInput('')
    }
  }

  const removeTag = (tag) => set('tags', form.tags.filter(t => t !== tag))

  async function handleManualSummarize() {
    if (!manualText.trim()) return toast.error('يرجى لصق النص أولاً')
    setIsSummarizing(true)
    try {
      const { data, error } = await supabase.functions.invoke('youtube-summarize', {
        body: { text: manualText }
      })
      if (error) throw error
      if (data && data.success) {
        setForm(prev => ({ 
          ...prev, 
          title: data.title || prev.title,
          content: data.article 
        }))
        toast.success('تم توليد المقال بنجاح!')
        setYoutubeModal(false)
        setManualText('')
      }
    } catch (err) { toast.error('فشل معالجة النص') }
    finally { setIsSummarizing(false) }
  }

  async function handleAIImprove() {
    if (!form.content.trim()) return toast.error('يرجى كتابة نص أولاً لتحسينه')
    setIsSummarizing(true)
    try {
      const { data, error } = await supabase.functions.invoke('youtube-summarize', {
        body: { text: form.content, type: 'improve' }
      })
      if (error) throw error
      if (data?.article) {
        setForm(prev => ({ ...prev, content: data.article }))
        toast.success('تم تحسين المقال بنجاح!')
      }
    } catch (err) { toast.error('فشل تحسين النص') }
    finally { setIsSummarizing(false) }
  }

 async function handleYoutubeSummarize() {
  if (!youtubeUrl.trim()) return toast.error('يرجى إدخال الرابط أولاً')
  setIsSummarizing(true)
  try {
    const { data, error } = await supabase.functions.invoke('youtube-summarize', {
      body: { url: youtubeUrl }
    })
    if (error) throw error

    if (data?.success) {
      setForm(prev => ({ 
        ...prev, 
        title: data.title || prev.title, 
        content: data.article 
      }))
      toast.success('تم التلخيص بنجاح!')
      setYoutubeModal(false)
      setYoutubeUrl('')
    } else {
      throw new Error(data?.error || 'فشل التلخيص')
    }
  } catch (err) {
    setNotice({
      open: true,
      title: 'فشل السحب الذكي',
      message: err.message || 'تعذر جلب النص. جرب فيديو آخر أو انسخ النص يدوياً.',
      variant: 'warning'
    })
  } finally { 
    setIsSummarizing(false) 
  }
}

  async function handleSave(statusOverride) {
    if (!form.title.trim() || !form.content.trim()) return toast.error('يرجى ملء العنوان والمحتوى')
    setSaving(true)
    try {
      const sanitizedContent = DOMPurify.sanitize(form.content)
      const finalTags = form.series ? [...form.tags, `series:${form.series}`] : form.tags
      const { series: _series, ...rest } = form
      const savedPost = await upsertPost.mutateAsync({
        ...rest,
        tags: finalTags,
        content: sanitizedContent,
        id: id || undefined,
        status: statusOverride || form.status,
        author_id: user.id,
        scheduled_for: form.scheduled_for || null,
      })
      if ((statusOverride || form.status) === 'published' && !id && savedPost?.id) {
        console.log('New post published! Awarding points via RPC...');
        await NotificationService.notifyFollowers(user.id, profile?.full_name, savedPost)
        
        try {
          // استخدام RPC لزيادة النقاط بأمان
          const { error: rpcError } = await supabase.rpc('increment_user_points', { 
            user_id: user.id, 
            points_to_add: 10 
          });

          if (rpcError) {
            console.error('RPC Points failed, trying manual fallback:', rpcError);
            // محاولة يدوية في حال عدم وجود الدالة بعد
            const { data: pData } = await supabase.from('profiles').select('points').eq('id', user.id).single();
            const nextPoints = (pData?.points || 0) + 10;
            await supabase.from('profiles').update({ points: nextPoints }).eq('id', user.id);
            if (typeof updateProfile === 'function') updateProfile({ points: nextPoints });
          } else {
            console.log('Points awarded via RPC!');
            // تحديث الواجهة بجلب القيمة الجديدة
            const { data: pData } = await supabase.from('profiles').select('points').eq('id', user.id).single();
            if (pData && typeof updateProfile === 'function') {
              updateProfile({ points: pData.points });
            }
          }
        } catch (err) {
          console.error('Final points error:', err);
        }
      }
      
      localStorage.removeItem('midad_post_draft')
      
      toast.success('تم الحفظ بنجاح')
      navigate('/admin/posts')
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setSaving(false) }
  }

  if (loadingPost) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" size={48} /></div>

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 lg:p-12 font-['Inter',sans-serif] selection:bg-purple-600/30">
      <Helmet><title>{id ? 'تعديل المقال' : 'مقال جديد'} | مداد</title></Helmet>
      
      <NoticeModal 
        open={notice.open} 
        onClose={() => setNotice(prev => ({ ...prev, open: false }))} 
        title={notice.title} 
        message={notice.message} 
        variant={notice.variant}
        onAction={notice.onAction}
      />

      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/posts" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all border border-white/5"><ArrowRight size={24} /></Link>
          <h1 className="text-2xl md:text-3xl font-black italic">{id ? 'تحرير المقال' : 'مقال جديد'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setYoutubeModal(true)} className="px-6 py-3 bg-red-600/10 text-red-500 rounded-xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 border border-red-500/20"><Youtube size={16} /> ذكاء يوتيوب</button>
          <button onClick={() => handleSave('draft')} disabled={saving} className="px-4 py-3 bg-white/5 rounded-xl text-[10px] font-black hover:text-white transition-all">مسودة</button>
          <button onClick={() => handleSave(form.scheduled_for ? 'scheduled' : 'published')} disabled={saving} className="px-8 py-3 bg-purple-600 text-white rounded-xl text-[10px] font-black hover:bg-purple-500 transition-all active:scale-95">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {saving ? 'جارٍ...' : (form.scheduled_for ? 'جدولة' : 'نشر')}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8 text-right">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl">
            <textarea value={form.title} onChange={handleTitleChange} placeholder="عنوان المقال..." rows={2} className="w-full text-xl md:text-3xl font-black border-none outline-none bg-transparent text-white resize-none italic text-right" />
            <div className="flex items-center justify-end gap-2 text-[8px] bg-white/5 w-fit mr-auto px-3 py-1.5 rounded-lg">
              <code className="text-purple-400">{form.slug || 'automatic-slug'}</code>
              <span className="text-white/20">:رابط</span>
            </div>
          </section>

          <section className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-end gap-2 mb-4">
              <h3 className="font-black text-[10px] text-white/20 uppercase">الغلاف</h3>
              <ImageIcon className="text-purple-500" size={16} />
            </div>
            {form.cover_image_url ? (
              <div className="relative rounded-xl overflow-hidden aspect-video">
                <img src={form.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                <button onClick={() => set('cover_image_url', '')} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center"><X size={16} /></button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/10 rounded-2xl py-12 cursor-pointer hover:border-purple-500/50 transition-all">
                <Upload size={24} className="text-white/20" />
                <span className="text-xs font-black text-white/40">اضغط لرفع الغلاف</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploading} />
              </label>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                 <span className="text-[10px] font-black text-white/40 uppercase">محرر مداد</span>
              </div>
              <button onClick={handleAIImprove} disabled={isSummarizing} className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 text-purple-400 rounded-xl text-[10px] font-black hover:bg-purple-600 hover:text-white transition-all">
                {isSummarizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                تحسين المحتوى
              </button>
            </div>
            <div className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-2 min-h-[500px]">
              <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse" />}>
                <RichEditor content={form.content} onChange={html => set('content', html)} />
              </Suspense>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-black text-[10px] text-white/20 mb-4 uppercase flex items-center justify-end gap-2">السلسلة <LayoutDashboard size={14} /></h3>
            <input value={form.series} onChange={e => set('series', e.target.value)} placeholder="اسم السلسلة..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-black text-white outline-none focus:border-purple-600 text-right" />
          </section>

          <section className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-black text-[10px] text-white/20 mb-4 uppercase flex items-center justify-end gap-2">التصنيفات <TagIcon size={14} /></h3>
            <div className="flex flex-wrap gap-2 mb-4 justify-end">
              {form.tags.map(tag => (
                <span key={tag} className="flex items-center gap-2 bg-purple-600/10 text-purple-400 text-[9px] font-black px-3 py-1.5 rounded-lg border border-purple-500/20">#{tag}<button onClick={() => removeTag(tag)}><X size={10} /></button></span>
              ))}
            </div>
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag(tagInput)} placeholder="أضف تصنيف..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-black text-white text-right" />
          </section>

          <section className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
            <h3 className="font-black text-[10px] text-white/20 uppercase flex items-center justify-end gap-2">الجدولة <Clock size={14} /></h3>
            <input type="datetime-local" value={form.scheduled_for} onChange={e => set('scheduled_for', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[10px] font-black text-white [color-scheme:dark]" />
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <button onClick={() => set('comments_disabled', !form.comments_disabled)} className={`w-10 h-6 rounded-full transition-all relative p-1 ${form.comments_disabled ? 'bg-purple-600' : 'bg-white/10'}`}><div className={`w-4 h-4 rounded-full bg-white transition-all ${form.comments_disabled ? 'mr-4' : 'mr-0'}`} /></button>
              <span className="text-[10px] font-black">إيقاف التعليقات</span>
            </div>
          </section>
          <section className="bg-red-600/5 border border-red-600/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-[10px] text-red-400 uppercase flex items-center justify-end gap-2">منطقة الخطر <X size={14} /></h3>
            <button 
              onClick={() => {
                setNotice({
                  open: true,
                  title: 'تأكيد التصفير',
                  message: 'هل أنت متأكد من مسح كافة محتويات المقال؟ لا يمكن التراجع عن هذه العملية.',
                  variant: 'warning',
                  onAction: () => {
                    setForm(INITIAL)
                    localStorage.removeItem('midad_post_draft')
                    toast.success('تم تصفير المحرر بنجاح')
                  }
                })
              }}
              className="w-full py-3 bg-red-600/10 text-red-500 rounded-xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all"
            >
              تفريغ كافة المحتويات (Reset)
            </button>
          </section>
        </aside>
      </main>

      <AnimatePresence>
        {youtubeModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSummarizing && setYoutubeModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0d0d0d] border border-white/10 rounded-[2rem] p-8 max-w-lg w-full relative z-10 shadow-2xl">
               <h2 className="text-xl font-black mb-6 flex items-center justify-between">ذكاء يوتيوب <button onClick={() => setYoutubeModal(false)}><X size={20} /></button></h2>
               <div className="space-y-6">
                  <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="رابط فيديو يوتيوب..." className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-white text-sm" />
                  <textarea value={manualText} onChange={e => setManualText(e.target.value)} placeholder="أو الصق النص هنا..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm h-32 resize-none" />
                  <button disabled={isSummarizing || (!youtubeUrl && !manualText)} onClick={manualText ? handleManualSummarize : handleYoutubeSummarize} className="w-full bg-red-600 text-white py-5 rounded-xl font-black flex items-center justify-center gap-3 hover:bg-red-500 disabled:opacity-50">
                    {isSummarizing ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                    {isSummarizing ? 'جارٍ المعالجة...' : 'توليد المقال'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
