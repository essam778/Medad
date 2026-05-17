import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, HelpCircle, Mail, ArrowRight, MessageSquare, Sparkles } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { useSettings } from '../../hooks/useSettings'
import { Link } from 'react-router-dom'

export default function FAQPage() {
  const { data: settings, isLoading } = useSettings()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeId, setActiveId] = useState(null)

  // Fallback default FAQs if not set in DB
  const defaultFaqs = [
    {
      question: "ما هي منصة مداد؟",
      answer: "مداد هي منصة تدوين عربية حديثة تهدف إلى تمكين الكُتّاب والمبدعين العرب من نشر أفكارهم وقصصهم في بيئة تصميمية راقية وممتازة تدعم اللغة العربية بشكل كامل وتوفر أدوات متقدمة للكتابة وتتبع الإحصائيات.",
      category: "عام"
    },
    {
      question: "كيف يمكنني البدء في الكتابة على مداد؟",
      answer: "يمكنك إنشاء حساب مجاني كقارئ أولاً، ثم التقديم للحصول على صلاحيات كاتب من خلال لوحة التحكم (استوديو المبدعين). بعد الموافقة على طلبك، ستتمكن من استخدام المحرر المتقدم لنشر مقالاتك.",
      category: "الكتابة"
    },
    {
      question: "هل منصة مداد مجانية تماماً؟",
      answer: "نعم، القراءة والتسجيل ونشر المقالات على مداد مجانية تماماً. نسعى لتوفير أفضل تجربة تدوين بدون إعلانات مزعجة وبأعلى جودة ممكنة.",
      category: "عام"
    },
    {
      question: "ما هو استوديو المبدعين؟",
      answer: "استوديو المبدعين هو لوحة تحكم متكاملة مخصصة للكتاب لمراقبة إحصائيات مقالاتهم، وإدارة المسودات، وتحرير المقالات بمحرر غني بالتأثيرات، والتفاعل مع التعليقات الواردة.",
      category: "الكتابة"
    },
    {
      question: "كيف يمكنني التواصل مع فريق دعم مداد؟",
      answer: "يمكنك التواصل معنا مباشرة عبر صفحة 'تواصل معنا' أو إرسال بريد إلكتروني إلى بريد الدعم الفني الموضح أسفل الصفحة، وسيقوم فريقنا بالرد عليك في غضون 24 ساعة.",
      category: "الدعم"
    }
  ]

  // Parse FAQs from settings or use defaults
  const faqs = useMemo(() => {
    if (settings?.faq && Array.isArray(settings.faq) && settings.faq.length > 0) {
      return settings.faq
    }
    // If it's a string, try to parse it or format it
    if (settings?.faq && typeof settings.faq === 'string') {
      try {
        const parsed = JSON.parse(settings.faq)
        if (Array.isArray(parsed)) return parsed
      } catch (e) {
        // If string but not JSON, split by lines or return a single item
        return [{ question: "الأسئلة الشائعة", answer: settings.faq, category: "عام" }]
      }
    }
    return defaultFaqs
  }, [settings])

  // Filter FAQs based on search query
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs
    const query = searchQuery.toLowerCase().trim()
    return faqs.filter(
      faq => 
        faq.question?.toLowerCase().includes(query) || 
        faq.answer?.toLowerCase().includes(query) ||
        faq.category?.toLowerCase().includes(query)
    )
  }, [faqs, searchQuery])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin text-purple-600">
          <HelpCircle size={64} className="animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-arabic py-20 px-4 relative overflow-hidden" dir="rtl">
      <Helmet>
        <title>الأسئلة الشائعة | مداد</title>
      </Helmet>

      {/* Background blobs for premium depth */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-96 h-96 bg-purple-900/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 md:mb-24">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-purple-600/10 border border-purple-500/20 rounded-[2rem] text-purple-400 mb-8 shadow-2xl"
          >
            <HelpCircle size={40} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black italic mb-6 tracking-tight"
          >
            الأسئلة <span className="text-purple-400">الشائعة</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/40 text-sm md:text-lg font-bold max-w-xl mx-auto"
          >
            كل ما تود معرفته عن منصة مداد، الكتابة، العضويات، وطريقة عمل المنصة في مكان واحد.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative max-w-2xl mx-auto mb-16 md:mb-20 group"
        >
          {/* Ambient Purple Glow */}
          <div className="absolute inset-0 bg-purple-600/10 rounded-[2.5rem] blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors z-10" size={24} />
          <input 
            type="text"
            placeholder="ابحث عن سؤالك هنا..."
            className="w-full bg-[#0d0d0d]/60 border border-white/10 rounded-[2rem] py-5 pr-16 pl-6 text-lg font-bold text-white outline-none focus:border-purple-600/50 focus:bg-black/60 focus:ring-8 focus:ring-purple-600/5 transition-all shadow-2xl text-right z-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </motion.div>

        {/* FAQ Accordion List */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const isOpen = activeId === index
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-[#0d0d0d]/40 backdrop-blur-3xl border rounded-3xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-purple-500/30 shadow-[0_10px_30px_rgba(147,51,234,0.05)]' : 'border-white/5 shadow-md hover:border-white/10'}`}
                >
                  <button 
                    onClick={() => setActiveId(isOpen ? null : index)}
                    className="w-full py-6 md:py-8 px-8 flex items-center justify-between gap-6 text-right outline-none"
                  >
                    <div className="flex items-center gap-4">
                      {faq.category && (
                        <span className="hidden sm:inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-purple-400/80">
                          {faq.category}
                        </span>
                      )}
                      <span className="text-lg md:text-xl font-black text-white/90 leading-snug hover:text-white transition-colors">
                        {faq.question}
                      </span>
                    </div>
                    <div className={`w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 transition-all duration-300 ${isOpen ? 'rotate-180 bg-purple-600/10 text-purple-400 border border-purple-500/20' : ''}`}>
                      <ChevronDown size={20} />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="px-8 pb-8 pt-2 text-white/60 font-bold text-base md:text-lg leading-relaxed border-t border-white/5 whitespace-pre-wrap">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          ) : (
            <div className="text-center py-20 bg-[#0d0d0d]/20 border border-white/5 rounded-3xl">
              <p className="text-white/40 font-bold text-lg">لم نعثر على أي أسئلة تطابق بحثك.</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-black transition-all"
              >
                عرض جميع الأسئلة
              </button>
            </div>
          )}
        </motion.div>

        {/* CTA Contact Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-24 bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 md:p-14 text-center relative overflow-hidden group shadow-2xl"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
          
          <Sparkles className="mx-auto text-purple-400 mb-6 animate-pulse" size={36} />
          <h3 className="text-2xl md:text-3xl font-black italic text-white mb-4">ألم تجد إجابة لاستفسارك؟</h3>
          <p className="text-white/50 font-bold text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            لا تقلق، فريق دعم مداد جاهز دائماً لمساعدتك والإجابة على أي استفسارات تخص الكُتّاب أو القُرّاء.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/contact" 
              className="px-10 py-5 bg-purple-600 text-white rounded-2xl font-black text-base shadow-xl shadow-purple-600/10 hover:bg-purple-500 transition-all flex items-center justify-center gap-3 active:scale-95 border border-purple-500/20"
            >
              <Mail size={18} /> تواصل معنا الآن
            </Link>
            <a 
              href={`mailto:${settings?.support_email || 'hello@midad.com'}`} 
              className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-base text-white/80 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <MessageSquare size={18} /> الدعم الفني المباشر
            </a>
          </div>
        </motion.div>

        {/* Back Home Link */}
        <div className="mt-16 flex justify-center">
          <Link to="/" className="flex items-center gap-4 text-sm font-black text-white/30 hover:text-white transition-all group">
            <ArrowRight size={20} className="group-hover:-translate-x-3 transition-transform" /> العودة للرئيسية 
          </Link>
        </div>

      </div>
    </div>
  )
}
