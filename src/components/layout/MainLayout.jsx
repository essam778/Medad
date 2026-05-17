import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#050505] transition-colors duration-300 overflow-clip">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
