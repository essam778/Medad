import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthService } from "@/features/auth/services/auth.service";
import { supabase } from "../../lib/supabase";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Ticket,
  AlertCircle,
  LogIn,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@auth";
import { getErrorMessage } from "@/lib/utils";
import { useToast } from "../../components/shared/ToastProvider";

export default function RegisterPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (user) navigate("/studio", { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let role = "reader";
      if (inviteCode.trim()) {
        const { data: codeData, error: codeError } =
          await AuthService.checkInviteCode(inviteCode);

        if (codeError || !codeData) {
          setError("كود الدعوة غير صحيح أو تم استخدامه مسبقاً");
          setLoading(false);
          return;
        }
        role = codeData.role;
      }

      const { error: authError } = await AuthService.signUp(
        email,
        password,
        fullName,
        role,
      );

      if (authError) throw authError;

      if (inviteCode.trim()) {
        await AuthService.markInviteCodeUsed(inviteCode);
      }

      setRegisteredEmail(email);
      setEmailSent(true);
    } catch (err) {
      setError(getErrorMessage(err, "فشل التسجيل"));
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div
        className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden font-arabic"
        dir="rtl"
      >
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[480px] relative z-10"
        >
          <div className="bg-[#0d0d0d]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-12 text-center shadow-2xl">
            <div className="w-20 h-20 bg-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-purple-500/30">
              <Mail size={40} className="text-purple-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-4">
              تحقق من بريدك
            </h1>
            <p className="text-white/40 font-bold text-sm mb-8 leading-relaxed">
              أرسلنا رابط التأكيد إلى: <br />
              <span className="text-purple-400">{registeredEmail}</span>
            </p>
            <Link
              to="/login"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-purple-600/20"
            >
              <LogIn size={18} /> العودة للدخول
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden font-arabic"
      dir="rtl"
    >
      {/* Background Neon Effects */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Logo Area */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center relative z-10"
      >
        <Link
          to="/"
          className="text-5xl font-black text-white tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        >
          مداد
        </Link>
        <p className="text-purple-300/60 text-[10px] font-black tracking-[0.4em] uppercase mt-3">
          مستقبل الحبر الرقمي
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] relative z-10"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-600/30 to-purple-600/30 rounded-[2.5rem] blur opacity-50" />
        <div className="relative bg-[#0d0d0d]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white mb-1">إنشاء حساب</h2>
            <p className="text-white/40 text-xs font-bold">
              انضم لنخبة المبدعين والقراء العرب
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-black"
              >
                <AlertCircle size={16} /> <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mr-2">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:border-blue-500/50 text-sm font-bold text-white"
                  placeholder="أحمد علي"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mr-2">
                  كود الدعوة
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full bg-purple-500/5 border border-purple-500/10 rounded-xl py-3.5 px-5 outline-none focus:border-purple-500/50 text-sm font-bold text-purple-200"
                  placeholder="اختياري..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mr-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:border-blue-500/50 text-sm font-bold text-white"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mr-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:border-blue-500/50 text-sm font-bold text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-4 rounded-xl font-black text-white shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin mx-auto" />
              ) : (
                "إنشاء الحساب"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/30 text-xs font-bold">
              لديك حساب بالفعل؟{" "}
              <Link to="/login" className="text-blue-400 hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      <footer className="mt-12 text-center relative z-10">
        <p className="text-white/10 text-[9px] font-black tracking-widest uppercase">
          © ٢٠٢٤ مداد - مستقبل الحبر الرقمي
        </p>
      </footer>
    </div>
  );
}
