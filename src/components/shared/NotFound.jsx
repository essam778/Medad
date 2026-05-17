import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../layout/Header'
import Footer from '../layout/Footer'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <h1 className="text-9xl font-bold text-gray-100 mb-4 select-none">404</h1>
          <h2 className="text-2xl font-bold mb-3">عذراً، هذه الصفحة غير موجودة</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            ربما تم حذف المقال الذي تبحث عنه أو أن الرابط غير صحيح. يمكنك العودة للصفحة الرئيسية واستكشاف مقالات أخرى.
          </p>
          <Link 
            to="/" 
            className="inline-block bg-black text-white px-8 py-3 rounded-2xl font-semibold hover:bg-gray-800 transition-all hover:scale-105"
          >
            العودة للرئيسية
          </Link>
        </motion.div>
      </main>
      <Footer />
    </>
  )
}
