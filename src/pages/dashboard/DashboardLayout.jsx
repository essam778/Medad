import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@auth'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { FileText, Bookmark, User } from 'lucide-react'

export default function DashboardLayout() {
  const { profile, isAuthor, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // إذا كان المستخدم قارئاً عادياً وحاول دخول صفحة "مقالاتي"، وجهه للمحفوظات
  useEffect(() => {
    if (location.pathname === '/dashboard' && !isAuthor && !isAdmin) {
      navigate('/dashboard/saved', { replace: true })
    }
  }, [location.pathname, isAuthor, isAdmin, navigate])

  const navItems = [
    // القارئ لا يرى "مقالاتي"
    (isAuthor || isAdmin) && { to: '/dashboard', label: 'مقالاتي', icon: FileText, end: true },
    { to: '/dashboard/saved', label: 'المحفوظات', icon: Bookmark },
    { to: '/dashboard/profile', label: 'الملف الشخصي', icon: User },
  ].filter(Boolean)

  const roleLabels = {
    admin: 'مدير',
    author: 'كاتب',
    reader: 'قارئ'
  }

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Header />
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* القائمة الجانبية */}
          <aside className="md:w-56 flex-shrink-0">
            <div className="flex flex-col items-center md:items-start gap-4 mb-8">
              <div className="w-16 h-16 rounded-[1.5rem] bg-ink text-paper flex items-center justify-center text-2xl font-black shadow-md border border-border">
                {profile?.full_name?.[0] || 'U'}
              </div>
              <div className="text-center md:text-right">
                <p className="text-lg font-black text-primary">{profile?.full_name}</p>
                <p className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">
                  {roleLabels[profile?.role] || 'عضو'}
                </p>
              </div>
            </div>

            <nav className="flex md:flex-col flex-row gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-ink text-paper shadow-lg'
                        : 'text-secondary hover:bg-subtle hover:text-primary'
                    }`
                  }>
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* المحتوى */}
          <main className="flex-1 min-w-0 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm shadow-ink/[0.02]">
            <Outlet />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  )
}
