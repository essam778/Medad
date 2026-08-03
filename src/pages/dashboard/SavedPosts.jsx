import { useState, useEffect } from "react";
import { getErrorMessage } from "@/lib/utils";
import { supabase } from "../../lib/supabase";
import { useAuth } from "@auth";
import { Link } from "react-router-dom";
import { formatDate } from "../../lib/utils";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  Sparkles,
  Clock,
  ArrowLeft,
  Trash2,
  BookOpen,
  User as UserIcon,
} from "lucide-react";
import { useToast } from "../../components/shared/ToastProvider";
import OptimizedImage from "../../components/shared/OptimizedImage";

export default function SavedPosts() {
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (user) fetchSavedPosts();
  }, [user]);

  async function fetchSavedPosts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_posts")
        .select(
          `
          id,
          created_at,
          posts (
            id,
            title,
            slug,
            cover_image_url,
            published_at,
            profiles (
              full_name,
              avatar_url
            )
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const validPosts = data?.filter((item) => item.posts) || [];
      setSavedPosts(validPosts);
    } catch (err) {
      console.error("Error fetching saved posts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function removeSave(saveId) {
    try {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("id", saveId);
      if (error) throw error;
      setSavedPosts((prev) => prev.filter((p) => p.id !== saveId));
      toast.success("تمت إزالة المقال من المحفوظات");
    } catch (err) {
      toast.error(getErrorMessage(err, "فشل في إزالة الحفظ"));
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-40">
        <LoadingSpinner className="w-16 h-16 text-purple-600" />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto pb-20" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl md:text-6xl font-black tracking-tight flex items-center gap-5 text-white">
            مكتبتي الخاصة
            <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
              <Bookmark size={24} className="md:w-8 md:h-8" />
            </div>
          </h1>
          <p className="text-white/30 mt-4 font-black uppercase tracking-[0.3em] text-[10px]">
            مجموعتك المختارة من أفضل المقالات
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/5 border border-white/10 px-8 py-5 rounded-[2.5rem] shadow-2xl md:backdrop-blur-3xl flex items-center gap-6 w-fit"
        >
          <div className="w-12 h-12 bg-purple-600/20 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/20">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-2xl md:text-4xl font-black tabular-nums leading-none text-white">
              {savedPosts.length}
            </p>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-2">
              مقال محفوظ
            </p>
          </div>
        </motion.div>
      </div>

      {savedPosts.length === 0 ? (
        <div className="text-center py-40 bg-[#0d0d0d]/95 md:bg-[#0d0d0d]/40 md:backdrop-blur-3xl border border-dashed border-white/10 rounded-[4rem] px-10 shadow-2xl">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-white/5"
          >
            <Sparkles size={48} className="text-white/10" />
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4 italic">
            مكتبتك فارغة حالياً
          </h2>
          <p className="text-white/20 font-bold mb-12 max-w-sm mx-auto text-sm md:text-lg">
            ابدأ باستكشاف المقالات وقم بحفظ ما يعجبك للعودة إليه لاحقاً.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-4 bg-purple-600 text-white px-10 py-5 rounded-3xl font-black text-lg shadow-xl shadow-purple-600/20 hover:bg-purple-500 transition-all"
          >
            استكشاف المنصة <ArrowLeft size={20} className="rotate-180" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:gap-12">
          <AnimatePresence>
            {savedPosts.map((item, i) => {
              const post = item.posts;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative bg-[#0d0d0d]/95 md:bg-[#0d0d0d]/40 md:backdrop-blur-3xl border border-white/10 rounded-[3rem] p-6 md:p-10 hover:border-purple-600/20 hover:shadow-[0_30px_70px_rgba(0,0,0,0.6)] transition-all flex flex-col md:flex-row gap-8 md:gap-12 items-center overflow-hidden"
                >
                  <div className="w-full md:w-80 aspect-[16/10] rounded-[2.5rem] overflow-hidden bg-white/5 shrink-0 shadow-2xl group-hover:shadow-purple-600/10 transition-all duration-700 border border-white/5">
                    {post.cover_image_url ? (
                      <OptimizedImage
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/5">
                        <Sparkles size={48} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-6 text-right relative z-10 w-full">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} className="text-purple-500" />{" "}
                        {formatDate(post.published_at)}
                      </span>
                      <span className="px-4 py-1.5 bg-purple-600/10 border border-purple-500/20 rounded-full text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                        <UserIcon size={12} /> {post.profiles?.full_name}
                      </span>
                    </div>

                    <h3 className="text-xl md:text-4xl font-black leading-tight text-white group-hover:text-purple-400 transition-colors line-clamp-2 italic">
                      <Link to={`/post/${post.slug}`}>{post.title}</Link>
                    </h3>

                    <p className="text-white/20 text-xs md:text-lg font-bold line-clamp-2 leading-relaxed hidden sm:block">
                      {post.excerpt ||
                        "هذا المقال لا يحتوي على وصف مختصر، اضغط للمزيد من التفاصيل..."}
                    </p>

                    <div className="flex items-center gap-4 pt-6">
                      <Link
                        to={`/post/${post.slug}`}
                        className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-black text-sm md:text-base shadow-2xl hover:bg-purple-600 hover:text-white transition-all whitespace-nowrap border border-white/20"
                      >
                        قراءة المقال{" "}
                        <ArrowLeft size={18} className="rotate-180" />
                      </Link>
                      <button
                        onClick={() => removeSave(item.id)}
                        className="w-14 h-14 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-red-500/10 shadow-xl"
                        title="إزالة من المحفوظات"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
