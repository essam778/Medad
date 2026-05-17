import { useAuth } from '@auth'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, FileText, Tags, Users, Settings, 
  LogOut, Menu, X, Ticket, Home, Tv, UserCheck, Bell, User, Bookmark, Megaphone, FolderOpen, ListVideo, MessageCircle,
  ChevronLeft, Sparkles, Globe
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NotificationCenter from '../../components/shared/NotificationCenter'
import OptimizedImage from '../../components/shared/OptimizedImage'

export default function AdminLayout() {
  const { profile, signOut, isAdmin, isAuthor } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // FORCE CLOSE on any location change - Absolute guarantee
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname, location.search, location.key])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [mobileMenuOpen])

  const isReader = !isAdmin && !isAuthor

  useEffect(() => {
    if (isReader && location.pathname === '/studio') {
      navigate('/studio/profile', { replace: true })
    }
  }, [isReader, location.pathname, navigate])

  const navItems = useMemo(() => [
    { to: '/', label: 'العودة للموقع', icon: Globe, variant: 'special' },
    { type: 'divider', label: 'الرئيسية' },
    (isAdmin || isAuthor) && { to: '/studio', label: 'لوحة الإحصائيات', icon: LayoutDashboard, end: true },
    (isAdmin || isAuthor) && { to: '/studio/posts', label: 'مقالاتي', icon: FileText },
    { to: '/studio/saved', label: 'المحفوظات', icon: Bookmark },
    isAdmin && { type: 'divider', label: 'الإدارة العامة' },
    isAdmin && { to: '/studio/all-posts', label: 'مقالات المنصة', icon: FolderOpen },
    isAdmin && { to: '/studio/tags', label: 'التصنيفات', icon: Tags },
    isAdmin && { to: '/studio/users', label: 'الأعضاء', icon: Users },
    isAdmin && { to: '/studio/requests', label: 'طلبات الانضمام', icon: UserCheck },
    isAdmin && { to: '/studio/invite-codes', label: 'أكواد الدعوة', icon: Ticket },
    (isAdmin || isAuthor) && { type: 'divider', label: 'القناة' },
    (isAdmin || isAuthor) && { to: '/studio/site-settings', label: 'إدارة القناة', icon: Tv },
    (isAdmin || isAuthor) && { to: '/studio/groups', label: 'سلاسل المحتوى', icon: ListVideo },
    isAdmin && { to: '/studio/channels', label: 'إدارة القنوات', icon: Tv },
    isAdmin && { to: '/studio/comments', label: 'التعليقات', icon: MessageCircle },
    isAdmin && { to: '/studio/notifications', label: 'إرسال إشعارات', icon: Megaphone },
    isAdmin && { to: '/studio/settings', label: 'الإعدادات العامة', icon: Settings },
    { type: 'divider', label: 'الحساب' },
    { to: '/studio/profile', label: 'إعدادات الحساب', icon: User },
  ].filter(Boolean), [isAdmin, isAuthor])

  const handleSignOut = async () => {
    await signOut()
    setMobileMenuOpen(false)
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-arabic relative overflow-hidden selection:bg-purple-600/30" dir="rtl">
      {/* Background Glows (Persistent) */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Sidebar - Desktop (Fixed & Full Height) */}
      <aside className="hidden lg:flex w-72 flex-col bg-[#050505] border-l border-white/5 fixed inset-y-0 right-0 h-full z-50 overflow-hidden group shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-10 shrink-0">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
               <span className="text-white font-black text-2xl italic mt-1">م</span>
            </div>
            <div>
              <p className="text-xl font-black tracking-tighter italic">مداد</p>
              <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-black">Creator Studio</p>
            </div>
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {navItems.map((item, idx) => (
              item.type === 'divider' ? (
                <p key={`div-${idx}`} className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-8 mb-4 px-4">{item.label}</p>
              ) : (
                <NavLink
                  key={item.to} to={item.to} end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-black transition-all relative overflow-hidden group/item ${
                      isActive 
                        ? 'text-white bg-white/5 border border-white/10 shadow-xl' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    } ${item.variant === 'special' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 mb-6' : ''}`
                  }
                >
                  <item.icon size={16} className={item.variant === 'special' ? 'text-purple-400' : ''} />
                  <span className="relative z-10">{item.label}</span>
                </NavLink>
              )
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5 bg-[#050505] shrink-0">
             <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-600 shrink-0 shadow-lg border border-purple-500/30">
                   {profile?.avatar_url ? <OptimizedImage src={profile.avatar_url} /> : <div className="w-full h-full flex items-center justify-center font-black text-xs italic">{profile?.full_name?.[0]}</div>}
                </div>
                <div className="min-w-0 flex-1 text-right">
                   <p className="text-xs font-black truncate text-white">{profile?.full_name}</p>
                   <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{profile?.role}</p>
                </div>
                <button onClick={handleSignOut} className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                  <LogOut size={14} />
                </button>
             </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative z-10 lg:pr-72">
        <header className="hidden lg:flex h-24 items-center justify-between px-12 gap-6 bg-transparent">
          <div className="flex items-center gap-3 text-white/20 text-[10px] font-black uppercase tracking-widest">
             <Sparkles size={16} className="text-purple-500" /> {profile?.full_name} في استوديو مداد
          </div>
          <div className="flex items-center gap-6 relative">
             <NotificationCenter />
             <button 
               onClick={() => setUserMenuOpen(!userMenuOpen)}
               className="flex items-center gap-4 p-2 pl-6 bg-white/5 border border-white/10 rounded-full hover:border-purple-500/50 backdrop-blur-3xl shadow-xl transition-all"
             >
                <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-black overflow-hidden shadow-lg border border-purple-500/30">
                   {profile?.avatar_url ? <OptimizedImage src={profile.avatar_url} className="w-full h-full object-cover" /> : profile?.full_name?.[0]}
                </div>
                <div className="text-right">
                   <p className="text-[11px] font-black leading-none text-white">{profile?.full_name}</p>
                   <p className="flex items-center gap-1.5 text-[8px] text-green-400 font-bold uppercase tracking-widest mt-1.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> متصل الآن
                   </p>
                </div>
             </button>
             
             {/* User Menu Dropdown */}
             <AnimatePresence>
               {userMenuOpen && (
                 <>
                   <div className="fixed inset-0 z-[65]" onClick={() => setUserMenuOpen(false)} />
                   <motion.div 
                     initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.95 }}
                     className="absolute left-0 top-16 w-72 bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-4 shadow-[0_30px_70px_rgba(0,0,0,0.7)] z-[70]"
                   >
                     <div className="p-5 mb-4 bg-white/5 rounded-[2rem] flex items-center gap-4 border border-white/5 text-right">
                       <div className="w-10 h-10 rounded-full bg-purple-600/10 border border-purple-500/20 overflow-hidden flex items-center justify-center font-black text-purple-400 italic shrink-0 shadow-lg transition-all">
                         {profile?.avatar_url ? (
                           <OptimizedImage src={profile.avatar_url} className="w-full h-full object-cover" />
                         ) : (
                           profile?.full_name?.[0] || 'U'
                         )}
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-white font-black text-sm truncate">{profile?.full_name}</p>
                          <p className="text-white/40 text-[10px] uppercase tracking-widest">{profile?.role || 'مبدع'}</p>
                       </div>
                     </div>
                     <div className="space-y-1 p-1 text-right">
                       <NavLink to="/studio/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black text-white/60 hover:text-white hover:bg-white/5 transition-all"><User size={18} /> الملف الشخصي</NavLink>
                       <div className="h-px bg-white/5 my-3 mx-2" />
                       <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black text-red-400 hover:bg-red-400/10 transition-all text-right"><LogOut size={18} /> تسجيل الخروج</button>
                     </div>
                   </motion.div>
                 </>
               )}
             </AnimatePresence>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden h-20 bg-[#0d0d0d]/95 border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-[60]">
          <button onClick={() => setMobileMenuOpen(true)} className="w-12 h-12 flex items-center justify-center bg-white/5 text-white rounded-2xl border border-white/10"><Menu size={24} /></button>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-white font-black italic">م</div>
             <span className="font-black text-xl tracking-tighter italic text-white">مداد</span>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
            {profile?.avatar_url ? <OptimizedImage src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-purple-600 text-white flex items-center justify-center font-black text-sm italic">{profile?.full_name?.[0]}</div>}
          </div>
        </header>

        <main className="p-4 md:p-8 lg:p-12 lg:pt-4 w-full max-w-[1600px] mx-auto min-h-screen">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#0d0d0d]/95 md:bg-[#0d0d0d]/40 md:backdrop-blur-3xl border border-white/10 rounded-[3rem] p-6 md:p-12 min-h-[calc(100vh-160px)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
             <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
             <div className="relative z-10">
                <Outlet />
             </div>
          </motion.div>
        </main>
      </div>

      {/* Mobile Menu Overlay & Aside - Standard CSS Transition for reliability */}
      <div 
        className={`fixed inset-0 bg-black/90 z-[100] transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileMenuOpen(false)}
      />
      <aside 
        className={`fixed inset-y-0 right-0 w-[85%] max-w-sm bg-[#0a0a0a] z-[110] p-8 flex flex-col border-l border-white/5 shadow-2xl transition-transform duration-300 transform will-change-transform ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl italic border border-purple-500/30 shadow-lg shadow-purple-600/20">م</div>
            <span className="text-2xl font-black tracking-tighter italic text-white">مداد</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-white/60 hover:text-white transition-all border border-white/5"><X size={24} /></button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pb-6 pr-1 custom-scrollbar text-right" onClick={() => setMobileMenuOpen(false)}>
          {navItems.map((item, idx) => (
            item.type === 'divider' ? (
              <p key={`m-div-${idx}`} className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-8 mb-4 px-4">{item.label}</p>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => `flex items-center gap-5 px-6 py-4 rounded-2xl text-sm font-black transition-all ${isActive ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'text-white/40 hover:bg-white/5'} ${item.variant === 'special' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 mb-6' : ''}`}
              >
                <item.icon size={20} /> {item.label}
              </NavLink>
            )
          ))}
        </nav>

        <div className="pt-8 border-t border-white/5 mt-auto">
          <button onClick={handleSignOut} className="flex items-center justify-center gap-4 w-full py-5 bg-red-500/10 text-red-400 rounded-[2rem] font-black text-sm border border-red-500/10 hover:bg-red-500 hover:text-white transition-all shadow-xl">
            <LogOut size={22} /> تسجيل الخروج
          </button>
        </div>
      </aside>
    </div>
  )
}
