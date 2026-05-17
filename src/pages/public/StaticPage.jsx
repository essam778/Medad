import { useParams, Link } from 'react-router-dom'
import { useSettings } from '../../hooks/useSettings'
import { Loader2, ArrowRight, ShieldCheck, FileText, Info, Mail, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const PAGE_MAP = {
  about: { title: 'عن المنصة', icon: Info, field: 'about_us' },
  privacy: { title: 'سياسة الخصوصية', icon: ShieldCheck, field: 'privacy_policy' },
  terms: { title: 'شروط الاستخدام', icon: FileText, field: 'terms_of_service' },
  contact: { title: 'تواصل معنا', icon: Mail, field: 'contact_us' },
  faq: { title: 'الأسئلة الشائعة', icon: Info, field: 'faq' },
  cookies: { title: 'سياسة الكوكيز', icon: ShieldCheck, field: 'cookies_policy' },
}

export default function StaticPage({ slug: propSlug }) {
  const { slug: paramSlug } = useParams()
  const slug = propSlug || paramSlug
  const { data: settings, isLoading } = useSettings()
  
  const page = PAGE_MAP[slug] || PAGE_MAP.about

  if (isLoading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="animate-spin text-purple-600" size={64} />
    </div>
  )

  const content = settings?.[page.field] || 'سيتم إضافة المحتوى قريباً من قبل إدارة المنصة.'

  return (
    <div className="min-h-screen bg-[#050505] text-white font-arabic pt-24 md:pt-32 pb-24" dir="rtl">
      <div className="max-w-4xl mx-auto px-6 relative">
        
        {/* Background Decorative */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-purple-600/10 rounded-2xl md:rounded-3xl mb-6 text-purple-400 border border-purple-500/10">
             <page.icon size={32} />
          </div>
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tight mb-4">{page.title}</h1>
          <div className="w-12 h-1 bg-purple-600 mx-auto rounded-full" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div className="relative bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl md:rounded-3xl p-8 md:p-14 text-white/60 font-bold leading-relaxed whitespace-pre-wrap text-base md:text-lg shadow-xl">
             {content}
          </div>
        </motion.div>

        <div className="mt-24 flex justify-center">
          <Link to="/" className="flex items-center gap-4 text-sm font-black text-white/30 hover:text-white transition-all group">
            <ArrowRight size={20} className="group-hover:-translate-x-3 transition-transform" /> العودة للرئيسية 
          </Link>
        </div>
      </div>
    </div>
  )
}
