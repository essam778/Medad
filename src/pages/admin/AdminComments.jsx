import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminComments, useDeleteComment } from '../../hooks/useComments'
import { formatDate } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import ConfirmModal from '../../components/shared/ConfirmModal'
import { Trash2, Check, ChevronRight, ChevronLeft, MessageCircle, Loader2, MessageSquare, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminComments() {
  const [page, setPage] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, commentId: null })
  const { data, isLoading } = useAdminComments({ page })
  const deleteComment = useDeleteComment()
  const qc = useQueryClient()

  const comments = data?.data || []
  const total = data?.count || 0
  const totalPages = Math.ceil(total / 20)

  async function toggleApprove(comment) {
    await supabase.from('comments')
      .update({ is_approved: !comment.is_approved })
      .eq('id', comment.id)
    qc.invalidateQueries({ queryKey: ['admin', 'comments'] })
  }

  async function handleDelete() {
    if (!deleteConfirm.commentId) return
    await deleteComment.mutateAsync({ commentId: deleteConfirm.commentId, postId: null })
    setDeleteConfirm({ open: false, commentId: null })
  }

  if (isLoading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-purple-600" size={64} /></div>

  return (
    <div className="max-w-6xl mx-auto pb-20 px-0" dir="rtl">
      <ConfirmModal 
        open={deleteConfirm.open}
        title="حذف التعليق"
        message="هل أنت متأكد من رغبتك في حذف هذا التعليق نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, commentId: null })}
        confirmLabel="حذف الآن"
        cancelLabel="تراجع"
        variant="danger"
      />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 px-4 md:px-0">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-4 text-white uppercase italic">
             إدارة التعليقات 
             <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
               <MessageSquare size={20} className="md:w-6 md:h-6" />
             </div>
          </h1>
          <p className="text-white/30 mt-2 font-black uppercase tracking-[0.3em] text-[8px]">
            {total.toLocaleString('ar-EG')} تفاعل بانتظار المراجعة
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4 w-fit"
        >
          <div className="w-9 h-9 bg-purple-600/20 text-purple-400 rounded-xl flex items-center justify-center border border-purple-500/20">
            <MessageCircle size={18} />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black tabular-nums leading-none text-white">{total}</p>
            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mt-1.5">تعليق نشط</p>
          </div>
        </motion.div>
      </div>

      <div className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative mx-4 md:mx-0">
        {comments.length === 0 ? (
          <div className="text-center py-40">
            <Sparkles size={64} className="mx-auto mb-10 text-white/5" />
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4 italic">الرادار هادئ</h2>
            <p className="text-white/20 font-bold max-w-sm mx-auto text-sm md:text-lg">لا توجد تعليقات جديدة للمراجعة حالياً. مجتمع مداد في أمان!</p>
          </div>
        ) : (
          <div className="divide-y border-white/5">
            <AnimatePresence mode="popLayout">
              {comments.map((comment, i) => (
                <motion.div 
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="p-5 md:p-6 hover:bg-white/[0.02] transition-all group relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black italic text-xs">
                          {comment.profiles?.full_name?.[0]}
                        </div>
                        <span className="font-black text-sm md:text-base text-white italic">{comment.profiles?.full_name || 'مجهول'}</span>
                        <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">• على:</span>
                        {comment.posts && (
                          <Link to={`/post/${comment.posts.slug}`} target="_blank"
                            className="text-[10px] md:text-xs text-purple-400 font-black hover:text-white transition-all truncate max-w-[150px] md:max-w-md italic border-b border-purple-500/10 pb-0.5">
                            {comment.posts.title}
                          </Link>
                        )}
                        <span className="text-[8px] text-white/10 font-black uppercase tracking-widest mr-auto">{formatDate(comment.created_at)}</span>
                      </div>
                      <div className="text-xs md:text-sm text-white/70 leading-relaxed font-bold italic pr-8 relative">
                         <div className="absolute right-0 top-2 w-4 h-px bg-white/10" />
                         "{comment.content}"
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleApprove(comment)}
                        className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center shadow-lg ${
                          comment.is_approved
                            ? 'bg-green-500 text-white border-green-400'
                            : 'bg-white/5 border-white/5 text-white/20 hover:text-white hover:bg-purple-600/10'
                        }`}>
                        <Check size={18} />
                      </button>
                      <button onClick={() => setDeleteConfirm({ open: true, commentId: comment.id })}
                        className="w-10 h-10 bg-red-500/10 border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg flex items-center justify-center">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-3">
                    <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase border ${
                      comment.is_approved 
                        ? 'bg-green-500/5 border-green-500/10 text-green-500' 
                        : 'bg-orange-500/5 border-orange-500/10 text-orange-400'
                    }`}>
                      {comment.is_approved ? 'منشور' : 'بانتظار التدقيق'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 py-12">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="w-14 h-14 rounded-2xl border border-white/10 bg-white/5 text-white/20 disabled:opacity-10 hover:text-white hover:bg-white/10 transition-all shadow-xl flex items-center justify-center">
            <ChevronRight size={28} />
          </button>
          <span className="text-lg font-black text-white/40 tabular-nums bg-[#0d0d0d]/40 backdrop-blur-3xl px-8 py-4 rounded-[2rem] border border-white/10 shadow-2xl">
            {page + 1} <span className="text-white/10 mx-2">/</span> {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="w-14 h-14 rounded-2xl border border-white/10 bg-white/5 text-white/20 disabled:opacity-10 hover:text-white hover:bg-white/10 transition-all shadow-xl flex items-center justify-center">
            <ChevronLeft size={28} />
          </button>
        </div>
      )}
    </div>
  )
}
