import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '@auth'
import { useToast } from '../../components/shared/ToastProvider'
import {
  Bell, Send, Users, Crown, PenSquare, User as UserIcon,
  CheckCircle, Loader2, Megaphone, MessageSquare, Trash2,
  Search, Sparkles, Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from '../../components/shared/ConfirmModal'

const AUDIENCE_OPTIONS = [
  { id: 'all', label: 'كافة المستخدمين', icon: Users },
  { id: 'authors', label: 'صُنّاع المحتوى فقط', icon: Crown },
  { id: 'readers', label: 'القراء فقط', icon: UserIcon },
  { id: 'specific', label: 'مستخدم محدد', icon: Search }
]

export default function AdminNotifications() {
  const { user } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({ title: '', message: '', audience: 'all', specificUserId: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [recentNotifs, setRecentNotifs] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, notif: null })

  useEffect(() => {
    fetchUsers()
    fetchRecentNotifs()
  }, [])

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('id, full_name, email, role').order('full_name')
    setUsers(data || [])
  }

  async function fetchRecentNotifs() {
    setLoadingHistory(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, created_at, metadata, actor_id')
        .eq('type', 'admin_broadcast')
        .eq('actor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      const groups = []
      const seenBroadcastIds = new Set()
      const seenTitleMsg = new Set()

      for (const notif of (data || [])) {
        const broadcastId = notif.metadata?.broadcast_id
        if (broadcastId) {
          if (!seenBroadcastIds.has(broadcastId)) {
            seenBroadcastIds.add(broadcastId)
            groups.push({ ...notif, _groupKey: broadcastId })
          }
        } else {
          const key = `${notif.title}||${notif.message}`
          if (!seenTitleMsg.has(key)) {
            seenTitleMsg.add(key)
            groups.push({ ...notif, _groupKey: key })
          }
        }
      }

      setRecentNotifs(groups.slice(0, 20))
    } catch (err) {
      console.error('fetchRecentNotifs error:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  async function handleSend(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('يجب إدخال عنوان ورسالة الإشعار')
      return
    }
    if (form.audience === 'specific' && !form.specificUserId) {
      toast.error('يجب اختيار مستخدم محدد للإرسال')
      return
    }

    setSending(true)
    try {
      let recipientIds = []

      if (form.audience === 'all') {
        recipientIds = users.map(u => u.id)
      } else if (form.audience === 'authors') {
        recipientIds = users.filter(u => u.role === 'author' || u.role === 'admin').map(u => u.id)
      } else if (form.audience === 'readers') {
        recipientIds = users.filter(u => u.role === 'reader').map(u => u.id)
      } else if (form.audience === 'specific') {
        recipientIds = [form.specificUserId]
      }

      recipientIds = recipientIds.filter(id => id !== user.id)

      if (recipientIds.length === 0) {
        toast.error('لا يوجد مستخدمون يطابقون المعايير المحددة')
        return
      }

      const broadcastId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

      const inserts = recipientIds.map(recipientId => ({
        recipient_id: recipientId,
        actor_id: user.id,
        type: 'admin_broadcast',
        title: form.title.trim(),
        message: form.message.trim(),
        metadata: {
          audience: form.audience,
          broadcast_id: broadcastId,
        },
      }))

      const { error } = await supabase.from('notifications').insert(inserts)
      if (error) throw error

      toast.success(`تم بث الإشعار لـ ${recipientIds.length} مستخدم بنجاح`)
      setSent(true)
      setForm({ title: '', message: '', audience: 'all', specificUserId: '' })
      setTimeout(() => setSent(false), 3000)
      fetchRecentNotifs()
    } catch (err) {
      toast.error('فشل في الإرسال: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm.notif) return
    const notif = deleteConfirm.notif
    setDeletingId(notif.id)
    try {
      const broadcastId = notif.metadata?.broadcast_id
      let error
      if (broadcastId) {
        ;({ error } = await supabase
          .from('notifications')
          .delete()
          .eq('type', 'admin_broadcast')
          .contains('metadata', { broadcast_id: broadcastId }))
      } else {
        ;({ error } = await supabase
          .from('notifications')
          .delete()
          .eq('type', 'admin_broadcast')
          .eq('title', notif.title)
          .eq('message', notif.message))
      }
      if (error) throw error
      setRecentNotifs(prev => prev.filter(n => n.id !== notif.id))
      toast.success('تم سحب الإشعار بنجاح')
      setDeleteConfirm({ open: false, notif: null })
    } catch (err) {
      toast.error('فشل الحذف: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  if (loadingHistory && recentNotifs.length === 0) return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-purple-600" size={64} /></div>

  return (
    <div className="max-w-7xl mx-auto pb-20 px-0" dir="rtl">
      <ConfirmModal 
        open={deleteConfirm.open}
        title="سحب الإشعار"
        message="هل أنت متأكد من سحب هذا الإشعار؟ سيتم حذفه من صناديق الوارد لدى جميع المستخدمين الذين استلموه."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, notif: null })}
        confirmLabel="تأكيد السحب"
        cancelLabel="تراجع"
        variant="danger"
      />
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 px-4 md:px-0">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl md:text-6xl font-black tracking-tight flex items-center gap-5 text-white italic">
             مركز البث 
             <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
               <Megaphone size={24} className="md:w-8 md:h-8" />
             </div>
          </h1>
          <p className="text-white/30 mt-4 font-black uppercase tracking-[0.3em] text-[10px]">أرسل إشعارات جماعية أو مخصصة لمجتمع مداد</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4 md:px-0">
        {/* Compose Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSend} className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl space-y-10">
            <h2 className="text-xl md:text-3xl font-black flex items-center gap-4 text-white italic">
              <Sparkles size={24} className="text-purple-500" />
              إنشاء إشعار جديد
            </h2>

            {/* Audience Selector */}
            <div className="space-y-6">
              <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2">الجمهور المستهدف</label>
              <div className="grid grid-cols-2 gap-4">
                {AUDIENCE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, audience: opt.id, specificUserId: '' }))}
                    className={`group relative flex items-center gap-4 px-6 py-5 rounded-2xl border-2 transition-all overflow-hidden ${
                      form.audience === opt.id
                        ? 'border-purple-600 bg-purple-600/10 text-white shadow-2xl'
                        : 'border-white/5 bg-white/5 text-white/20 hover:border-white/10'
                    }`}
                  >
                    <opt.icon size={20} className={`shrink-0 transition-colors ${form.audience === opt.id ? 'text-purple-400' : ''}`} />
                    <span className="text-sm font-black italic">{opt.label}</span>
                    {form.audience === opt.id && (
                       <motion.div layoutId="aud-glow" className="absolute inset-0 bg-purple-600/5 blur-xl -z-10" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific User Search */}
            <AnimatePresence>
              {form.audience === 'specific' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2">اختر المستخدم المحدد</label>
                  <div className="relative group">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-500 transition-all" size={20} />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="ابحث بالاسم أو البريد..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pr-16 pl-6 text-sm font-black text-white outline-none focus:border-purple-600 transition-all"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-2 border border-white/10 rounded-[2rem] p-4 bg-black/20 custom-scrollbar">
                    {filteredUsers.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { setForm(f => ({ ...f, specificUserId: u.id })); setUserSearch(u.full_name || '') }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl text-right transition-all ${
                          form.specificUserId === u.id ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-white/40'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-black text-lg italic shrink-0 border border-white/5">
                          {u.full_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black truncate italic">{u.full_name}</p>
                          <p className="text-[10px] opacity-40 truncate uppercase tracking-widest">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inputs */}
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2">عنوان الإشعار</label>
                <input
                  type="text" required value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="اكتب عنواناً جذاباً..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 font-black text-lg text-white outline-none focus:border-purple-600 transition-all shadow-inner"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2">محتوى الرسالة</label>
                <textarea
                  required value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="ما الذي تود إخبار المجتمع به؟"
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 px-8 font-bold text-lg text-white/80 outline-none focus:border-purple-600 transition-all resize-none leading-relaxed shadow-inner"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-white text-black py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-purple-600/10 hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95 border border-white/20"
            >
              {sending ? <Loader2 className="animate-spin" size={24} /> : sent ? <CheckCircle size={24} /> : <Zap size={24} className="fill-current" />}
              <span>{sending ? 'جاري البث...' : sent ? 'تم الإرسال بنجاح' : 'بث الإشعار الآن'}</span>
            </button>
          </form>
        </div>

        {/* History Sidebar */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-10 shadow-2xl h-full flex flex-col">
            <h3 className="text-xl md:text-2xl font-black mb-10 flex items-center gap-4 text-white italic">
              <MessageSquare size={24} className="text-purple-500" />
              سجل البث الأخير
            </h3>
            
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {recentNotifs.length === 0 ? (
                <div className="text-center py-20 opacity-20">
                  <Bell size={48} className="mx-auto mb-6" />
                  <p className="font-black text-sm uppercase tracking-widest italic">السجل فارغ تماماً</p>
                </div>
              ) : (
                recentNotifs.map((n, i) => (
                  <motion.div
                    key={n.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="group relative flex items-start gap-5 p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-purple-500/20 transition-all"
                  >
                    <div className="w-12 h-12 bg-purple-600/10 text-purple-400 rounded-2xl flex items-center justify-center shrink-0 border border-purple-500/10">
                      <Bell size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-black text-white truncate italic">{n.title}</p>
                      <p className="text-xs text-white/30 font-bold mt-1 leading-relaxed line-clamp-2 pr-4 italic">"{n.message}"</p>
                      <div className="flex items-center gap-4 mt-4">
                        <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">{new Date(n.created_at).toLocaleDateString('ar-EG')}</p>
                        <span className="w-1 h-1 bg-white/10 rounded-full" />
                        <p className="text-[9px] text-purple-500 font-black uppercase tracking-[0.2em]">
                          {n.metadata?.audience === 'all' ? 'للجميع' :
                           n.metadata?.audience === 'authors' ? 'للكُتّاب' :
                           n.metadata?.audience === 'readers' ? 'للقراء' : 'محدد'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm({ open: true, notif: n })}
                      disabled={deletingId === n.id}
                      className="opacity-0 group-hover:opacity-100 w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all disabled:opacity-50 shadow-xl"
                      title="سحب الإشعار من جميع المستخدمين"
                    >
                      {deletingId === n.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
