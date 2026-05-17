import { useQuery } from '@tanstack/react-query'
import { PostService } from '@posts'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hash, Search, ArrowLeft, Sparkles, TrendingUp } from 'lucide-react'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Helmet } from 'react-helmet-async'

export default function CategoriesPage() {
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      return await PostService.getTags()
    }
  })

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner size="lg" /></div>

  return (
    <main className="min-h-screen bg-[#050505] text-white font-arabic pb-32 pt-16 md:pt-24" dir="rtl">
      <Helmet>
        <title>التصنيفات - مداد</title>
      </Helmet>

      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-20 text-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-purple-600/10 border border-purple-500/20 rounded-full mb-8"
          >
            <Sparkles size={16} className="text-purple-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300">استكشف العوالم</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-black italic tracking-tighter mb-6"
          >
            تصنيفات <span className="text-purple-500">مداد</span>
          </motion.h1>
          <p className="text-white/70 text-lg md:text-xl font-bold max-w-2xl mx-auto leading-relaxed">
            تصفح المحتوى حسب اهتماماتك. من البرمجة إلى الفن، كل فكرة لها موطن هنا.
          </p>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {tags.map((tag, idx) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link 
                to={`/?tag=${encodeURIComponent(tag.name)}`}
                className="group relative block p-10 bg-[#0d0d0d] border border-white/5 rounded-[3rem] hover:border-purple-500/40 transition-all duration-500 overflow-hidden shadow-2xl"
              >
                {/* Decoration */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all duration-700" />
                
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/60 group-hover:text-purple-400 group-hover:bg-purple-600/10 transition-all duration-500 border border-white/5 group-hover:border-purple-500/20">
                    <Hash size={32} />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-black mb-2 group-hover:text-white transition-colors">#{tag.name}</h2>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center justify-center gap-2">
                      <TrendingUp size={12} /> اكتشف المقالات
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 duration-500">
                   <ArrowLeft className="text-purple-500" size={24} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {tags.length === 0 && (
          <div className="py-40 text-center bg-white/5 rounded-[4rem] border border-dashed border-white/10">
            <Hash size={64} className="mx-auto text-white/10 mb-8" />
            <p className="text-white/60 font-black italic text-xl">لا توجد تصنيفات مسجلة حتى الآن.</p>
          </div>
        )}
      </div>
    </main>
  )
}
