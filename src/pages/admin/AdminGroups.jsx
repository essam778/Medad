import { getErrorMessage } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../features/auth/context/AuthContext";
import { useToast } from "../../components/shared/ToastProvider";
import {
  FolderOpen,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Check,
  X,
  Save,
  FolderPlus,
  ListVideo,
  Layers,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmModal from "../../components/shared/ConfirmModal";
import OptimizedImage from "../../components/shared/OptimizedImage";

export default function AdminGroups() {
  const { user } = useAuth();
  const toast = useToast();

  const [groups, setGroups] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    groupId: null,
    groupName: "",
  });
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [addPostModal, setAddPostModal] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGroups();
      fetchPosts();
    }
  }, [user]);

  async function fetchGroups() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("collections")
        .select(
          `*, collection_posts(post_id, posts(id, title, slug, status, cover_image_url))`,
        )
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setGroups(data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, "خطأ في تحميل القوائم"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchPosts() {
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, status")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });
    setPosts(data || []);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("collections").insert({
        author_id: user.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
      });
      if (error) throw error;
      toast.success("تم إنشاء السلسلة بنجاح");
      setCreateModal(false);
      setForm({ name: "", description: "" });
      fetchGroups();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!form.name.trim() || !editModal) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("collections")
        .update({
          name: form.name.trim(),
          description: form.description.trim() || null,
        })
        .eq("id", editModal.id)
        .eq("author_id", user.id);
      if (error) throw error;
      toast.success("تم تحديث بيانات السلسلة");
      setEditModal(null);
      setForm({ name: "", description: "" });
      fetchGroups();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm.groupId) return;
    try {
      await supabase
        .from("collection_posts")
        .delete()
        .eq("collection_id", deleteConfirm.groupId);
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", deleteConfirm.groupId)
        .eq("author_id", user.id);
      if (error) throw error;
      toast.success("تم حذف السلسلة بنجاح");
      setDeleteConfirm({ open: false, groupId: null, groupName: "" });
      fetchGroups();
    } catch (err) {
      toast.error(getErrorMessage(err, "خطأ في الحذف"));
    }
  }

  async function addPostToGroup(groupId, postId) {
    try {
      const { error } = await supabase.from("collection_posts").insert({
        collection_id: groupId,
        post_id: postId,
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("هذا المقال موجود بالفعل في هذه القائمة");
        } else {
          throw error;
        }
        return;
      }
      toast.success("تم إضافة المقال للسلسلة");
      fetchGroups();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function removePostFromGroup(groupId, postId) {
    try {
      await supabase
        .from("collection_posts")
        .delete()
        .eq("collection_id", groupId)
        .eq("post_id", postId);
      toast.success("تمت إزالة المقال من السلسلة");
      fetchGroups();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const groupPostIds = (group) =>
    (group.collection_posts || []).map((cp) => cp.post_id);
  const availablePosts = (group) =>
    posts.filter((p) => !groupPostIds(group).includes(p.id));

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
        title="حذف السلسلة"
        message={`هل أنت متأكد من حذف سلسلة "${deleteConfirm.groupName}"؟ لن يتم حذف المقالات، فقط سيتم فك ارتباطها.`}
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteConfirm({ open: false, groupId: null, groupName: "" })
        }
        confirmLabel="تأكيد الحذف"
        cancelLabel="تراجع"
        variant="danger"
      />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 px-4 md:px-0">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-right"
        >
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center justify-end gap-4 text-white uppercase italic">
            سلاسل المحتوى
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
              <ListVideo size={20} className="md:w-6 md:h-6" />
            </div>
          </h1>
          <p className="text-white/30 mt-2 font-black uppercase tracking-[0.3em] text-[8px] pr-2 text-right">
            نظّم مقالاتك في سلاسل وقوائم تشغيل احترافية
          </p>
        </motion.div>

        <button
          onClick={() => {
            setCreateModal(true);
            setForm({ name: "", description: "" });
          }}
          className="bg-white text-black px-6 py-4 rounded-2xl font-black text-xs md:text-sm shadow-xl hover:bg-purple-600 hover:text-white transition-all flex items-center gap-3 active:scale-95 w-fit group"
        >
          إنشاء سلسلة جديدة{" "}
          <FolderPlus
            size={20}
            className="group-hover:rotate-12 transition-transform"
          />
        </button>
      </div>

      {groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-40 bg-[#0d0d0d]/40 backdrop-blur-3xl border border-dashed border-white/10 rounded-[4rem] px-10 shadow-2xl mx-4 md:mx-0"
        >
          <Layers size={64} className="mx-auto mb-10 text-white/5" />
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4 italic text-center">
            لا توجد سلاسل بعد
          </h2>
          <p className="text-white/20 font-bold mb-10 max-w-sm mx-auto text-sm md:text-lg text-center">
            ابدأ بإنشاء أول سلسلة لتنظيم مقالاتك بشكل متصل وجذاب.
          </p>
          <button
            onClick={() => {
              setCreateModal(true);
              setForm({ name: "", description: "" });
            }}
            className="inline-flex items-center gap-4 bg-purple-600 text-white px-12 py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-purple-600/20 hover:bg-purple-500 transition-all"
          >
            <Plus size={24} /> ابدأ الآن
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6 px-4 md:px-0">
          {groups.map((group, idx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl shadow-xl overflow-hidden group/card"
            >
              <div className="flex flex-col md:flex-row-reverse items-center gap-5 p-5 md:p-6">
                <div className="w-12 h-12 bg-purple-600/10 text-purple-500 rounded-2xl flex items-center justify-center shrink-0 border border-purple-500/20 group-hover/card:scale-105 transition-transform duration-500">
                  <FolderOpen size={20} />
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <h2 className="font-black text-base md:text-xl text-white truncate italic group-hover/card:text-purple-400 transition-colors">
                    {group.name}
                  </h2>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-2">
                    {(group.collection_posts || []).length} مقال مدرج
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 flex-row-reverse">
                  <button
                    onClick={() => {
                      setEditModal(group);
                      setForm({
                        name: group.name,
                        description: group.description || "",
                      });
                    }}
                    className="w-11 h-11 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all border border-white/5 flex items-center justify-center"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        open: true,
                        groupId: group.id,
                        groupName: group.name,
                      })
                    }
                    className="w-11 h-11 bg-red-500/10 rounded-xl text-red-500/60 hover:bg-red-500 hover:text-white transition-all border border-red-500/10 flex items-center justify-center"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() =>
                      setExpandedGroup(
                        expandedGroup === group.id ? null : group.id,
                      )
                    }
                    className="w-11 h-11 bg-white/5 rounded-xl text-white/40 hover:text-purple-400 transition-all border border-white/5 flex items-center justify-center"
                  >
                    {expandedGroup === group.id ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedGroup === group.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-white/[0.02] border-t border-white/5"
                  >
                    <div className="p-4 md:p-6 space-y-3">
                      {(group.collection_posts || []).length === 0 ? (
                        <p className="text-center text-white/20 text-[10px] font-bold py-6 italic">
                          لا توجد مقالات حالياً
                        </p>
                      ) : (
                        (group.collection_posts || []).map(
                          (cp) =>
                            cp.posts && (
                              <div
                                key={cp.post_id}
                                className="flex items-center flex-row-reverse gap-4 p-3 bg-[#050505]/40 rounded-xl border border-white/5 group/item"
                              >
                                <div className="w-12 h-9 rounded-lg overflow-hidden bg-white/5 border border-white/5 shrink-0">
                                  {cp.posts.cover_image_url && (
                                    <OptimizedImage
                                      src={cp.posts.cover_image_url}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                  <p className="font-black text-xs md:text-sm text-white/80 truncate">
                                    {cp.posts.title}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    removePostFromGroup(group.id, cp.post_id)
                                  }
                                  className="w-8 h-8 flex items-center justify-center bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ),
                        )
                      )}

                      <button
                        onClick={() => setAddPostModal(group)}
                        className="w-full py-4 border-2 border-dashed border-white/5 rounded-xl font-black text-[10px] text-white/20 hover:text-white transition-all flex items-center justify-center gap-3 bg-white/[0.02]"
                      >
                        <Plus size={14} /> إضافة مقال للسلسلة
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(createModal || editModal) && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-6"
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setCreateModal(false);
                setEditModal(null);
              }}
              className="absolute inset-0 bg-black/90"
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 w-full max-w-lg relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-white flex items-center gap-4 italic text-right">
                  <FolderPlus size={28} className="text-purple-500" />
                  {editModal ? "تعديل السلسلة" : "سلسلة محتوى جديدة"}
                </h3>
                <button
                  onClick={() => {
                    setCreateModal(false);
                    setEditModal(null);
                  }}
                  className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-white/40 hover:text-white border border-white/5"
                >
                  <X size={24} />
                </button>
              </div>
              <form
                onSubmit={editModal ? handleEdit : handleCreate}
                className="space-y-8 text-right"
              >
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-2 text-right block">
                    اسم السلسلة *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="مثال: أساسيات البرمجة..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 font-black text-lg text-white outline-none focus:border-purple-500 transition-all text-right"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-2 text-right block">
                    الوصف (اختياري)
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="وصف السلسلة..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 font-bold text-base text-white/80 outline-none focus:border-purple-500 transition-all resize-none leading-relaxed text-right"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-xl shadow-2xl hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-4 disabled:opacity-50 border border-white/20"
                >
                  {saving ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Save size={24} />
                  )}
                  {saving
                    ? "جاري الحفظ..."
                    : editModal
                      ? "حفظ التعديلات"
                      : "إنشاء السلسلة الآن"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Post Modal */}
      <AnimatePresence>
        {addPostModal && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-6"
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddPostModal(null)}
              className="absolute inset-0 bg-black/90"
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 w-full max-w-xl relative z-10 shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-white flex items-center gap-4 italic text-right">
                  إضافة مقال لـ "{addPostModal.name}"
                </h3>
                <button
                  onClick={() => setAddPostModal(null)}
                  className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-white/40 hover:text-white border border-white/5"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 space-y-4 custom-scrollbar pr-4">
                {availablePosts(addPostModal).length === 0 ? (
                  <div className="text-center py-20 text-white/20 font-black italic text-center">
                    لا توجد مقالات متاحة
                  </div>
                ) : (
                  availablePosts(addPostModal).map((post) => (
                    <button
                      key={post.id}
                      onClick={() => {
                        addPostToGroup(addPostModal.id, post.id);
                        setAddPostModal(null);
                      }}
                      className="w-full flex flex-row-reverse items-center gap-6 p-4 rounded-[2rem] hover:bg-white/10 text-right transition-all border border-transparent hover:border-white/10"
                    >
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white/20 shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="font-black text-lg text-white truncate">
                          {post.title}
                        </p>
                      </div>
                      <Plus size={18} className="text-white/20" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
