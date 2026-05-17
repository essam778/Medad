import { createContext, useContext, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

function ToastItem({ toast, onClose }) {
  const icon =
    toast.type === 'success' ? <CheckCircle2 size={18} /> :
    toast.type === 'error' ? <AlertCircle size={18} /> :
    <Info size={18} />

  const colors =
    toast.type === 'success'
      ? 'bg-green-50 text-green-700 border-green-100'
      : toast.type === 'error'
        ? 'bg-red-50 text-red-700 border-red-100'
        : 'bg-blue-50 text-blue-700 border-blue-100'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      className={`pointer-events-auto w-full max-w-sm rounded-2xl border px-4 py-3 shadow-xl ${colors}`}
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          {toast.title && <p className="text-sm font-black">{toast.title}</p>}
          <p className="text-xs font-bold leading-relaxed">{toast.message}</p>
        </div>
        <button type="button" onClick={() => onClose(toast.id)} className="p-1 rounded-lg hover:bg-black/5">
          <X size={14} />
        </button>
      </div>
    </motion.div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  function removeToast(id) {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }

  function pushToast({ title, message, type = 'info', duration = 3000 }) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const toast = { id, title, message, type }
    setToasts((prev) => [toast, ...prev].slice(0, 5))
    if (duration > 0) {
      window.setTimeout(() => removeToast(id), duration)
    }
  }

  const api = useMemo(
    () => ({
      toast: pushToast,
      success: (message, title = 'تم') => pushToast({ title, message, type: 'success' }),
      error: (message, title = 'خطأ') => pushToast({ title, message, type: 'error' }),
      info: (message, title = 'تنبيه') => pushToast({ title, message, type: 'info' }),
    }),
    []
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 left-4 z-[140] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
