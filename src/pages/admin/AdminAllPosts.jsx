import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAdminPosts, useDeletePost } from '@posts'
import { useAuth } from '@auth'
import { formatDate } from '../../lib/utils'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import ConfirmModal from '../../components/shared/ConfirmModal'
import { 
  PenSquare, Trash2, Eye, Plus, ChevronRight, 
  ChevronLeft, FileText, Hash, TrendingUp, Filter,
  ExternalLink, MoreVertical, Calendar, User as UserIcon, Loader2,
  Sparkles, FolderOpen, X, ToggleLeft, ToggleRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import OptimizedImage from '../../components/shared/OptimizedImage'

const STATUS_MAP = {
  published: { label: 'منشور', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
  draft:     { label: 'مسودة', cls: 'bg-white/5 text-white/40 border-white/10' },
  scheduled: { label: 'مجدول', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
}

export default function AdminAllPosts() {
  const { user, isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterUserId = searchParams.get('user_id')
  
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [excludeMe, setExcludeMe] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, postId: null, postTitle: '' })
  
  const authorId = filterUserId || null
  const { data, isLoading } = useAdminPosts({ 
    status, 
    page, 
    authorId, 
    excludeMe: (excludeMe && !authorId) ? user?.id : null 
  })
  const deletePost = useDeletePost()

  const posts = data?.data || []
  const total = data?.count || 0
  const totalPages = Math.ceil(total / 20)

  const authorName = useMemo(() => {
    if (!filterUserId || posts.length === 0) return null
    return posts[0].profiles?.full_name
  }, [filterUserId, posts])

  async function handleDelete() {
    if (!deleteConfirm.postId) return
    await deletePost.mutateAsync(deleteConfirm.postId)
    setDeleteConfirm({ open: false, postId: null, postTitle: '' })
  }

  function clearUserFilter() {
    searchParams.delete('user_id')
    setSearchParams(searchParams)
  }

  return (
    <div className="max-w-7xl mx-auto pb-20" dir="rtl">
      <ConfirmModal 
        open={deleteConfirm.open}
        title="حذف المقال"
        message={`هل أنت متأكد من رغبتك في حذف مقال "${deleteConfirm.postTitle}"؟ سيؤدي هذا إلى حذفه نهائياً من المنصة.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, postId: null, postTitle: '' })}
        confirmLabel="حذف نهائي"
        cancelLabel="تراجع"
        variant="danger"
      />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl md:text-6xl font-black tracking-tight flex items-center gap-5 text-white italic uppercase">
             {filterUserId ? 'مقالات المبدع' : 'مقالات المنصة'}
             <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-lg shadow-blue-600/20 border border-blue-500/30">
               <FolderOpen size={24} className="md:w-8 md:h-8 text-white" />
             </div>
          </h1>
          <div className="flex items-center gap-4 mt-4">
             <p className="text-white/30 font-black uppercase tracking-[0.3em] text-[10px]">
               {total.toLocaleString('ar-EG')} مقال مسجل {authorName && `بواسطة ${authorName}`}
             </p>
             {filterUserId && (
               <button onClick={clearUserFilter} className="flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[8px] font-black border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                 إلغاء التصفية <X size={12} />
               </button>
             )}
          </div>
        </motion.div>
        
        <Link to="/studio/posts/new"
          className="bg-white text-black px-10 py-5 rounded-3xl font-black text-sm md:text-lg shadow-2xl hover:bg-purple-600 hover:text-white transition-all flex items-center gap-4 active:scale-95 w-fit group border border-white/20">
          <Plus size={24} className="group-hover:rotate-90 transition-transform" />
          كتابة مقال جديد
        </Link>
      </div>

      {/* Filters Overlay Card */}
      <div className="bg-[#0d0d0d]/95 md:bg-[#0d0d0d]/40 md:backdrop-blur-3xl border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] p-4 md:p-8 mb-12 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="p-3 bg-white/5 text-white/40 rounded-2xl border border-white/10"><Filter size={20} /></div>
          <div className="flex flex-wrap gap-2">
            {[['', 'الكل'], ['published', 'منشور'], ['draft', 'مسودة'], ['scheduled', 'مجدول']].map(([val, lbl]) => (
              <button key={val} onClick={() => { setStatus(val); setPage(0) }}
                className={`px-8 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap border ${
                  status === val ? 'bg-purple-600 text-white border-purple-500 shadow-xl shadow-purple-600/20' : 'text-white/30 hover:text-white hover:bg-white/5 border-white/5'
                }`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {!filterUserId && (
          <button 
            onClick={() => { setExcludeMe(!excludeMe); setPage(0) }}
            className={`flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all font-black text-[11px] ${excludeMe ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/10 text-white/40'}`}
          >
            <span>إظهار مقالاتي أيضاً</span>
            {excludeMe ? <ToggleLeft size={24} /> : <ToggleRight size={24} className="text-purple-500" />}
          </button>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-[#0d0d0d]/95 md:bg-[#0d0d0d]/40 md:backdrop-blur-3xl border border-white/10 rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-40 flex flex-col items-center gap-6">
            <Loader2 className="animate-spin text-purple-500" size={48} />
            <p className="text-white/20 font-black text-xs uppercase tracking-widest italic">جاري جلب المحتوى...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-40 px-10">
            <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-white/5">
              <Sparkles size={48} className="text-white/10" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase">لا توجد مقالات هنا</h2>
            <p className="text-white/20 font-bold mt-4 text-sm md:text-lg">لا يوجد محتوى يطابق خيارات التصفية الحالية.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-right">
                  <th className="px-6 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">المقال</th>
                  {isAdmin && !filterUserId && <th className="px-6 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] hidden lg:table-cell text-center">المبدع</th>}
                  <th className="px-6 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] text-center">الحالة</th>
                  <th className="px-6 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] hidden lg:table-cell text-center">المشاهدات</th>
                  <th className="px-6 py-6" />
                </tr>
              </thead>
              <tbody className="divide-y border-white/5">
                {posts.map((post, i) => {
                  const st = STATUS_MAP[post.status] || STATUS_MAP.draft
                  return (
                    <motion.tr 
                      key={post.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-xl bg-white/5 overflow-hidden shrink-0 border border-white/5 shadow-xl">
                             {post.cover_image_url ? <OptimizedImage src={post.cover_image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-white/5"><FileText size={16} /></div>}
                           </div>
                           <div className="min-w-0 text-right">
                             <p className="font-black text-xs md:text-sm text-white/80 truncate group-hover:text-purple-400 transition-colors mb-1 italic">{post.title}</p>
                             <p className="text-[8px] font-black text-white/20 uppercase">{formatDate(post.created_at)}</p>
                           </div>
                        </div>
                      </td>
                      {isAdmin && !filterUserId && (
                        <td className="px-10 py-8 hidden lg:table-cell text-center">
                          <Link to={`/u/${post.profiles?.id}`} className="inline-flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all">
                             <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center text-[11px] font-black italic">{post.profiles?.full_name?.[0]}</div>
                             <span className="text-xs font-black text-white/60">{post.profiles?.full_name || '—'}</span>
                          </Link>
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block text-[8px] px-3 py-1 rounded-full font-black uppercase border ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-center">
                        <span className="text-xs font-black text-white tabular-nums">
                          {(post.views || 0).toLocaleString('ar-EG')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <Link to={`/studio/posts/edit/${post.id}`}
                            title="تعديل المقال"
                            className="w-12 h-12 bg-white/5 text-white/40 hover:text-white hover:bg-purple-600 rounded-2xl flex items-center justify-center transition-all border border-white/5 shadow-xl">
                            <PenSquare size={20} />
                          </Link>
                          <button onClick={() => setDeleteConfirm({ open: true, postId: post.id, postTitle: post.title })}
                            title="حذف المقال"
                            className="w-12 h-12 bg-red-500/10 text-red-400/60 hover:bg-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-red-500/10 shadow-xl">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-16 flex items-center justify-center gap-8">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="w-16 h-16 bg-[#0d0d0d] border border-white/10 rounded-[2rem] flex items-center justify-center text-white/40 hover:text-white hover:border-purple-600 transition-all disabled:opacity-20 shadow-2xl">
            <ChevronRight size={28} />
          </button>
          <div className="bg-purple-600 text-white px-10 py-4 rounded-[2rem] font-black tabular-nums shadow-xl shadow-purple-600/20 border border-purple-400/20 italic">
            {page + 1} <span className="mx-2 opacity-30 text-xs">من</span> {totalPages}
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="w-16 h-16 bg-[#0d0d0d] border border-white/10 rounded-[2rem] flex items-center justify-center text-white/40 hover:text-white hover:border-purple-600 transition-all disabled:opacity-20 shadow-2xl">
            <ChevronLeft size={28} />
          </button>
        </div>
      )}
    </div>
  )
}
