import { useState } from 'react'
import { Send, Mail, Sparkles, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success

  const handleSubmit = (e) => {
    e.preventDefault()
    setStatus('loading')
    setTimeout(() => setStatus('success'), 1500)
  }

  return (
    <section className="container mx-auto px-4 md:px-8 py-24">
      <div className="relative group overflow-hidden rounded-[3rem] border border-white/10 bg-[#0d0d0d]/50 backdrop-blur-3xl p-12 md:p-20 text-center shadow-2xl">
        
        {/* Decorative Glows */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-600/30 transition-all duration-700" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center border border-purple-500/20 shadow-inner">
               <Mail size={32} className="text-purple-400" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tight">انضم لنخبة قراء مداد</h2>
            <p className="text-white/40 text-lg font-bold leading-relaxed">
              اشترك في نشرتنا الأسبوعية لتصلك مختارات من أجمل ما كُتب في المنصة مباشرة إلى بريدك.
            </p>

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 flex flex-col items-center gap-4 text-purple-400 font-black"
                >
                  <CheckCircle2 size={48} />
                  <p className="text-xl">تم الاشتراك بنجاح! أهلاً بك في النخبة.</p>
                </motion.div>
              ) : (
                <motion.form 
                  onSubmit={handleSubmit}
                  className="mt-8 w-full flex flex-col md:flex-row gap-4"
                >
                  <div className="relative flex-1">
                    <input 
                      type="email" 
                      required
                      aria-label="البريد الإلكتروني للاشتراك"
                      placeholder="بريدك الإلكتروني..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 outline-none focus:border-purple-500/50 text-white font-bold transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Sparkles className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10" size={20} />
                  </div>
                  <button 
                    disabled={status === 'loading'}
                    aria-label="اشترك الآن في النشرة البريدية"
                    className="bg-purple-600 hover:bg-purple-500 text-white px-12 py-5 rounded-2xl font-black text-lg shadow-xl shadow-purple-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {status === 'loading' ? 'جاري الاشتراك...' : (
                      <>
                        اشترك الآن <Send size={20} />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
