import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Bell,
  Menu,
  X,
  LayoutDashboard,
  User,
  LogOut,
  Moon,
  Sun,
  PenSquare,
  Compass,
  BookOpen,
  Layers,
  Zap,
  Hash,
} from "lucide-react";
import { useAuth } from "@auth";
import { useTheme } from "../../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import OptimizedImage from "../shared/OptimizedImage";

// Lazy load notification center — only needed for logged-in users
const NotificationCenter = lazy(() => import("../shared/NotificationCenter"));

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    closeAllMenus();
  }, [location.pathname]);

  const closeAllMenus = () => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      closeAllMenus();
    }
  };

  const isAuthorOrAdmin =
    profile?.role === "author" || profile?.role === "admin";

  const navLinks = [
    { to: "/", label: "الرئيسية", icon: Compass },
    { to: "/categories", label: "التصنيفات", icon: Hash },
    { to: "/writers", label: "اكتشف", icon: Zap },
    isAuthorOrAdmin && { to: "/studio/groups", label: "سلاسل", icon: Layers },
    isAuthorOrAdmin && {
      to: "/studio/posts",
      label: "مقالاتي",
      icon: BookOpen,
    },
  ].filter(Boolean);

  const handleSignOut = async () => {
    await signOut();
    closeAllMenus();
  };

  return (
    <>
      <header
        className="sticky top-0 z-[60] bg-[#050505] py-5 border-b border-white/5"
        dir="rtl"
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="group flex items-center gap-3">
                <div className="w-11 h-11 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform">
                  <span className="text-white font-black text-2xl italic mt-1">
                    م
                  </span>
                </div>
                <span className="text-2xl md:text-3xl font-black text-white tracking-tighter italic">
                  مداد
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center justify-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-2xl">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${
                    location.pathname === link.to
                      ? "text-white bg-white/10 shadow-lg border border-white/10"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {isAuthorOrAdmin && (
                <Link
                  to="/studio/posts/new"
                  className="hidden md:flex items-center gap-2.5 px-6 py-2.5 bg-white text-black hover:bg-purple-600 hover:text-white rounded-xl font-black text-xs shadow-2xl transition-all active:scale-95 border border-white/20"
                >
                  <PenSquare size={16} />
                  <span>أنتج</span>
                </Link>
              )}

              <div className="flex items-center gap-1 md:gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/5 shadow-xl">
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="البحث"
                  className="p-2.5 text-white/40 hover:text-purple-400 hover:bg-purple-600/10 rounded-xl transition-all"
                >
                  <Search size={20} />
                </button>
                {user && (
                  <Suspense fallback={<div className="w-10 h-10" />}>
                    <NotificationCenter />
                  </Suspense>
                )}

                {user && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-purple-600/10 border border-purple-500/20 rounded-xl mx-2">
                    <Zap
                      size={14}
                      className="text-purple-500 fill-purple-500"
                    />
                    <span className="text-[10px] font-black text-purple-400">
                      {profile?.points || 0}
                    </span>
                    <div className="w-px h-3 bg-purple-500/20 mx-1" />
                    <span className="text-[10px] font-black text-white/40">
                      LVL {Math.floor((profile?.points || 0) / 100) + 1}
                    </span>
                  </div>
                )}

                {user ? (
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-label="قائمة المستخدم"
                    className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/10 hover:border-purple-500 transition-all shadow-xl"
                  >
                    {profile?.avatar_url ? (
                      <OptimizedImage
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        width={40}
                        height={40}
                      />
                    ) : (
                      <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-black">
                        {profile?.full_name?.[0]}
                      </div>
                    )}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="px-5 py-2 text-white/60 hover:text-white text-xs font-black transition-all"
                  >
                    دخول
                  </Link>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="القائمة"
                className="lg:hidden p-2 text-white"
              >
                <Menu size={28} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* User Menu Dropdown */}
      <AnimatePresence>
        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-[65]"
              onClick={() => setUserMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="fixed left-4 md:left-8 top-20 w-72 bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-4 shadow-[0_30px_70px_rgba(0,0,0,0.7)] z-[70]"
            >
              <div className="p-5 mb-4 bg-white/5 rounded-[2rem] flex items-center gap-4 border border-white/5 text-right">
                <div className="w-10 h-10 rounded-full bg-purple-600/10 border border-purple-500/20 overflow-hidden flex items-center justify-center font-black text-purple-400 italic shrink-0 shadow-lg transition-all">
                  {profile?.avatar_url ? (
                    <OptimizedImage
                      src={profile.avatar_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile?.full_name?.[0] || "U"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-black text-sm truncate">
                    {profile?.full_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-white/40 text-[10px] uppercase tracking-widest">
                      {profile?.role || "مبدع"}
                    </p>
                    <span className="w-1 h-1 rounded-full bg-white/10" />
                    <p className="text-purple-400 text-[10px] font-black italic">
                      مستوى {Math.floor((profile?.points || 0) / 100) + 1}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1 p-1 text-right">
                <Link
                  to="/studio"
                  onClick={closeAllMenus}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  <LayoutDashboard size={18} /> لوحة التحكم
                </Link>
                <Link
                  to="/studio/profile"
                  onClick={closeAllMenus}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  <User size={18} /> الملف الشخصي
                </Link>
                <div className="h-px bg-white/5 my-3 mx-2" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black text-red-400 hover:bg-red-400/10 transition-all text-right"
                >
                  <LogOut size={18} /> تسجيل الخروج
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay & Sidebar (CSS Transition) */}
      <div
        className={`fixed inset-0 bg-black/90 z-[100] transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={closeAllMenus}
      />
      <aside
        className={`fixed inset-y-0 right-0 w-[85%] max-w-sm bg-[#050505] z-[110] p-8 flex flex-col border-l border-white/5 shadow-2xl transition-transform duration-300 transform will-change-transform ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl italic">
              م
            </div>
            <span className="text-3xl font-black text-white italic">مداد</span>
          </div>
          <button
            onClick={closeAllMenus}
            aria-label="إغلاق"
            className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white"
          >
            <X size={24} />
          </button>
        </div>
        <div className="space-y-3 flex-1 text-right" onClick={closeAllMenus}>
          {user && (
            <Link
              to="/studio/posts/new"
              className="flex items-center gap-4 p-4 rounded-2xl bg-purple-600 text-sm font-black text-white shadow-lg shadow-purple-600/20 mb-4"
            >
              <PenSquare size={20} /> أنتج مقالاً جديداً
            </Link>
          )}
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-4 p-4 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 text-sm font-black transition-all"
              >
                <link.icon size={20} /> {link.label}
              </Link>
            ))}
          </div>
          {!user ? (
            <div className="pt-6 space-y-3">
              <Link
                to="/login"
                className="flex items-center justify-center w-full py-4 rounded-2xl bg-white text-black font-black text-sm shadow-xl"
              >
                تسجيل الدخول
              </Link>
              <Link
                to="/register"
                className="flex items-center justify-center w-full py-4 rounded-2xl border border-white/10 text-white font-black text-sm"
              >
                إنشاء حساب
              </Link>
            </div>
          ) : (
            <div className="pt-6 space-y-2">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-4 mb-2">
                لوحة التحكم
              </p>
              <Link
                to="/studio"
                className="flex items-center gap-4 p-4 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 text-sm font-black transition-all"
              >
                <LayoutDashboard size={20} /> استوديو المبدعين
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-4 p-4 rounded-2xl text-red-400 hover:bg-red-500/10 text-sm font-black transition-all w-full text-right"
              >
                <LogOut size={20} /> تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Search Overlay (CSS Transition) */}
      <div
        className={`fixed inset-0 bg-black/45 backdrop-blur-[30px] z-[200] transition-all duration-500 ${searchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="max-w-4xl mx-auto pt-28 px-6">
          <div className="flex items-center justify-between mb-16">
            <div className="flex flex-col text-right">
              <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">
                البحث الذكي
              </h2>
              <p className="text-white/40 text-xs md:text-sm font-medium mt-2">
                ابحث عن المقالات، الكتاب، أو المواضيع المفضلة لديك
              </p>
            </div>
            <button
              onClick={() => setSearchOpen(false)}
              aria-label="إغلاق البحث"
              className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all border border-white/5 shadow-lg active:scale-95"
            >
              <X size={32} />
            </button>
          </div>
          <form onSubmit={handleSearch} className="relative group">
            {/* Ambient Purple Glow */}
            <div className="absolute inset-0 bg-purple-600/15 rounded-[3rem] blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <Search
              className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-500 transition-colors z-10"
              size={32}
            />
            <input
              type="text"
              autoFocus
              placeholder="عن ماذا تبحث اليوم؟"
              className="relative w-full bg-white/5 border border-white/10 rounded-[3rem] py-5 md:py-7 pr-20 pl-8 text-xl md:text-2xl font-black text-white outline-none focus:border-purple-600/50 focus:bg-black/60 focus:ring-8 focus:ring-purple-600/10 transition-all shadow-2xl text-right z-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <div className="mt-14 flex flex-wrap gap-4 justify-end">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] w-full mb-2 text-right">
              عمليات بحث شائعة:
            </span>
            {[
              "البرمجة",
              "تطوير الذات",
              "الذكاء الاصطناعي",
              "ريادة الأعمال",
            ].map((t) => (
              <button
                key={t}
                onClick={() => {
                  navigate(`/?tag=${encodeURIComponent(t)}`);
                  closeAllMenus();
                }}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-white/40 hover:text-purple-400 hover:border-purple-500/50 hover:bg-purple-600/5 transition-all active:scale-95 shadow-md"
              >
                #{t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
