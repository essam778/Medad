import { useState } from "react";
import {
  Users,
  UserIcon,
  Search,
  Trash2,
  Crown,
  PenSquare,
  Loader2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  useAdminUsers,
  useUpdateUserRole,
  useDeleteUser,
} from "../../hooks/useAdmin";
import { useToast } from "../../components/shared/ToastProvider";
import { getErrorMessage } from "../../lib/utils";
import ConfirmModal from "../../components/shared/ConfirmModal";
import OptimizedImage from "../../components/shared/OptimizedImage";
import { useAuth } from "../../features/auth/context/AuthContext";

const ROLES = [
  {
    value: "admin",
    label: "مدير",
    icon: Crown,
    color: "text-purple-400",
    bg: "bg-purple-600/10",
    border: "border-purple-500/20",
  },
  {
    value: "author",
    label: "كاتب",
    icon: PenSquare,
    color: "text-blue-400",
    bg: "bg-blue-600/10",
    border: "border-blue-500/20",
  },
  {
    value: "reader",
    label: "قارئ",
    icon: UserIcon,
    color: "text-white/20",
    bg: "bg-white/5",
    border: "border-white/5",
  },
];

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    userId: null,
    userName: "",
  });

  const { data, isLoading } = useAdminUsers({
    page,
    search: searchTerm,
    role: roleFilter,
  });
  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();
  const toast = useToast();
  const { user: currentUser } = useAuth();

  const users = data?.data || [];
  const count = data?.count || 0;
  const totalPages = Math.ceil(count / 20);

  async function updateRole(userId, newRole) {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
      toast.success("تم تحديث رتبة العضو بنجاح");
    } catch (err) {
      toast.error(getErrorMessage(err, "فشل تحديث رتبة العضو"));
    }
  }

  async function handleDelete() {
    if (!deleteConfirm.userId) return;
    try {
      await deleteUserMutation.mutateAsync(deleteConfirm.userId);
      toast.success("تم حذف العضو من المنصة");
      setDeleteConfirm({ open: false, userId: null, userName: "" });
    } catch (err) {
      toast.error(getErrorMessage(err, "فشل حذف العضو"));
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 px-0" dir="rtl">
      <ConfirmModal
        open={deleteConfirm.open}
        title="حذف عضو"
        message={`هل أنت متأكد من حذف العضو "${deleteConfirm.userName}"؟ سيتم حذف جميع بياناته ومقالاته نهائياً.`}
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteConfirm({ open: false, userId: null, userName: "" })
        }
        confirmLabel={
          deleteUserMutation.isPending ? "جاري الحذف..." : "حذف نهائي"
        }
        cancelLabel="تراجع"
        variant="danger"
      />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-4 text-white uppercase italic">
            إدارة المجتمع
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
              <Users size={20} className="md:w-6 md:h-6" />
            </div>
          </h1>
          <p className="text-white/30 mt-2 font-black uppercase tracking-[0.3em] text-[8px]">
            تحكم في رتب الأعضاء وصلاحياتهم ({count})
          </p>
        </motion.div>

        <div className="relative w-full lg:w-[400px] group">
          <Search
            className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد..."
            className="w-full bg-[#0d0d0d]/95 md:bg-[#0d0d0d]/40 md:backdrop-blur-3xl border border-white/5 rounded-2xl py-4 pr-14 pl-6 outline-none focus:border-purple-600 shadow-xl transition-all font-black text-sm text-white"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      {/* Stats Summary Bar (نظام الأعداد) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 px-4 md:px-0">
        {[
          {
            label: "إجمالي الأعضاء",
            value: count,
            icon: Users,
            color: "text-white",
            bg: "bg-white/5",
          },
          {
            label: "فريق الإدارة",
            value: users.filter((u) => u.role === "admin").length,
            icon: Crown,
            color: "text-purple-400",
            bg: "bg-purple-600/10",
          },
          {
            label: "صناع المحتوى",
            value: users.filter((u) => u.role === "author").length,
            icon: PenSquare,
            color: "text-blue-400",
            bg: "bg-blue-600/10",
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0d0d0d]/95 md:bg-[#0d0d0d]/40 md:backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] flex items-center gap-6 shadow-2xl group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <stat.icon size={60} />
            </div>
            <div
              className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center border border-white/5 shadow-xl`}
            >
              <stat.icon size={24} />
            </div>
            <div className="text-right">
              <p className="text-2xl md:text-4xl font-black tabular-nums leading-none text-white italic">
                {stat.value.toLocaleString("ar-EG")}
              </p>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-2">
                {stat.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-10 bg-[#0d0d0d]/95 md:bg-[#0d0d0d]/40 md:backdrop-blur-3xl border border-white/5 p-6 rounded-2xl shadow-xl">
        <div className="p-3 bg-white/5 text-white/40 rounded-xl border border-white/5">
          <Filter size={18} />
        </div>
        <div className="flex flex-wrap gap-2">
          {[["", "الكل"], ...ROLES.map((r) => [r.value, r.label])].map(
            ([val, lbl]) => (
              <button
                key={val}
                onClick={() => {
                  setRoleFilter(val);
                  setPage(0);
                }}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all border ${
                  roleFilter === val
                    ? "bg-purple-600 text-white border-purple-500 shadow-lg"
                    : "text-white/30 hover:text-white border-white/5"
                }`}
              >
                {lbl}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0d0d0d]/95 md:bg-[#0d0d0d]/40 md:backdrop-blur-3xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-40 flex flex-col items-center gap-6">
            <Loader2 className="animate-spin text-purple-600" size={48} />
            <p className="text-white/20 font-black text-xs uppercase tracking-widest italic">
              جاري جلب قائمة الأعضاء...
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-40">
            <Sparkles size={64} className="mx-auto mb-8 text-white/5" />
            <p className="text-white/10 font-black italic text-2xl uppercase tracking-widest">
              لا يوجد أعضاء يطابقون بحثك
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5 text-white/20">
                    <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em]">
                      العضو
                    </th>
                    <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] hidden lg:table-cell text-center">
                      الانضمام
                    </th>
                    <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-center">
                      الرتبة
                    </th>
                    <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-left">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y border-white/5">
                  {users.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="group hover:bg-white/[0.02] transition-all"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-white/5 shadow-xl overflow-hidden shrink-0">
                            {u.avatar_url ? (
                              <OptimizedImage
                                src={u.avatar_url}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/10 font-black text-lg italic">
                                {u.full_name?.[0]}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-xs md:text-sm text-white mb-1 truncate italic">
                              {u.full_name}
                            </p>
                            <p className="text-[8px] text-white/20 font-black uppercase">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-center text-[10px] font-black text-white/40">
                        {new Date(u.created_at).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {ROLES.filter((r) => r.value === u.role).map((r) => (
                          <div
                            key={r.value}
                            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[8px] font-black uppercase border ${r.bg} ${r.color} ${r.border}`}
                          >
                            <r.icon size={12} /> {r.label}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
                            {ROLES.map(
                              (role) => (
                                <button
                                  key={role.value}
                                  onClick={() => updateRole(u.id, role.value)}
                                  disabled={
                                    updateRoleMutation.isPending ||
                                    u.role === role.value ||
                                    u.id === currentUser?.id
                                  }
                                  className={`p-2 rounded-lg transition-all ${
                                    u.role === role.value
                                      ? "bg-purple-600 text-white"
                                      : "text-white/20 hover:text-white hover:bg-white/5"
                                  } disabled:opacity-50`}
                                >
                                  <role.icon size={14} />
                                </button>
                              ),
                            )}
                          </div>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                open: true,
                                userId: u.id,
                                userName: u.full_name,
                              })
                            }
                            disabled={
                              deleteUserMutation.isPending ||
                              u.id === currentUser?.id
                            }
                            className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/10 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="py-10 border-t border-white/5 flex items-center justify-center gap-6">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-white disabled:opacity-10 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="text-xs font-black italic text-white/60 tabular-nums">
                  {page + 1} <span className="mx-2 opacity-20">/</span>{" "}
                  {totalPages}
                </div>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-white disabled:opacity-10 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
