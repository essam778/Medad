import { useState, useEffect, useRef } from "react";
import { getErrorMessage } from "@/lib/utils";
import { useAuth, ProfileService, AuthService } from "@auth";
import { uploadImage } from "../../lib/supabase";
import {
  User,
  Mail,
  Camera,
  Save,
  Check,
  Loader2,
  LogOut,
  Key,
  Trash2,
  Zap,
  ArrowRight,
  Send,
  Bell,
  BellOff,
  BellRing,
  Sparkles,
  ShieldCheck,
  X,
  AlertTriangle,
  RefreshCw,
  Compass,
  PenSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OptimizedImage from "../../components/shared/OptimizedImage";
import { useToast } from "../../components/shared/ToastProvider";

export default function UserProfile() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notificationType, setNotificationType] = useState("all");
  const [passwordModal, setPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const progressInterval = useRef(null);

  const [formData, setFormData] = useState({
    full_name: "",
    avatar_url: "",
    bio: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        avatar_url: profile.avatar_url || "",
        bio: profile.bio || "",
      });
      if (user?.id) checkExistingRequest();
    }
  }, [profile, user?.id]);

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  // تتبع ترقية المستخدم الفورية وعرض لوحة التحكم الجديدة له
  useEffect(() => {
    if (profile?.role === "author" && requestSent) {
      toast.success(
        "🎉 تهانينا! تم قبول طلبك ككاتب في منصة مداد. جاري تحويلك إلى لوحة التحكم الخاصة بك...",
        { duration: 6000 },
      );
      const timer = setTimeout(() => {
        window.location.href = "/dashboard";
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [profile?.role, requestSent, toast]);

  async function checkExistingRequest() {
    if (!user?.id) return;
    try {
      const { data } = await ProfileService.getCreatorRequest(user.id);
      if (data) setRequestSent(true);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);

    progressInterval.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval.current);
          return 85;
        }
        const increment = prev < 40 ? 8 : prev < 70 ? 4 : 1;
        return Math.min(prev + increment, 85);
      });
    }, 150);

    try {
      const url = await uploadImage(file, "avatars");
      clearInterval(progressInterval.current);
      setUploadProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setFormData((prev) => ({ ...prev, avatar_url: url }));
      toast.success("تم رفع الصورة بنجاح");
    } catch (err) {
      clearInterval(progressInterval.current);
      setUploadProgress(0);
      toast.error(getErrorMessage(err, "فشل رفع الصورة"));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const { error } = await updateProfile(formData);
      if (error) throw error;
      setSuccess(true);
      toast.success("تم تحديث الملف الشخصي");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      toast.error(getErrorMessage(err, "تعذر حفظ البيانات"));
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("يجب أن تكون كلمة المرور 6 أحرف على الأقل");
      return;
    }
    setChangingPass(true);
    try {
      const { error } = await AuthService.updatePassword(newPassword);
      if (error) throw error;
      toast.success("تم تغيير كلمة المرور بنجاح");
      setPasswordModal(false);
      setNewPassword("");
    } catch (err) {
      toast.error(getErrorMessage(err, "تعذر تغيير كلمة المرور"));
    } finally {
      setChangingPass(false);
    }
  }

  async function requestToJoin() {
    setRequesting(true);
    try {
      const { error } = await ProfileService.createCreatorRequest(
        user.id,
        "رغبة في الانضمام كصانع محتوى",
      );
      if (error) throw error;
      setRequestSent(true);
      toast.success("تم إرسال طلب الانضمام");
    } catch (err) {
      toast.error(getErrorMessage(err, "تعذر إرسال الطلب"));
    } finally {
      setRequesting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteAccountConfirm !== "حذف حسابي") return;
    setDeletingAccount(true);
    try {
      const { data, error } = await ProfileService.deleteUser(user.id);
      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);
      await signOut();
    } catch (err) {
      toast.error(getErrorMessage(err, "خطأ في حذف الحساب"));
      setDeletingAccount(false);
    }
  }

  const notificationOptions = [
    { id: "all", label: "الكل", icon: BellRing, color: "text-purple-400" },
    { id: "selective", label: "مخصص", icon: Bell, color: "text-blue-400" },
    { id: "muted", label: "صامت", icon: BellOff, color: "text-white/20" },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20" dir="rtl">
      {/* Header & Avatar */}
      <div className="flex flex-col items-center mb-16 pt-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative group">
          <div className="w-32 h-32 md:w-56 md:h-56 rounded-full bg-white/5 border border-white/10 shadow-2xl overflow-hidden relative group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
            {formData.avatar_url ? (
              <OptimizedImage
                src={formData.avatar_url}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/10 bg-white/5 font-black text-6xl italic">
                {formData.full_name?.[0]}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-black text-2xl tabular-nums">
                  {uploadProgress}%
                </span>
              </div>
            )}
          </div>

          <label
            className={`absolute -bottom-4 -right-4 p-5 rounded-3xl shadow-2xl border-4 border-[#0d0d0d] transition-all ${uploading ? "bg-white/5 text-white/20 cursor-not-allowed opacity-40" : "bg-purple-600 text-white cursor-pointer hover:bg-purple-500 group-hover:scale-110 shadow-purple-600/20"}`}
          >
            {uploading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <Camera size={24} />
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        <div className="mt-10 text-center">
          <h1 className="text-3xl md:text-6xl font-black tracking-tight text-white italic">
            {formData.full_name || "مستخدم مداد"}
          </h1>
          <p className="text-white/20 mt-4 font-black uppercase tracking-[0.3em] text-[10px]">
            {profile?.role === "admin"
              ? "مدير عام المنصة"
              : profile?.role === "author"
                ? "صانع محتوى متميز"
                : "قارئ مشارك"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Main Settings Card */}
        <div className="bg-[#0d0d0d]/95 md:bg-[#0d0d0d]/40 md:backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 md:p-16 shadow-2xl space-y-12 relative overflow-hidden group">
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-2">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 outline-none focus:border-purple-500 focus:bg-white/10 transition-all font-black text-lg text-white"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-4 opacity-50">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-2">
                  البريد الإلكتروني (ثابت)
                </label>
                <input
                  type="email"
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 outline-none font-black text-lg text-white"
                  value={user?.email}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-2">
                نبذة تعريفية (Bio)
              </label>
              <textarea
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 outline-none focus:border-purple-500 focus:bg-white/10 transition-all font-bold text-base text-white/80 resize-none leading-relaxed shadow-xl"
                placeholder="أخبرنا قليلاً عن نفسك وما تهتم به..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
              />
            </div>
          </div>

          <div className="pt-12 border-t border-white/5">
            <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] mb-8 px-2">
              نظام التنبيهات الذكي
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {notificationOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setNotificationType(opt.id)}
                  className={`flex items-center gap-5 p-6 rounded-3xl border transition-all ${
                    notificationType === opt.id
                      ? "border-purple-500 bg-purple-600/10 text-white shadow-xl shadow-purple-600/10"
                      : "border-white/5 bg-white/5 text-white/30 hover:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${notificationType === opt.id ? "bg-purple-600 text-white" : "bg-white/5"}`}
                  >
                    <opt.icon size={22} />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Gamification Section */}
          <div className="pt-12 border-t border-white/5">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em]">
                إنجازات المبدع
              </h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-600/20">
                <Zap size={14} className="fill-white" />
                <span className="text-xs font-black">
                  {profile?.points || 0} نقطة
                </span>
                <button
                  onClick={async () => {
                    const { data } = await ProfileService.getPoints(user.id);
                    if (data && typeof updateProfile === "function") {
                      updateProfile({ points: data.points });
                      toast.success("تم تحديث الرصيد");
                    }
                  }}
                  className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Progress Card */}
              <div className="md:col-span-1 bg-white/5 rounded-[2.5rem] p-8 border border-white/5 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">
                    المستوى الحالي
                  </p>
                  <h4 className="text-5xl font-black text-white italic">
                    {Math.floor((profile?.points || 0) / 100) + 1}
                  </h4>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(profile?.points || 0) % 100}%` }}
                    className="h-full bg-purple-600 rounded-full"
                  />
                </div>
                <p className="text-[9px] font-black text-white/20 mt-3 text-center uppercase tracking-tighter">
                  باقي {100 - ((profile?.points || 0) % 100)} نقطة للمستوى
                  التالي
                </p>
              </div>

              {/* Badges Grid */}
              <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  {
                    id: "explorer",
                    name: "مكتشف",
                    icon: Compass,
                    color: "text-blue-400",
                    desc: "انضم لأسرة مداد",
                    earned: true,
                  },
                  {
                    id: "writer",
                    name: "كاتب نشط",
                    icon: PenSquare,
                    color: "text-green-400",
                    desc: "نشر أول مقال",
                    earned: (profile?.points || 0) >= 10,
                  },
                  {
                    id: "star",
                    name: "نجم صاعد",
                    icon: Sparkles,
                    color: "text-gold",
                    desc: "تجاوز 100 نقطة",
                    earned: (profile?.points || 0) >= 100,
                  },
                  {
                    id: "legend",
                    name: "أسطورة",
                    icon: ShieldCheck,
                    color: "text-purple-400",
                    desc: "تجاوز 500 نقطة",
                    earned: (profile?.points || 0) >= 500,
                  },
                ].map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-3xl border flex flex-col items-center text-center gap-3 transition-all ${badge.earned ? "bg-white/5 border-white/10 opacity-100" : "bg-black/20 border-white/5 opacity-20 grayscale"}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${badge.earned ? "bg-white/5 " + badge.color : "bg-white/5 text-white/20"}`}
                    >
                      <badge.icon size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white">
                        {badge.name}
                      </p>
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-tighter mt-0.5">
                        {badge.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="w-full bg-white text-black py-6 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 border border-white/20"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : success ? (
              <Check size={24} className="text-green-500" />
            ) : (
              <Save size={24} />
            )}
            <span>
              {loading
                ? "جاري المزامنة..."
                : success
                  ? "تم حفظ الملف الشخصي!"
                  : "تحديث بيانات الحساب"}
            </span>
          </button>
        </div>

        {/* Creator Request Banner */}
        {profile?.role === "reader" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-600 rounded-[3rem] p-8 md:p-14 text-white shadow-2xl relative overflow-hidden group border border-purple-400/20"
          >
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Zap size={140} className="fill-white" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl md:text-4xl font-black mb-4 flex items-center gap-4 italic">
                <Sparkles size={28} className="text-white" /> هل أنت جاهز لتكون
                ملهماً؟
              </h3>
              <p className="text-white/80 text-sm md:text-lg font-bold mb-10 max-w-2xl leading-relaxed">
                انضم إلى نخبة الكتاب في مداد. أرسل طلبك الآن واحصل على مساحتك
                الخاصة لنشر أفكارك وإبداعك للعالم.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {requestSent ? (
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 flex items-center gap-5 w-full sm:w-fit">
                    <div className="w-12 h-12 bg-white text-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <Check size={24} />
                    </div>
                    <div>
                      <div className="font-black text-lg">
                        طلبك قيد المراجعة الفنية
                      </div>
                      <p className="text-white/60 text-xs font-black uppercase tracking-widest mt-1">
                        سنتواصل معك عبر البريد قريباً
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={requestToJoin}
                    disabled={requesting}
                    className="w-full sm:w-auto bg-white text-purple-600 px-12 py-5 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
                  >
                    {requesting ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <Zap size={20} className="fill-purple-600" />
                    )}
                    <span>ارسل طلب الانضمام</span>
                  </button>
                )}
                {!requestSent && (
                  <div className="text-white/50 text-xs font-black flex items-center gap-3 uppercase tracking-widest">
                    <ShieldCheck size={16} /> فحص يدوي دقيق لضمان الجودة
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Danger Zone Actions */}
        <div className="flex flex-col sm:flex-row gap-6">
          <button
            onClick={() => setPasswordModal(true)}
            className="flex-1 py-6 bg-white/5 border border-white/10 rounded-3xl font-black text-white/40 text-[11px] uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-4 shadow-xl"
          >
            <Key size={18} /> تحديث كلمة المرور
          </button>
          <button
            onClick={signOut}
            className="flex-1 py-6 bg-red-500/10 border border-red-500/20 rounded-3xl font-black text-red-400 text-[11px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-4 shadow-xl"
          >
            <LogOut size={18} /> تسجيل الخروج من مداد
          </button>
        </div>

        {/* Account Deletion Region */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-[3rem] p-8 md:p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <AlertTriangle size={80} className="text-red-500" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h3 className="font-black text-red-500 text-xl flex items-center gap-3 mb-2">
                <AlertTriangle size={22} /> منطقة الخطر
              </h3>
              <p className="text-red-400/40 text-xs font-bold leading-relaxed max-w-md">
                حذف الحساب نهائي وسيؤدي لمسح كافة بياناتك وتاريخك في المنصة.
              </p>
            </div>
            <button
              onClick={() => setDeleteAccountModal(true)}
              className="px-8 py-4 bg-red-500/10 text-red-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
            >
              حذف الحساب نهائياً
            </button>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {passwordModal && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-6"
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPasswordModal(false)}
              className="absolute inset-0 bg-black/90"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d0d0d] border border-white/10 text-white rounded-[3rem] p-12 w-full max-w-md relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black flex items-center gap-4 italic">
                  <ShieldCheck className="text-purple-500" /> كلمة مرور جديدة
                </h3>
                <button
                  onClick={() => setPasswordModal(false)}
                  className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-white/40 hover:text-white border border-white/5"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={changePassword} className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest mr-2">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 font-black text-lg outline-none focus:border-purple-500 transition-all text-white placeholder:text-white/10"
                    placeholder="6 أحرف على الأقل..."
                  />
                </div>
                <button
                  disabled={changingPass}
                  className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-purple-600/20 hover:bg-purple-500 flex items-center justify-center gap-4 active:scale-95 transition-all"
                >
                  {changingPass ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <Check size={24} />
                  )}
                  <span>
                    {changingPass ? "جاري التحديث..." : "تأكيد التغيير"}
                  </span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {deleteAccountModal && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-6"
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setDeleteAccountModal(false);
                setDeleteAccountConfirm("");
              }}
              className="absolute inset-0 bg-black/90"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d0d0d] border border-white/10 text-white rounded-[3rem] p-12 w-full max-w-md relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-red-500 flex items-center gap-4">
                  <AlertTriangle size={28} /> حذف الحساب نهائياً
                </h3>
                <button
                  onClick={() => {
                    setDeleteAccountModal(false);
                    setDeleteAccountConfirm("");
                  }}
                  className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-white/40 hover:text-white border border-white/5"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-10">
                <p className="text-red-500 text-sm font-bold leading-relaxed italic text-center">
                  سيتم حذف كافة مقالاتك وتعليقاتك وتاريخك بشكل لا يمكن التراجع
                  عنه.
                </p>
              </div>
              <p className="text-base font-bold text-white/40 mb-6 text-center">
                لتأكيد الحذف، اكتب:{" "}
                <strong className="text-red-500">"حذف حسابي"</strong>
              </p>
              <input
                type="text"
                value={deleteAccountConfirm}
                onChange={(e) => setDeleteAccountConfirm(e.target.value)}
                placeholder="اكتب هنا..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 font-black text-lg outline-none focus:border-red-500 transition-all mb-10 text-center text-white"
              />
              <button
                onClick={handleDeleteAccount}
                disabled={
                  deleteAccountConfirm !== "حذف حسابي" || deletingAccount
                }
                className="w-full py-6 bg-red-500 text-white rounded-2xl font-black text-lg hover:bg-red-600 transition-all flex items-center justify-center gap-4 disabled:opacity-20 shadow-xl shadow-red-500/20"
              >
                {deletingAccount ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Trash2 size={24} />
                )}
                {deletingAccount ? "جاري الحذف..." : "تأكيد الحذف النهائي"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
