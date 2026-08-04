import { useState, useEffect } from "react";
import { Bell, CheckCheck, Trash2, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@auth";
import { supabase } from "../../lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import {
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
} from "../../hooks/useNotifications";
import ConfirmModal from "./ConfirmModal";

import { useUIStore } from "../../stores/ui.store";
import { useNotificationStore } from "../../stores/notification.store";

export default function NotificationCenter({ className = "" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useNotifications();
  const queryClient = useQueryClient();
  const [clearing, setClearing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isOpen = useUIStore((s) => s.modals.notifications);
  const setOpen = (val) =>
    val
      ? useUIStore.getState().openModal("notifications")
      : useUIStore.getState().closeModal("notifications");

  const markAllAsReadOptimistic = useNotificationStore((s) => s.markAllAsRead);

  const handleClearAll = async () => {
    if (!user?.id || clearing) return;

    setClearing(true);
    try {
      await supabase.from("notifications").delete().eq("recipient_id", user.id);

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setDeleteConfirm(false);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    } finally {
      setClearing(false);
    }
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`} dir="rtl">
      <ConfirmModal
        open={deleteConfirm}
        title="تصفير الإشعارات"
        message="هل أنت متأكد من حذف كافة الإشعارات؟ لا يمكن التراجع عن هذه الخطوة."
        onConfirm={handleClearAll}
        onCancel={() => setDeleteConfirm(false)}
        confirmLabel="نعم، احذف الكل"
        cancelLabel="تراجع"
        variant="danger"
      />

      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            markAllAsReadOptimistic();
            markAllNotificationsRead(user.id);
          }
          setOpen(!isOpen);
        }}
        aria-label="التنبيهات"
        className={`p-2.5 rounded-xl transition-all relative group ${
          isOpen
            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
            : "text-white/40 hover:text-white hover:bg-white/5"
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -left-1 w-5 h-5 bg-purple-600 text-white text-[10px] font-black rounded-lg flex items-center justify-center shadow-lg border-2 border-[#050505]">
            {unreadCount > 9 ? "+9" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[120]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="fixed md:absolute left-4 right-4 md:left-0 md:right-auto top-20 md:top-full mt-4 md:w-[380px] bg-[#0d0d0d]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.6)] z-[130] overflow-hidden text-right"
            >
              {/* Header */}
              <div className="px-6 py-5 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  إشعاراتك{" "}
                  <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-[10px] rounded-lg border border-purple-500/20">
                    {notifications.length}
                  </span>
                </h4>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      markAllAsReadOptimistic();
                      markAllNotificationsRead(user.id);
                    }}
                    className="text-[10px] font-black text-white/30 hover:text-purple-400 transition-colors"
                  >
                    تحديد الكل كمقروء
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    disabled={clearing}
                    className="text-[10px] font-black text-white/30 hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    {clearing ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Trash2 size={10} />
                    )}
                    حذف الكل
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="max-h-[450px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                      <Bell size={24} className="text-white/10" />
                    </div>
                    <p className="text-sm font-black text-white/20 italic tracking-widest uppercase">
                      لا توجد إشعارات جديدة
                    </p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => {
                        if (!n.read) markNotificationRead(n.id);
                        let metadata = n.metadata;
                        if (typeof metadata === "string") {
                          try {
                            metadata = JSON.parse(metadata);
                          } catch (e) {
                            console.warn("Failed to parse metadata", e);
                          }
                        }
                        if (n.type === "new_follow" && metadata?.author_id) {
                          navigate(`/author/${metadata.author_id}`);
                        } else if (metadata?.slug) {
                          const hash = metadata.comment_id
                            ? `#comment-${metadata.comment_id}`
                            : "";
                          navigate(`/post/${metadata.slug}${hash}`);

                          if (metadata.comment_id) {
                            setTimeout(() => {
                              document
                                .getElementById(
                                  `comment-${metadata.comment_id}`,
                                )
                                ?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                            }, 1000); // Wait for comments to load
                          }
                        }
                        setOpen(false);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                        n.read
                          ? "bg-transparent border-white/5 opacity-60"
                          : "bg-purple-600/5 border-purple-500/20 shadow-lg"
                      }`}
                    >
                      <div className="flex gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            n.read
                              ? "bg-white/5 border-white/10 text-white/20"
                              : "bg-purple-600/20 border-purple-500/20 text-purple-400"
                          }`}
                        >
                          <Info size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-black mb-1 italic ${n.read ? "text-white/40" : "text-white"}`}
                          >
                            {n.title}
                          </p>
                          <p className="text-[10px] text-white/30 line-clamp-2 leading-relaxed italic">
                            {n.message}
                          </p>
                          <p className="text-[8px] font-black text-white/10 mt-2 uppercase tracking-widest">
                            {new Date(n.created_at).toLocaleDateString("ar-EG")}
                          </p>
                        </div>
                      </div>
                      {!n.read && (
                        <div className="absolute top-4 left-4 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
