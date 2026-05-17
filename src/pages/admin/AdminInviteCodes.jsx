import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Ticket, Plus, Trash2, Copy, Check, Loader2, AlertCircle, Sparkles, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../../components/shared/ToastProvider'
import ConfirmModal from '../../components/shared/ConfirmModal'

export default function AdminInviteCodes() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setAdding] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, codeId: null })
  const toast = useToast()

  useEffect(() => {
    fetchCodes()
  }, [])

  async function fetchCodes() {
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setCodes(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function generateCode() {
    setAdding(true)
    const newCode = `BLOG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .insert([{ code: newCode, role: 'author' }])
        .select()
        .single()

      if (error) throw error
      setCodes([data, ...codes])
      toast.success('تم توليد كود دعوة جديد بنجاح')
    } catch (err) {
      toast.error('فشل في إنشاء الكود')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm.codeId) return
    try {
      await supabase.from('invite_codes').delete().eq('id', deleteConfirm.codeId)
      setCodes(codes.filter(c => c.id !== deleteConfirm.codeId))
      toast.success('تم حذف كود الدعوة')
    } catch (err) {
      toast.error('خطأ في الحذف')
    } finally {
      setDeleteConfirm({ open: false, codeId: null })
    }
  }

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('تم نسخ الكود للحافظة')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-purple-600" size={64} /></div>

  return (
    <div className="max-w-6xl mx-auto pb-20 px-0" dir="rtl">
      <ConfirmModal 
        open={deleteConfirm.open}
        title="إبطال الكود"
        message="هل أنت متأكد من رغبتك في حذف كود الدعوة هذا؟ لن يتمكن أي مبدع جديد من استخدامه للانضمام."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, codeId: null })}
        confirmLabel="حذف الآن"
        cancelLabel="تراجع"
        variant="danger"
      />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl md:text-6xl font-black tracking-tight flex items-center gap-5 text-white">
             أكواد الدعوة 
             <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
               <Ticket size={24} className="md:w-8 md:h-8" />
             </div>
          </h1>
          <p className="text-white/30 mt-4 font-black uppercase tracking-[0.3em] text-[10px]">شارك هذه الأكواد الحصرية مع المبدعين للانضمام للمنصة</p>
        </motion.div>
        
        <button
          onClick={generateCode}
          disabled={generating}
          className="w-full lg:w-auto bg-white text-black px-12 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-4 active:scale-95 border border-white/20"
        >
          {generating ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
          <span>توليد كود دعوة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <AnimatePresence>
          {codes.map((code, i) => (
            <motion.div
              key={code.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              className={`group relative p-8 md:p-10 rounded-[3rem] border backdrop-blur-3xl transition-all overflow-hidden shadow-2xl ${
                code.is_used 
                ? 'bg-white/[0.02] border-white/5 opacity-40' 
                : 'bg-[#0d0d0d]/40 border-white/10 hover:border-purple-500/30'
              }`}
            >
              {!code.is_used && (
                <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-purple-600/5 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/10 transition-all" />
              )}
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${code.is_used ? 'bg-white/5 border-white/5 text-white/10' : 'bg-purple-600/10 border-purple-500/20 text-purple-400'}`}>
                  <Zap size={24} className={!code.is_used ? 'animate-pulse' : ''} />
                </div>
                {!code.is_used && (
                  <button 
                    onClick={() => copyToClipboard(code.code)}
                    className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white hover:bg-purple-600/20 transition-all"
                  >
                    {copiedCode === code.code ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                  </button>
                )}
              </div>
              
              <p className="text-2xl md:text-3xl font-black font-mono tracking-[0.2em] text-white mb-6 relative z-10 italic">
                {code.code}
              </p>
              
              <div className="flex items-center justify-between relative z-10 pt-6 border-t border-white/5">
                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${code.is_used ? 'bg-white/5 text-white/20' : 'bg-purple-600/20 text-purple-400 border border-purple-500/20'}`}>
                  {code.is_used ? 'تم الاستخدام' : 'كود متاح'}
                </span>
                <button 
                  onClick={() => setDeleteConfirm({ open: true, codeId: code.id })} 
                  className="w-10 h-10 flex items-center justify-center text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {codes.length === 0 && (
        <div className="text-center py-40 bg-[#0d0d0d]/40 backdrop-blur-3xl border border-dashed border-white/10 rounded-[4rem] px-10 shadow-2xl">
          <Ticket size={64} className="mx-auto mb-10 text-white/5" />
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4 italic">لا توجد أكواد حالياً</h2>
          <p className="text-white/20 font-bold max-w-sm mx-auto text-sm md:text-lg">ابدأ بتوليد أكواد دعوة حصرية لدعوة المبدعين المفضلين لديك للمنصة.</p>
        </div>
      )}
    </div>
  )
}
