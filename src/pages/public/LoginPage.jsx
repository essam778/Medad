import { useState, useEffect } from "react";
import { getErrorMessage } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../features/auth/context/AuthContext";

export default function LoginPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/studio", { replace: true });
    }
  }, [user, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      navigate("/studio", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "فشل تسجيل الدخول"));
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthLogin(provider) {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err) {
      setError(getErrorMessage(err, `فشل الدخول عبر ${provider}`));
    }
  }

  return (
    <div
      className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden font-arabic"
      dir="rtl"
    >
      {/* Background Neon Effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />

      {/* Header Logo Area */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center relative z-10"
      >
        <Link
          to="/"
          className="text-5xl md:text-6xl font-black text-white tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        >
          مداد
        </Link>
        <p className="text-purple-300/60 text-xs md:text-sm font-black tracking-[0.4em] uppercase mt-4">
          مستقبل الحبر الرقمي
        </p>
      </motion.div>

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-[480px] relative z-10"
      >
        {/* Glow Border Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-tr from-purple-600/30 to-blue-600/30 rounded-[2.5rem] blur opacity-50" />

        <div className="relative bg-[#0d0d0d]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
              تسجيل الدخول
            </h2>
            <p className="text-white/40 text-sm font-bold">
              أهلاً بك في عالم الإبداع الأدبي المتطور
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-black overflow-hidden"
              >
                <AlertCircle size={16} />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 mr-2">
                <Mail size={12} className="text-purple-400" /> البريد الإلكتروني
              </label>
              <input
                type="email"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all text-sm font-bold text-white placeholder:text-white/10"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center mr-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Lock size={12} className="text-purple-400" /> كلمة المرور
                </label>
                <Link
                  to="/forgot-password"
                  size="sm"
                  className="text-[10px] text-white/30 hover:text-white transition-colors font-bold"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all text-sm font-bold text-white placeholder:text-white/10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl py-5 font-black text-white shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <LogIn size={20} />
              )}
              <span className="relative z-10">
                {loading ? "جاري الدخول..." : "دخول"}
              </span>
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-[#0d0d0d] px-4 text-white/20 font-black tracking-widest">
                أو المتابعة عبر
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleOAuthLogin("google")}
              className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl py-4 font-bold text-white/80 hover:bg-white/10 transition-all text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              جوجل
            </button>
            <button className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl py-4 font-bold text-white/80 hover:bg-white/10 transition-all text-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.11.8 1.12-.16 2.13-.83 3.69-.73 2.1.14 3.67 1.05 4.38 2.65-4.22 1.94-3.53 7.84.67 9.56-.45 1.01-1.04 1.91-1.85 2.69zM12 7.05c-.06-3.01 2.46-5.58 5.39-5.69.29 3.44-3.26 6.13-5.39 5.69z"
                />
              </svg>
              آبل
            </button>
          </div>

          <div className="mt-10 text-center">
            <p className="text-white/30 text-sm font-bold">
              ليس لديك حساب؟{" "}
              <Link
                to="/register"
                className="text-purple-400 hover:text-purple-300 transition-colors underline-offset-4 hover:underline"
              >
                أنشئ حساباً جديداً
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer Links */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-12 md:mt-24 relative z-10 flex flex-col items-center gap-6"
      >
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {["عن مداد", "الشروط", "الخصوصية", "تواصل معنا"].map((link) => (
            <Link
              key={link}
              to="#"
              className="text-white/20 hover:text-white/60 text-xs md:text-sm font-bold transition-colors"
            >
              {link}
            </Link>
          ))}
        </div>
        <p className="text-white/10 text-[10px] md:text-xs font-bold tracking-widest">
          © ٢٠٢٤ مداد - مستقبل الحبر الرقمي
        </p>
      </motion.footer>
    </div>
  );
}
