import { useState, useEffect } from "react";
import { getErrorMessage } from "@/lib/utils";
import { ProfileService } from "@/features/auth/services/profile.service";
import { supabase } from "../../lib/supabase";
import {
  Check,
  X,
  Loader2,
  User,
  Mail,
  Clock,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Bell,
  ArrowLeft,
  Trash2,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../components/shared/ToastProvider";
import OptimizedImage from "../../components/shared/OptimizedImage";

export default function AdminCreatorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    try {
      const { data, error } = await ProfileService.getPendingCreatorRequests();
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(userId, requestId, action) {
    setProcessingId(requestId);
    try {
      if (action === "approve") {
        const { error } = await ProfileService.approveCreatorRequest(
          requestId,
          userId,
        );
        if (error) throw error;
        toast.success("تمت الموافقة على انضمام المبدع");
      } else {
        const { error } = await ProfileService.rejectCreatorRequest(
          requestId,
          userId,
        );
        if (error) throw error;
        toast.success("تم رفض الطلب");
      }
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      toast.error(getErrorMessage(err, "فشل الإجراء"));
    } finally {
      setProcessingId(null);
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-40">
        <Loader2 className="animate-spin text-purple-600" size={64} />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto pb-20 px-0" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-4 text-white uppercase italic">
            طلبات الانضمام
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
              <Sparkles size={20} className="md:w-6 md:h-6" />
            </div>
          </h1>
          <p className="text-white/30 mt-2 font-black uppercase tracking-[0.3em] text-[8px]">
            {requests.length} طلب بانتظار المراجعة
          </p>
        </motion.div>

        {requests.length > 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4 w-fit"
          >
            <div className="w-9 h-9 bg-purple-600/20 text-purple-400 rounded-xl flex items-center justify-center border border-purple-500/20 relative">
              <Bell size={18} className="animate-pulse" />
              <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-purple-600 rounded-full border border-[#050505]" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-black tabular-nums leading-none text-white">
                {requests.length}
              </p>
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mt-1.5">
                تنبيه نشط
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-40 bg-[#0d0d0d]/40 backdrop-blur-3xl border border-dashed border-white/10 rounded-[4rem] px-10 shadow-2xl">
          <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-white/5">
            <ShieldCheck size={48} className="text-white/10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4 italic">
            الرادار نظيف تماماً
          </h2>
          <p className="text-white/20 font-bold mt-3 max-w-sm mx-auto leading-relaxed text-sm md:text-lg">
            لقد قمت بمراجعة كافة طلبات الانضمام بنجاح. لا توجد مهام معلقة في
            الوقت الحالي.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {requests.map((req, i) => (
              <motion.div
                key={req.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl hover:border-purple-600/10 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-white/5 border border-white/5 shadow-xl overflow-hidden shrink-0">
                    {req.profiles?.avatar_url ? (
                      <OptimizedImage
                        src={req.profiles.avatar_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/10 font-black text-lg italic">
                        {req.profiles?.full_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-sm md:text-lg text-white truncate italic">
                      {req.profiles?.full_name}
                    </h3>
                    <p className="text-[8px] text-white/20 font-black uppercase tracking-widest mt-1">
                      {req.profiles?.email}
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 mb-6 text-xs text-white/60 italic border border-white/5 leading-relaxed relative z-10">
                  "{req.message || "طلب انضمام لصناعة المحتوى."}"
                </div>

                <div className="flex gap-3 relative z-10">
                  <button
                    disabled={processingId === req.id}
                    onClick={() => handleAction(req.user_id, req.id, "approve")}
                    className="flex-1 bg-white text-black py-3 rounded-xl font-black text-[10px] hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processingId === req.id ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Check size={14} />
                    )}
                    <span>قبول</span>
                  </button>
                  <button
                    disabled={processingId === req.id}
                    onClick={() => handleAction(req.user_id, req.id, "reject")}
                    className="flex-1 bg-red-500/10 text-red-500 py-3 rounded-xl font-black text-[10px] hover:bg-red-500 hover:text-white transition-all border border-red-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X size={14} />
                    <span>رفض</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
