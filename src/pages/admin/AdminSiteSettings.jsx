import { getErrorMessage } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useAuth } from '@auth'
import { PostService } from '@/features/posts/services/post.service'
import { supabase, uploadImage } from '../../lib/supabase'
import { 
  Save, Globe, Image as ImageIcon, Loader2, Check, 
  Trash2, RefreshCw, Tv, Users, Hash, AtSign, ArrowRight, AlertTriangle, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../../components/shared/ToastProvider'
import { useNavigate } from 'react-router-dom'
import OptimizedImage from '../../components/shared/OptimizedImage'

export default function AdminSiteSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [settings, setSettings] = useState({
    site_name: '',
    site_description: '',
    logo_url: '',
    channel_slug: ''
  })
  const toast = useToast()

  useEffect(() => {
    if (user) {
      fetchSettings()
      fetchFollowerCount()
    }
  }, [user])

  async function fetchFollowerCount() {
    const count = await PostService.getFollowersCount(user.id)
    setFollowerCount(count)
  }

  async function fetchSettings() {
    try {
      const { data } = await PostService.getSiteSettingsByAuthor(user.id)
      if (data) setSettings(data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setSaving(true)
    try {
      const url = await uploadImage(file, 'logos')
      setSettings({ ...settings, logo_url: url })
      toast.success('تم رفع الشعار بنجاح')
    } catch (err) { toast.error('فشل رفع الصورة') } finally { setSaving(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await PostService.upsertChannelSettings(user.id, settings)
      if (error) throw error
      setSuccess(true)
      toast.success('تم حفظ إعدادات القناة')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setSaving(false) }
  }

  async function handleDeleteChannel() {
    if (deleteConfirm !== 'حذف') return
    setDeleting(true)
    try {
      const { error } = await PostService.deleteChannelSettings(user.id)
      if (error) throw error
      toast.success('تم حذف القناة بنجاح')
      setDeleteModal(false)
      navigate('/studio')
    } catch (err) {
      toast.error('خطأ في الحذف: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-purple-600" size={64} /></div>

  return (
    <div className="max-w-5xl mx-auto pb-20 px-0" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl md:text-6xl font-black tracking-tight flex items-center gap-5 text-white">
             إدارة القناة 
             <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
               <Tv size={24} className="md:w-8 md:h-8" />
             </div>
          </h1>
          <p className="text-white/30 mt-4 font-black uppercase tracking-[0.3em] text-[10px]">تحكم في هوية قناتك وظهورها للجمهور</p>
        </motion.div>
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-6 bg-white/5 border border-white/10 px-10 py-6 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl"
        >
          <div className="w-12 h-12 bg-purple-600/20 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/20">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xl md:text-4xl font-black tabular-nums leading-none text-white">{followerCount}</p>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-2">متابع نشط</p>
          </div>
        </motion.div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Branding Section */}
        <section className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 md:p-16 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-16">
            <div className="relative group/logo">
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-[3rem] bg-white/5 border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center group-hover/logo:border-purple-500/40 transition-all duration-500 relative">
                {settings.logo_url ? (
                  <OptimizedImage src={settings.logo_url} className="w-full h-full object-cover group-hover/logo:scale-110 transition-transform" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-white/10">
                    <ImageIcon size={64} />
                    <span className="text-[10px] font-black uppercase tracking-widest">لا يوجد شعار</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                   <p className="text-[10px] font-black uppercase tracking-widest text-white">تغيير الشعار</p>
                </div>
              </div>
              <label className="absolute -bottom-4 -left-4 p-5 bg-purple-600 text-white rounded-3xl shadow-2xl cursor-pointer hover:bg-purple-500 transition-all border-4 border-[#0d0d0d] group-hover/logo:scale-110">
                <RefreshCw size={24} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={saving} />
              </label>
            </div>
            
            <div className="flex-1 space-y-8 w-full">
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-2">اسم القناة العام</label>
                <input 
                  type="text" required 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 font-black text-lg text-white outline-none focus:border-purple-500 focus:bg-white/10 transition-all shadow-xl"
                  placeholder="مثال: مداد"
                  value={settings.site_name || 'Madid'} 
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} 
                />
              </div>
              
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                  <AtSign size={14} className="text-purple-500" /> رابط القناة المخصص
                </label>
                <div className="relative">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-black text-sm italic">midad.me/c/</span>
                   <input 
                    type="text" required 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pr-8 pl-32 font-black text-lg text-white outline-none focus:border-purple-500 focus:bg-white/10 transition-all shadow-xl"
                    placeholder="madid"
                    value={settings.channel_slug || 'madid'} 
                    onChange={(e) => setSettings({ ...settings, channel_slug: e.target.value.toLowerCase().replace(/ /g, '-') })} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-2">نبذة عن القناة (Bio)</label>
            <textarea 
              rows={4} 
              className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 font-bold text-base text-white/80 outline-none focus:border-purple-500 focus:bg-white/10 transition-all resize-none leading-relaxed shadow-xl" 
              placeholder="مداد هي منصة عربية حديثة للنشر وصناعة المحتوى، تتيح للكتّاب والمبدعين إنشاء مقالات احترافية ومشاركتها مع الجمهور بسهولة داخل تجربة كتابة نظيفة وسريعة وعصرية."
              value={settings.site_description || ''} 
              onChange={(e) => setSettings({ ...settings, site_description: e.target.value })} 
            />
          </div>
        </section>

        <div className="flex gap-6">
          <button 
            disabled={saving} 
            className="flex-1 bg-white text-black py-8 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 border border-white/20"
          >
            {saving ? <Loader2 className="animate-spin" size={24} /> : success ? <Check size={24} className="text-green-500" /> : <Save size={24} />}
            <span>{saving ? 'جاري المزامنة...' : success ? 'تم حفظ الهوية بنجاح!' : 'تثبيت إعدادات القناة'}</span>
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="mt-16 bg-red-500/5 border border-red-500/20 rounded-[3rem] p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
           <AlertTriangle size={120} className="text-red-500" />
        </div>
        <div className="relative z-10">
          <h3 className="font-black text-red-500 text-2xl flex items-center gap-4 mb-4">
            <AlertTriangle size={28} /> منطقة الخطر
          </h3>
          <p className="text-red-400/60 text-sm font-bold mb-8 max-w-2xl leading-relaxed">
            تحذير: حذف القناة سيؤدي إلى مسح الهوية البصرية (الشعار) والرابط المخصص فوراً. لن يتم حذف المقالات المنشورة، ولكنها ستفقد ارتباطها بهوية القناة. هذا الإجراء غير قابل للتراجع.
          </p>
          <button
            onClick={() => setDeleteModal(true)}
            className="flex items-center gap-4 px-10 py-5 bg-red-500/10 text-red-500 rounded-2xl font-black text-base hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
          >
            <Trash2 size={20} /> حذف هوية القناة نهائياً
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6" dir="rtl">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setDeleteModal(false); setDeleteConfirm('') }}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d0d0d] border border-white/10 text-white rounded-[3rem] p-10 w-full max-w-lg relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-red-500 flex items-center gap-4">
                  <AlertTriangle size={28} /> تأكيد الحذف النهائي
                </h3>
                <button onClick={() => { setDeleteModal(false); setDeleteConfirm('') }} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-white/40 hover:text-white border border-white/5">
                  <X size={24} />
                </button>
              </div>
              <p className="text-base font-bold text-white/40 mb-8 leading-relaxed text-right">
                سيتم مسح بيانات القناة بالكامل. لتأكيد رغبتك، يرجى كتابة كلمة <strong className="text-red-500">"حذف"</strong> في الحقل أدناه:
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="اكتب كلمة حذف هنا..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 font-black text-lg text-white outline-none focus:border-red-500 transition-all mb-8 text-center"
              />
              <button
                onClick={handleDeleteChannel}
                disabled={deleteConfirm !== 'حذف' || deleting}
                className="w-full py-6 bg-red-500 text-white rounded-2xl font-black text-lg hover:bg-red-600 transition-all flex items-center justify-center gap-4 disabled:opacity-20 shadow-xl shadow-red-500/20"
              >
                {deleting ? <Loader2 size={24} className="animate-spin" /> : <Trash2 size={24} />}
                {deleting ? 'جاري الحذف...' : 'تأكيد وحذف القناة'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
