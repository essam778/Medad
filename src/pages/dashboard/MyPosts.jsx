import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@auth'
import { useMyPosts, useDeletePost } from '@posts'
import { formatDate } from '../../lib/utils'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import ConfirmModal from '../../components/shared/ConfirmModal'
import { PenSquare, Trash2, Plus, Eye, FileText } from 'lucide-react'

const STATUS = {
  published: { label: 'منشور', cls: 'bg-green-50 text-green-700' },
  draft:     { label: 'مسودة', cls: 'bg-gray-100 text-gray-500' },
  scheduled: { label: 'مجدول', cls: 'bg-blue-50 text-blue-700' },
}

export default function MyPosts() {
  const { user, isAuthor, isAdmin } = useAuth()
  const { data: posts = [], isLoading } = useMyPosts(user?.id)
  const deletePost = useDeletePost()
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, postId: null, postTitle: '' })

  async function handleDelete() {
    if (!deleteConfirm.postId) return
    await deletePost.mutateAsync(deleteConfirm.postId)
    setDeleteConfirm({ open: false, postId: null, postTitle: '' })
  }

  if (!isAuthor && !isAdmin) return (
    <div className="text-center py-16">
      <FileText size={40} className="mx-auto mb-3 text-gray-200" />
      <p className="font-semibold mb-1">ليس لديك صلاحية الكتابة</p>
      <p className="text-sm text-gray-400">تواصل مع الأدمن لطلب صلاحية الكاتب</p>
    </div>
  )

  return (
    <div dir="rtl">
      <ConfirmModal 
        open={deleteConfirm.open}
        title="حذف المقال"
        message={`هل أنت متأكد من حذف مقال "${deleteConfirm.postTitle}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, postId: null, postTitle: '' })}
        confirmLabel="حذف الآن"
        cancelLabel="تراجع"
        variant="danger"
      />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-primary">مقالاتي ({posts.length})</h2>
        {(isAuthor || isAdmin) && (
          <Link to="/studio/posts/new"
            className="flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-xl text-sm font-black hover:bg-ink-soft transition-colors shadow-lg shadow-ink/5">
            <Plus size={15} />
            مقال جديد
          </Link>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <FileText size={40} className="mx-auto mb-3 opacity-20" />
          <p className="mb-3 font-bold">لم تكتب أي مقال بعد</p>
          <Link to="/studio/posts/new"
            className="text-sm text-primary font-black underline hover:no-underline">
            ابدأ بكتابة أول مقال
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const st = STATUS[post.status] || STATUS.draft
            return (
              <div key={post.id}
                className="flex items-start gap-4 p-4 border border-border bg-card rounded-2xl hover:bg-subtle transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${st.cls}`}>
                      {st.label}
                    </span>
                    {post.tags?.slice(0, 2).map(t => (
                      <span key={t} className="text-[10px] text-muted bg-subtle px-2 py-0.5 rounded-full font-bold">{t}</span>
                    ))}
                  </div>
                  <h3 className="font-black text-primary truncate group-hover:text-gold transition-colors">{post.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted font-bold">
                    <span>{formatDate(post.created_at)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Eye size={11} />{post.views || 0}</span>
                    <span>·</span>
                    <span>{post.reading_time} د</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {post.status === 'published' && (
                    <a href={`/post/${post.slug}`} target="_blank" rel="noreferrer"
                      className="p-2 hover:bg-subtle rounded-lg text-muted hover:text-primary transition-colors">
                      <Eye size={15} />
                    </a>
                  )}
                  <Link to={`/studio/posts/edit/${post.id}`}
                    className="p-2 hover:bg-subtle rounded-lg text-muted hover:text-primary transition-colors">
                    <PenSquare size={15} />
                  </Link>
                  <button onClick={() => setDeleteConfirm({ open: true, postId: post.id, postTitle: post.title })}
                    className="p-2 hover:bg-red-50 rounded-lg text-muted hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
