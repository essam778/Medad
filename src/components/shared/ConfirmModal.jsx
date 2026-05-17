import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, Check, HelpCircle } from 'lucide-react'

export default function ConfirmModal({ 
  open, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmLabel = 'تأكيد', 
  cancelLabel = 'إلغاء',
  variant = 'danger' // danger, warning, info, success
}) {
  if (!open) return null

  const variants = {
    danger: {
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      btn: 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
    },
    warning: {
      icon: HelpCircle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      btn: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20'
    },
    success: {
      icon: Check,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      btn: 'bg-green-500 hover:bg-green-600 shadow-green-500/20'
    },
    info: {
      icon: AlertCircle,
      color: 'text-gold',
      bg: 'bg-gold/10',
      btn: 'bg-ink hover:bg-ink-soft shadow-ink/20'
    }
  }

  const active = variants[variant] || variants.info
  const Icon = active.icon

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          <div className="p-8 text-center">
            <div className={`w-20 h-20 ${active.bg} ${active.color} rounded-3xl flex items-center justify-center mx-auto mb-6`}>
              <Icon size={40} />
            </div>
            
            <h3 className="text-xl md:text-2xl font-black text-primary mb-3 italic">{title}</h3>
            <p className="text-secondary font-bold leading-relaxed mb-8">{message}</p>
            
            <div className="flex flex-col sm:flex-row-reverse gap-3">
              <button 
                onClick={onConfirm}
                className={`flex-1 py-4 rounded-2xl text-white font-black text-sm transition-all shadow-lg active:scale-95 ${active.btn}`}
              >
                {confirmLabel}
              </button>
              <button 
                onClick={onCancel}
                className="flex-1 py-4 rounded-2xl bg-subtle text-secondary font-black text-sm hover:bg-border transition-all active:scale-95"
              >
                {cancelLabel}
              </button>
            </div>
          </div>
          
          <button 
            onClick={onCancel}
            className="absolute top-6 left-6 p-2 text-muted hover:text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
