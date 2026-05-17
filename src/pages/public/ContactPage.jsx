import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MapPin, Send, MessageSquare, Loader2, Sparkles, Phone, Globe } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { useSettings } from '../../hooks/useSettings'

export default function ContactPage() {
  const { data: settings, isLoading } = useSettings()
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      setFormData({ name: '', email: '', message: '' })
    }, 1500)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={64} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-arabic py-20 px-4" dir="rtl">
      <Helmet>
        <title>تواصل معنا | مداد</title>
      </Helmet>
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black italic mb-6 relative z-10 drop-shadow-2xl"
          >
            تواصل <span className="text-purple-400">معنا</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-white/60 font-bold text-lg md:text-xl max-w-2xl mx-auto relative z-10"
          >
            نحن هنا للاستماع إليك، سواء كان لديك استفسار، اقتراح، أو ترغب في الانضمام لفريق المبدعين في مداد.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* معلومات التواصل */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-[#0d0d0d]/50 backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] shadow-2xl flex items-center gap-6 group hover:border-purple-500/30 transition-all">
               <div className="w-16 h-16 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform border border-purple-500/20 shadow-xl">
                 <Mail size={28} />
               </div>
               <div>
                 <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">البريد الإلكتروني</p>
                 <a href={`mailto:${settings?.support_email || 'hello@midad.com'}`} className="text-lg font-black text-white group-hover:text-purple-400 transition-colors">
                   {settings?.support_email || 'hello@midad.com'}
                 </a>
               </div>
            </div>

            <div className="bg-[#0d0d0d]/50 backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] shadow-2xl flex items-center gap-6 group hover:border-purple-500/30 transition-all">
               <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform border border-blue-500/20 shadow-xl">
                 <MessageSquare size={28} />
               </div>
               <div>
                 <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">الدعم الفني</p>
                 <p className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">
                   {settings?.support_email ? `دعم ${settings.site_name || 'مداد'}` : 'support@midad.com'}
                 </p>
               </div>
            </div>

            {settings?.contact_us ? (
              <div className="bg-[#0d0d0d]/50 backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] shadow-2xl flex items-start gap-6 group hover:border-purple-500/30 transition-all">
                 <div className="w-16 h-16 bg-green-600/10 rounded-2xl flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform border border-green-500/20 shadow-xl shrink-0">
                   <Globe size={28} />
                 </div>
                 <div>
                   <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-2">معلومات إضافية</p>
                   <p className="text-sm font-bold text-white/70 leading-relaxed whitespace-pre-wrap">
                     {settings.contact_us}
                   </p>
                 </div>
              </div>
            ) : (
              <div className="bg-[#0d0d0d]/50 backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] shadow-2xl flex items-center gap-6 group hover:border-purple-500/30 transition-all">
                 <div className="w-16 h-16 bg-green-600/10 rounded-2xl flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform border border-green-500/20 shadow-xl">
                   <MapPin size={28} />
                 </div>
                 <div>
                   <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">المقر الرئيسي</p>
                   <p className="text-lg font-black text-white group-hover:text-green-400 transition-colors">القاهرة، مصر</p>
                 </div>
              </div>
            )}
          </motion.div>

          {/* نموذج التواصل */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-600/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[80px]" />
            
            {submitted ? (
              <div className="text-center py-20 relative z-10">
                <div className="w-24 h-24 bg-green-500/10 text-green-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-green-500/20 shadow-2xl">
                  <Send size={48} />
                </div>
                <h2 className="text-3xl font-black italic mb-4">تم إرسال رسالتك بنجاح!</h2>
                <p className="text-white/60 font-bold text-lg">شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن.</p>
                <button onClick={() => setSubmitted(false)} className="mt-8 bg-white/5 hover:bg-white/10 px-8 py-3 rounded-full font-black text-sm transition-all border border-white/10">إرسال رسالة أخرى</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest pl-4">الاسم الكامل</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-[#050505] border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all shadow-inner"
                      placeholder="أدخل اسمك هنا"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest pl-4">البريد الإلكتروني</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-[#050505] border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all shadow-inner text-left"
                      placeholder="email@example.com"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest pl-4">رسالتك</label>
                  <textarea 
                    required
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-[#050505] border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all shadow-inner min-h-[200px] resize-y"
                    placeholder="كيف يمكننا مساعدتك؟"
                  />
                </div>
                <div className="pt-4">
                  <button 
                    disabled={submitting}
                    className="w-full md:w-auto bg-purple-600 text-white px-12 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/20 active:scale-95"
                  >
                    {submitting ? 'جاري الإرسال...' : <><Send size={20} /> إرسال الرسالة</>}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
