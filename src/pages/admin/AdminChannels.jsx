import { getErrorMessage } from '@/lib/utils'
import { useState } from 'react'
import {
  Tv, Search, Trash2, ExternalLink, Users, Eye,
  FileText, Loader2, ShieldAlert, CheckCircle2, Sparkles, ChevronRight, ChevronLeft
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAdminChannels } from '../../hooks/useAdmin'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/shared/ToastProvider'
import ConfirmModal from '../../components/shared/ConfirmModal'
import OptimizedImage from '../../components/shared/OptimizedImage'

export default function AdminChannels() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [deleting, setDeleting] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, channel: null })

  const { data, isLoading, refetch } = useAdminChannels({ page, search })
  
  const channels = data?.data || []
  const count = data?.count || 0
  const totalPages = Math.ceil(count / 20)

  async function handleDeleteChannel() {
    if (!deleteConfirm.channel) return
    const channelId = deleteConfirm.channel.id
    setDeleting(channelId)
    try {
      const { error } = await supabase
        .from('site_settings')
        .delete()
        .eq('id', channelId)
      if (error) throw error
      toast.success('تم حذف هوية القناة بنجاح')
      setDeleteConfirm({ open: false, channel: null })
      refetch()
    } catch (err) {
      toast.error('خطأ في الحذف: ' + err.message)
    } finally {
      setDeleting(null)
    }
  }

  async function toggleBanAuthor(authorId, isBanned) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !isBanned })
        .eq('id', authorId)
      if (error) throw error
      toast.success(isBanned ? 'تم رفع الحظر عن المبدع' : 'تم حظر المبدع نهائياً')
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (isLoading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-purple-600" size={64} /></div>

  return (
    <div className="max-w-7xl mx-auto pb-20 px-0" dir="rtl">
      <ConfirmModal 
        open={deleteConfirm.open}
        title="حذف القناة"
        message={`هل أنت متأكد من حذف قناة "${deleteConfirm.channel?.site_name}"؟ سيتم مسح الهوية البصرية والرابط المخصص فقط.`}
        onConfirm={handleDeleteChannel}
        onCancel={() => setDeleteConfirm({ open: false, channel: null })}
        confirmLabel={deleting ? 'جاري الحذف...' : 'حذف القناة'}
        cancelLabel="تراجع"
        variant="danger"
      />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 px-4 md:px-0">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-4 text-white uppercase italic">
             إدارة القنوات 
             <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
               <Tv size={20} className="md:w-6 md:h-6" />
             </div>
          </h1>
          <p className="text-white/30 mt-2 font-black uppercase tracking-[0.3em] text-[8px]">أدر جميع القنوات المبدعة على المنصة ({count})</p>
        </motion.div>
        
        <div className="relative w-full lg:w-[400px] group">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-500 transition-colors" size={18} />
          <input 
            type="text" placeholder="ابحث باسم القناة أو المبدع..."
            className="w-full bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl py-4 pr-14 pl-6 outline-none focus:border-purple-600 shadow-xl transition-all font-black text-sm text-white"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
      </div>

      {/* Stats Summary Bar (نظام الأعداد) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 px-4 md:px-0">
         {[
           { label: 'إجمالي القنوات', value: count, icon: Tv, color: 'text-purple-400', bg: 'bg-purple-600/10' },
           { label: 'إجمالي المتابعين', value: channels.reduce((acc, ch) => acc + (ch.followersCount || 0), 0), icon: Users, color: 'text-blue-400', bg: 'bg-blue-600/10' },
           { label: 'إجمالي المنشورات', value: channels.reduce((acc, ch) => acc + (ch.postsCount || 0), 0), icon: FileText, color: 'text-orange-400', bg: 'bg-orange-600/10' },
         ].map((stat, i) => (
           <motion.div 
             key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
             className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] flex items-center gap-6 shadow-2xl group overflow-hidden relative"
           >
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><stat.icon size={60} /></div>
             <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center border border-white/5 shadow-xl`}>
                <stat.icon size={24} />
             </div>
             <div className="text-right">
                <p className="text-2xl md:text-4xl font-black tabular-nums leading-none text-white italic">{stat.value.toLocaleString('ar-EG')}</p>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-2">{stat.label}</p>
             </div>
           </motion.div>
         ))}
      </div>

      {/* Channels List */}
      <div className="space-y-6 px-4 md:px-0">
        {channels.length === 0 ? (
          <div className="text-center py-40 bg-[#0d0d0d]/40 backdrop-blur-3xl border border-dashed border-white/10 rounded-[4rem] px-10 shadow-2xl">
            <Sparkles size={64} className="mx-auto mb-8 text-white/5" />
            <p className="text-white/10 font-black italic text-2xl uppercase tracking-widest">لا توجد قنوات مطابقة لبحثك</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6">
              {channels.map((ch, i) => (
                <motion.div
                  key={ch.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`group relative bg-[#0d0d0d]/40 backdrop-blur-3xl border rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center gap-6 transition-all overflow-hidden ${ch.profiles?.is_banned ? 'border-red-500/20 bg-red-500/5' : 'border-white/5 hover:border-purple-600/10'}`}
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0 relative z-10">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-white/5 border border-white/10 shadow-xl shrink-0">
                      {ch.logo_url
                        ? <OptimizedImage src={ch.logo_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-purple-600 flex items-center justify-center font-black text-xl italic text-white">{ch.site_name?.[0]}</div>
                      }
                    </div>
                    <div className="min-w-0 flex-1 text-right">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h3 className="font-black text-base md:text-xl text-white truncate italic">{ch.site_name}</h3>
                        {ch.profiles?.is_banned && (
                          <span className="text-[8px] font-black uppercase tracking-widest bg-red-500 text-white px-3 py-0.5 rounded-full">محظور</span>
                        )}
                      </div>
                      <p className="text-[10px] md:text-xs text-white/20 font-black italic truncate mb-2">midad.me/c/{ch.channel_slug}</p>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[9px] font-black text-white/40 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                          <Users size={12} className="text-purple-500" /> {ch.followersCount}
                        </span>
                        <span className="flex items-center gap-1.5 text-[9px] font-black text-white/40 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                          <FileText size={12} className="text-purple-500" /> {ch.postsCount}
                        </span>
                        <span className="text-[9px] font-black text-white/10 italic truncate">
                          بواسطة: {ch.profiles?.full_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center lg:justify-end gap-3 shrink-0 relative z-10">
                    <Link
                      to={`/c/${ch.channel_slug}`}
                      className="w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-white/20 hover:text-white transition-all shadow-lg"
                      title="زيارة القناة"
                    >
                      <ExternalLink size={18} />
                    </Link>
                    <button
                      onClick={() => toggleBanAuthor(ch.author_id, ch.profiles?.is_banned)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg border ${ch.profiles?.is_banned ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}
                    >
                      {ch.profiles?.is_banned ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ open: true, channel: ch })}
                      className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="py-10 flex items-center justify-center gap-6 mt-6">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-white disabled:opacity-10 transition-all">
                  <ChevronRight size={20} />
                </button>
                <div className="text-xs font-black italic text-white/60 tabular-nums">
                   {page + 1} <span className="mx-2 opacity-20">/</span> {totalPages}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-white disabled:opacity-10 transition-all">
                  <ChevronLeft size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

