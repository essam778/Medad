import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export default function NoticeModal({
  open,
  title = 'تنبيه',
  message = '',
  variant = 'info',
  onClose,
  onAction,
}) {
  const isSuccess = variant === 'success'
  const isWarning = variant === 'warning'

  const handleAction = () => {
    if (onAction) onAction()
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative z-10 w-full max-w-sm bg-card rounded-[2.5rem] p-8 shadow-2xl border border-border"
          >
            <div className="flex flex-col items-center text-center gap-6">
              <div className={`p-4 rounded-2xl ${
                isSuccess ? 'bg-green-500/10 text-green-500' : 
                isWarning ? 'bg-red-500/10 text-red-500' : 
                'bg-gold/10 text-gold'
              }`}>
                {isSuccess ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
              </div>
              
              <div>
                <h3 className="text-xl font-black mb-3 text-primary">{title}</h3>
                <p className="text-sm text-secondary font-bold leading-relaxed">{message}</p>
              </div>

              <div className="flex flex-col w-full gap-3">
                {onAction ? (
                  <>
                    <button
                      onClick={handleAction}
                      className="w-full bg-ink text-paper rounded-2xl py-4 font-black text-sm hover:bg-ink-soft transition-all shadow-lg"
                    >
                      تأكيد العملية
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full bg-subtle text-secondary rounded-2xl py-4 font-black text-sm hover:text-primary transition-all"
                    >
                      تراجع
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="w-full bg-ink text-paper rounded-2xl py-4 font-black text-sm hover:bg-ink-soft transition-all shadow-lg"
                  >
                    فهمت
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
