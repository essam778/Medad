import { getErrorMessage } from "@/lib/utils";
import { useState, useEffect } from "react";
import { PostService } from "@/features/posts/services/post.service";
import {
  Plus,
  Tag,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Hash,
  Sparkles,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../components/shared/ToastProvider";
import ConfirmModal from "../../components/shared/ConfirmModal";

export default function AdminTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    tagId: null,
    tagName: "",
  });
  const toast = useToast();

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    setLoading(true);
    try {
      const enrichedTags = await PostService.getTags();
      setTags(enrichedTags);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newTag.trim()) return;
    setAdding(true);
    try {
      const { data, error } = await PostService.createTag(newTag);
      if (error) throw error;
      setTags((prev) =>
        [...prev, { ...data, usage_count: 0 }].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      setNewTag("");
      toast.success("تم إضافة التصنيف بنجاح");
    } catch (err) {
      toast.error(getErrorMessage(err, "فشل إضافة التصنيف"));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm.tagId) return;
    try {
      const { error } = await PostService.deleteTag(deleteConfirm.tagId);
      if (error) throw error;
      setTags((prev) => prev.filter((t) => t.id !== deleteConfirm.tagId));
      toast.success("تم حذف التصنيف");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteConfirm({ open: false, tagId: null, tagName: "" });
    }
  }

  async function handleUpdate(id) {
    if (!editValue.trim()) return;
    try {
      const { error } = await PostService.updateTag(id, editValue);
      if (error) throw error;
      setTags((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, name: editValue.trim().toLowerCase() } : t,
        ),
      );
      setEditingId(null);
      toast.success("تم تحديث التصنيف");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-40">
        <Loader2 className="animate-spin text-purple-600" size={64} />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto pb-20 px-0" dir="rtl">
      <ConfirmModal
        open={deleteConfirm.open}
        title="حذف التصنيف"
        message={`هل أنت متأكد من حذف تصنيف "${deleteConfirm.tagName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteConfirm({ open: false, tagId: null, tagName: "" })
        }
        confirmLabel="حذف الآن"
        cancelLabel="تراجع"
        variant="danger"
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl md:text-6xl font-black tracking-tight flex items-center gap-5 text-white">
            إدارة التصنيفات
            <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
              <Hash size={24} className="md:w-8 md:h-8" />
            </div>
          </h1>
          <p className="text-white/30 mt-4 font-black uppercase tracking-[0.3em] text-[10px]">
            نظم مقالات المنصة بتصنيفات واضحة وجذابة
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full lg:w-auto">
          {[
            {
              label: "إجمالي التصنيفات",
              value: tags.length,
              icon: Tag,
              color: "text-purple-400",
              bg: "bg-purple-600/10",
            },
            {
              label: "المقالات المصنفة",
              value: tags.reduce((acc, t) => acc + (t.usage_count || 0), 0),
              icon: FileText,
              color: "text-blue-400",
              bg: "bg-blue-600/10",
            },
            {
              label: "التصنيف الأكثر انتشاراً",
              value:
                tags.length > 0
                  ? [...tags].sort((a, b) => b.usage_count - a.usage_count)[0]
                      .name
                  : "-",
              icon: Sparkles,
              color: "text-pink-400",
              bg: "bg-pink-600/10",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 px-8 py-5 rounded-[2rem] shadow-2xl backdrop-blur-3xl flex items-center gap-5 min-w-[240px]"
            >
              <div
                className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center border border-white/5`}
              >
                <stat.icon size={20} />
              </div>
              <div className="text-right">
                <p className="text-xl md:text-2xl font-black tabular-nums leading-none text-white italic">
                  {typeof stat.value === "number"
                    ? stat.value.toLocaleString("ar-EG")
                    : stat.value}
                </p>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-2">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <form onSubmit={handleAdd} className="mb-16">
        <div className="relative group">
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-500 transition-colors">
            <Tag size={24} />
          </div>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="w-full bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] md:rounded-[3rem] py-6 md:py-10 pr-16 md:pr-20 pl-40 md:pl-56 font-black text-lg md:text-2xl text-white outline-none focus:border-purple-600 transition-all shadow-2xl"
            placeholder="أضف تصنيفاً جديداً..."
          />
          <button
            disabled={adding}
            type="submit"
            className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 bg-white text-black px-6 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-xs md:text-lg hover:bg-purple-600 hover:text-white transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95 border border-white/10 shadow-xl"
          >
            {adding ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Plus size={20} />
            )}
            إضافة
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <AnimatePresence>
          {tags.map((tag, i) => (
            <motion.div
              key={tag.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/10 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl hover:border-purple-600/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl group-hover:bg-purple-600/10 transition-all" />

              {editingId === tag.id ? (
                <div className="space-y-4 relative z-10">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full bg-white/5 border border-purple-500 rounded-2xl py-4 px-6 font-black text-lg text-white outline-none shadow-xl"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpdate(tag.id)}
                      className="flex-1 bg-purple-600 text-white py-4 rounded-2xl font-black text-xs hover:bg-purple-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> حفظ
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 bg-white/5 text-white/40 py-4 rounded-2xl font-black text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10"
                    >
                      <X size={16} /> إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:bg-purple-600 group-hover:text-white transition-all border border-white/5 group-hover:border-purple-500 shadow-xl">
                      <Hash size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                      <p className="font-black text-lg md:text-2xl text-white group-hover:text-purple-400 transition-colors italic">
                        {tag.name}
                      </p>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1.5">
                        {tag.usage_count || 0} مقال مرتبط
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button
                      onClick={() => {
                        setEditingId(tag.id);
                        setEditValue(tag.name);
                      }}
                      className="w-10 h-10 bg-white/5 text-white/20 hover:text-white hover:bg-white/10 rounded-xl flex items-center justify-center transition-all border border-white/5"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          open: true,
                          tagId: tag.id,
                          tagName: tag.name,
                        })
                      }
                      className="w-10 h-10 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-red-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
