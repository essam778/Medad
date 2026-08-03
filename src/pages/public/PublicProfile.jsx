import { useState, useEffect } from "react";
import { getErrorMessage } from "@/lib/utils";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ProfileService } from "@/features/auth/services/profile.service";
import { supabase } from "../../lib/supabase";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Calendar,
  MapPin,
  Link as LinkIcon,
  MessageSquare,
  Heart,
  Shield,
  ShieldAlert,
  Trash2,
  PenSquare,
  ExternalLink,
  Settings,
  Crown,
  UserX,
  UserCheck,
} from "lucide-react";
import { formatDate } from "../../lib/utils";
import { useAuth } from "@/features/auth";
import { useToast } from "../../components/shared/ToastProvider";
import ConfirmModal from "../../components/shared/ConfirmModal";

export default function PublicProfile() {
  const { id } = useParams();
  const { user: currentUser, profile: currentProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ comments: 0, likes: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false });

  const isAdmin = currentProfile?.role === "admin";

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const { data, error } = await ProfileService.getPublicProfile(id);

      if (error) throw error;
      setProfile(data);

      const statsData = await ProfileService.getUserStats(id);
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleBan() {
    try {
      const { error } = await ProfileService.toggleBan(id, profile.is_banned);
      if (error) throw error;
      setProfile({ ...profile, is_banned: !profile.is_banned });
      toast.success(profile.is_banned ? "تم رفع الحظر" : "تم حظر المستخدم");
    } catch (err) {
      toast.error(getErrorMessage(err, "فشل تحديث حالة المستخدم"));
    }
  }

  async function updateRole(newRole) {
    try {
      const { error } = await ProfileService.updateRole(id, newRole);
      if (error) throw error;
      setProfile({ ...profile, role: newRole });
      toast.success("تم تحديث الرتبة بنجاح");
    } catch (err) {
      toast.error(getErrorMessage(err, "فشل تحديث الرتبة"));
    }
  }

  async function handleDelete() {
    try {
      const { data, error } = await ProfileService.deleteUser(id);
      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);
      toast.success("تم حذف المستخدم نهائياً");
      navigate("/");
    } catch (err) {
      toast.error(getErrorMessage(err, "فشل حذف المستخدم"));
    }
  }

  if (loading) return <LoadingSpinner fullPage />;
  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center font-black">
        المستخدم غير موجود
      </div>
    );

  const hasChannel =
    profile.site_settings &&
    (Array.isArray(profile.site_settings)
      ? profile.site_settings.length > 0
      : true);
  const channelData = Array.isArray(profile.site_settings)
    ? profile.site_settings[0]
    : profile.site_settings;

  return (
    <div
      className="min-h-screen bg-[#050505] text-white font-arabic py-12 md:py-20 px-4"
      dir="rtl"
    >
      <ConfirmModal
        open={deleteConfirm.open}
        title="حذف حساب"
        message={`هل أنت متأكد من حذف حساب "${profile.full_name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false })}
        variant="danger"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div
              className={`w-32 h-32 md:w-48 md:h-48 rounded-[3rem] bg-purple-600/20 text-purple-400 flex items-center justify-center text-6xl font-black overflow-hidden border-2 border-purple-500/30 shadow-2xl relative ${profile.is_banned ? "grayscale opacity-50" : ""}`}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.full_name?.[0]
              )}
              {profile.is_banned && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                  <UserX size={48} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-right">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <h1 className="text-3xl md:text-5xl font-black text-white italic">
                  {profile.full_name}
                </h1>
                <div className="flex gap-2 justify-center">
                  <span className="px-5 py-2 bg-purple-600/10 text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-purple-500/20 shadow-xl">
                    {profile.role === "admin"
                      ? "مدير النظام"
                      : profile.role === "author"
                        ? "كاتب متميز"
                        : "عضو في مداد"}
                  </span>
                  {profile.is_banned && (
                    <span className="px-5 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl">
                      محظور
                    </span>
                  )}
                </div>
              </div>

              {profile.bio ? (
                <p className="text-white/60 font-bold leading-relaxed mb-8 max-w-xl text-lg">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-white/20 italic mb-8 font-black">
                  لا يوجد وصف تعريفي لهذا الحساب حالياً.
                </p>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-xs font-black text-white/40">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>انضم في {formatDate(profile.created_at)}</span>
                </div>
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-white/5">
            <div className="p-6 bg-[#050505]/50 border border-white/5 rounded-3xl text-center shadow-xl">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-400 border border-white/5">
                <MessageSquare size={24} />
              </div>
              <p className="text-3xl font-black text-white tabular-nums">
                {stats.comments}
              </p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">
                تعليق
              </p>
            </div>
            <div className="p-6 bg-[#050505]/50 border border-white/5 rounded-3xl text-center shadow-xl">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-400 border border-white/5">
                <Heart size={24} />
              </div>
              <p className="text-3xl font-black text-white tabular-nums">
                {stats.likes}
              </p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">
                إعجاب
              </p>
            </div>
            {hasChannel && (
              <Link
                to={`/c/${channelData.channel_slug}`}
                className="p-6 bg-purple-600 rounded-3xl text-center hover:bg-purple-500 transition-all md:col-span-1 col-span-2 group shadow-xl shadow-purple-600/20 border border-purple-500/30"
              >
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white group-hover:scale-110 transition-transform">
                  <LinkIcon size={24} />
                </div>
                <p className="text-lg font-black mb-1 text-white">
                  زيارة القناة
                </p>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                  عرض كل المقالات
                </p>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Admin Management Section */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-red-500/5 backdrop-blur-3xl border border-red-500/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-xl">
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white italic">
                  أدوات الإدارة
                </h2>
                <p className="text-red-500/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                  تحكم كامل في الحساب والمحتوى
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest px-4">
                  تغيير الرتبة
                </p>
                <div className="flex gap-2">
                  {[
                    ["reader", "قارئ"],
                    ["author", "كاتب"],
                    ["admin", "مدير"],
                  ].map(([role, label]) => (
                    <button
                      key={role}
                      onClick={() => updateRole(role)}
                      className={`flex-1 py-3 rounded-2xl text-[10px] font-black transition-all border ${profile.role === role ? "bg-white text-black border-white" : "bg-white/5 text-white/40 border-white/5 hover:border-white/20"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest px-4">
                  إجراءات سريعة
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={toggleBan}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black transition-all border ${profile.is_banned ? "bg-green-600 text-white border-green-500" : "bg-orange-600/10 text-orange-500 border-orange-500/20"}`}
                  >
                    {profile.is_banned ? (
                      <>
                        <UserCheck size={16} /> رفع الحظر
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={16} /> حظر العضو
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ open: true })}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black border border-red-500 shadow-xl shadow-red-600/20"
                  >
                    <Trash2 size={16} /> حذف نهائي
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-red-500/10">
              <Link
                to={`/studio/all-posts?user_id=${id}`}
                className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-6 rounded-[2rem] border border-white/5 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                    <PenSquare size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">
                      إدارة مقالات المبدع
                    </p>
                    <p className="text-white/40 text-xs font-bold mt-1">
                      عرض، تعديل، أو حذف جميع منشورات هذا العضو
                    </p>
                  </div>
                </div>
                <ExternalLink
                  size={24}
                  className="text-white/20 group-hover:text-white transition-colors"
                />
              </Link>
            </div>
          </motion.div>
        )}

        <div className="text-center">
          <button
            onClick={() => window.history.back()}
            className="text-sm font-black text-white/40 hover:text-white transition-colors flex items-center gap-2 mx-auto bg-white/5 px-8 py-4 rounded-full border border-white/5 hover:border-white/10"
          >
            العودة للمقالة
          </button>
        </div>
      </div>
    </div>
  );
}
