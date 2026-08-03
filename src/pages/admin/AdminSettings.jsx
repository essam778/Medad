import { getErrorMessage } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "../../hooks/useSettings";
import { uploadImage } from "../../lib/supabase";
import {
  Save,
  Upload,
  Globe,
  ShieldCheck,
  FileText,
  Mail,
  MessageSquare,
  Info,
  Loader2,
  Check,
  RefreshCw,
  Settings,
  Twitter,
  Facebook,
  Instagram,
  Github,
  Linkedin,
  Share2,
  Sparkles,
  Zap,
  HelpCircle,
  Trash2,
  Plus,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "../../components/shared/ToastProvider";
import OptimizedImage from "../../components/shared/OptimizedImage";

export default function AdminSettings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [form, setForm] = useState({
    site_name: "",
    site_description: "",
    logo_url: "",
    posts_per_page: 10,
    comments_enabled: true,
    social_links: {
      twitter: "",
      facebook: "",
      instagram: "",
      linkedin: "",
      github: "",
    },
    support_email: "",
    privacy_policy: "",
    terms_of_service: "",
    about_us: "",
    contact_us: "",
    contact_phone: "",
    contact_address: "",
    contact_hours: "",
    faq: [],
  });
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (settings) {
      // Helper to safely parse FAQ array
      let parsedFaq = [];
      if (Array.isArray(settings.faq)) {
        parsedFaq = settings.faq;
      } else if (settings.faq && typeof settings.faq === "string") {
        try {
          const parsed = JSON.parse(settings.faq);
          if (Array.isArray(parsed)) parsedFaq = parsed;
        } catch (e) {
          parsedFaq = [
            {
              question: "الأسئلة الشائعة",
              answer: settings.faq,
              category: "عام",
            },
          ];
        }
      }

      setForm({
        site_name: settings.site_name || "",
        site_description: settings.site_description || "",
        logo_url: settings.logo_url || "",
        posts_per_page: settings.posts_per_page || 10,
        comments_enabled: settings.comments_enabled ?? true,
        social_links: {
          twitter: settings.social_links?.twitter || "",
          facebook: settings.social_links?.facebook || "",
          instagram: settings.social_links?.instagram || "",
          linkedin: settings.social_links?.linkedin || "",
          github: settings.social_links?.github || "",
        },
        support_email: settings.support_email || "",
        privacy_policy: settings.privacy_policy || "",
        terms_of_service: settings.terms_of_service || "",
        about_us: settings.about_us || "",
        contact_us: settings.contact_us || "",
        contact_phone: settings.contact_phone || "",
        contact_address: settings.contact_address || "",
        contact_hours: settings.contact_hours || "",
        faq: parsedFaq,
      });
    }
  }, [settings]);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const setSocial = (key, val) =>
    setForm((p) => ({ ...p, social_links: { ...p.social_links, [key]: val } }));

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "logos");
      set("logo_url", url);
      toast.success("تم رفع الشعار بنجاح");
    } catch (err) {
      toast.error(getErrorMessage(err, "فشل الرفع"));
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync(form);
      setSaved(true);
      toast.success("تم تحديث إعدادات المنصة بنجاح");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (isLoading)
    return (
      <div className="flex justify-center py-40">
        <Loader2 className="animate-spin text-purple-600" size={64} />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-0" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 px-4 md:px-0">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl md:text-6xl font-black tracking-tight flex items-center gap-5 text-white italic">
            إعدادات المنصة
            <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
              <Settings size={24} className="md:w-8 md:h-8" />
            </div>
          </h1>
          <p className="text-white/30 mt-4 font-black uppercase tracking-[0.3em] text-[10px]">
            تخصيص الهوية والروابط الاجتماعية والقانونية والأسئلة الشائعة
          </p>
        </motion.div>
      </div>

      <form onSubmit={handleSave} className="space-y-12 px-4 md:px-0">
        {/* Basic Info Section */}
        <section className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 md:p-16 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

          <h2 className="text-xl md:text-3xl font-black mb-12 flex items-center gap-4 text-white italic">
            <Globe className="text-purple-500" size={24} />
            المعلومات الأساسية
          </h2>

          <div className="flex flex-col lg:flex-row items-center gap-12 mb-16">
            <div className="relative group/logo">
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-white/5 border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center group-hover/logo:border-purple-500/40 transition-all duration-500 relative">
                {form.logo_url ? (
                  <OptimizedImage
                    src={form.logo_url}
                    className="w-full h-full object-cover group-hover/logo:scale-110 transition-transform"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-white/10">
                    <Settings size={64} />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">
                      لا يوجد شعار
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">
                    تغيير شعار المنصة
                  </p>
                </div>
              </div>
              <label className="absolute -bottom-4 -left-4 p-5 bg-purple-600 text-white rounded-3xl shadow-2xl cursor-pointer hover:bg-purple-500 transition-all border-4 border-[#0d0d0d] group-hover/logo:scale-110">
                {uploading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <RefreshCw size={24} />
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="flex-1 space-y-8 w-full">
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2">
                  اسم المنصة
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 font-black text-lg text-white outline-none focus:border-purple-500 focus:bg-white/10 transition-all shadow-xl"
                  placeholder="مداد"
                  value={form.site_name}
                  onChange={(e) => set("site_name", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                  <Mail size={14} className="text-purple-500" /> بريد الدعم
                  الفني
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 font-black text-lg text-white outline-none focus:border-purple-500 focus:bg-white/10 transition-all shadow-xl"
                  placeholder="support@midad.me"
                  value={form.support_email}
                  onChange={(e) => set("support_email", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2">
              وصف المنصة (Meta Description)
            </label>
            <textarea
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 font-bold text-base text-white/80 outline-none focus:border-purple-500 focus:bg-white/10 transition-all resize-none leading-relaxed shadow-xl"
              placeholder="تحدث للجمهور عن رؤية المنصة..."
              value={form.site_description}
              onChange={(e) => set("site_description", e.target.value)}
            />
          </div>
        </section>

        {/* Social Links Section */}
        <section className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 md:p-16 shadow-2xl relative overflow-hidden group">
          <h2 className="text-xl md:text-3xl font-black mb-12 flex items-center gap-4 text-white italic">
            <Share2 className="text-purple-500" size={24} />
            الروابط الاجتماعية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                id: "twitter",
                label: "Twitter (X)",
                icon: Twitter,
                color: "text-white",
              },
              {
                id: "facebook",
                label: "Facebook",
                icon: Facebook,
                color: "text-blue-500",
              },
              {
                id: "instagram",
                label: "Instagram",
                icon: Instagram,
                color: "text-pink-500",
              },
              {
                id: "github",
                label: "GitHub",
                icon: Github,
                color: "text-white",
              },
              {
                id: "linkedin",
                label: "LinkedIn",
                icon: Linkedin,
                color: "text-blue-400",
              },
            ].map((social) => (
              <div key={social.id} className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-3 px-2">
                  <social.icon size={16} className={social.color} />{" "}
                  {social.label}
                </label>
                <input
                  type="text"
                  value={form.social_links[social.id]}
                  onChange={(e) => setSocial(social.id, e.target.value)}
                  placeholder={`https://${social.id}.com/...`}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 font-bold text-sm text-white/70 outline-none focus:border-purple-500 transition-all shadow-inner"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Legal & Support Section */}
        <section className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 md:p-16 shadow-2xl relative overflow-hidden group">
          <h2 className="text-xl md:text-3xl font-black mb-12 flex items-center gap-4 text-white italic">
            <ShieldCheck className="text-purple-500" size={24} />
            الدعم والقانون
          </h2>

          <div className="space-y-12">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2 flex items-center gap-3">
                <Info size={16} className="text-purple-500" /> عن المنصة (About
                Us)
              </label>
              <textarea
                value={form.about_us}
                onChange={(e) => set("about_us", e.target.value)}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 px-8 font-medium text-base text-white/80 outline-none focus:border-purple-500 transition-all resize-none shadow-inner"
              />
            </div>

            {/* Detailed Contact Fields */}
            <div className="pt-8 border-t border-white/5 space-y-8">
              <h3 className="text-lg font-black text-white flex items-center gap-3">
                <MessageSquare className="text-purple-500" size={18} />
                تفاصيل صفحة تواصل معنا (Contact Fields)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-3 px-2">
                    <Phone size={14} className="text-purple-400" /> رقم الهاتف
                    للتواصل
                  </label>
                  <input
                    type="text"
                    value={form.contact_phone}
                    onChange={(e) => set("contact_phone", e.target.value)}
                    placeholder="مثال: 20123456789+"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 font-bold text-sm text-white/80 outline-none focus:border-purple-500 transition-all shadow-inner text-left"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-3 px-2">
                    <Clock size={14} className="text-purple-400" /> ساعات العمل
                    والدعم
                  </label>
                  <input
                    type="text"
                    value={form.contact_hours}
                    onChange={(e) => set("contact_hours", e.target.value)}
                    placeholder="مثال: يومياً من 9:00 ص إلى 10:00 م"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 font-bold text-sm text-white/80 outline-none focus:border-purple-500 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-3 px-2">
                  <MapPin size={14} className="text-purple-400" /> عنوان المقر
                  الرئيسي
                </label>
                <input
                  type="text"
                  value={form.contact_address}
                  onChange={(e) => set("contact_address", e.target.value)}
                  placeholder="مثال: القاهرة، مصر - شارع التسعين، التجمع الخامس"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 font-bold text-sm text-white/80 outline-none focus:border-purple-500 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-3 px-2">
                  <MessageSquare size={14} className="text-purple-400" /> وصف
                  إضافي (اختياري)
                </label>
                <textarea
                  value={form.contact_us}
                  onChange={(e) => set("contact_us", e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-6 font-medium text-sm text-white/70 outline-none focus:border-purple-500 transition-all resize-none shadow-inner"
                  placeholder="أدخل أي ملاحظات إضافية يراها الزائر في صفحة تواصل معنا..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-8 border-t border-white/5">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2 flex items-center gap-3">
                  <FileText size={16} className="text-purple-500" /> سياسة
                  الخصوصية
                </label>
                <textarea
                  value={form.privacy_policy}
                  onChange={(e) => set("privacy_policy", e.target.value)}
                  rows={8}
                  className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 px-8 font-medium text-sm text-white/60 outline-none focus:border-purple-500 transition-all resize-none shadow-inner custom-scrollbar"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2 flex items-center gap-3">
                  <Zap size={16} className="text-purple-500" /> شروط الاستخدام
                </label>
                <textarea
                  value={form.terms_of_service}
                  onChange={(e) => set("terms_of_service", e.target.value)}
                  rows={8}
                  className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 px-8 font-medium text-sm text-white/60 outline-none focus:border-purple-500 transition-all resize-none shadow-inner custom-scrollbar"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Builder Section */}
        <section className="bg-[#0d0d0d]/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 md:p-16 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-xl md:text-3xl font-black flex items-center gap-4 text-white italic">
                <HelpCircle className="text-purple-500" size={24} />
                إدارة الأسئلة الشائعة
              </h2>
              <p className="text-white/30 mt-2 font-black uppercase tracking-[0.2em] text-[10px]">
                إضافة وتعديل الأسئلة الشائعة التي تظهر في الواجهة الرئيسية
                للمنصة
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm((p) => ({
                  ...p,
                  faq: [
                    ...(p.faq || []),
                    { question: "", answer: "", category: "عام" },
                  ],
                }));
              }}
              className="px-6 py-4 bg-purple-600 hover:bg-purple-500 border border-purple-500/20 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-purple-600/10"
            >
              <Plus size={16} /> إضافة سؤال جديد
            </button>
          </div>

          {!form.faq || form.faq.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-[2.5rem] bg-white/5">
              <HelpCircle size={48} className="mx-auto text-white/10 mb-4" />
              <p className="text-sm font-black text-white/30 uppercase tracking-widest">
                لا توجد أسئلة شائعة حالياً
              </p>
              <button
                type="button"
                onClick={() => {
                  setForm((p) => ({
                    ...p,
                    faq: [
                      {
                        question: "ما هي منصة مداد؟",
                        answer: "",
                        category: "عام",
                      },
                    ],
                  }));
                }}
                className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-black text-purple-400 hover:text-purple-300 transition-all"
              >
                إضافة أول سؤال شائـع
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {form.faq.map((item, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 relative group/faq-item"
                >
                  <div className="absolute top-6 left-6 opacity-40 group-hover/faq-item:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setForm((p) => ({
                          ...p,
                          faq: p.faq.filter((_, i) => i !== index),
                        }));
                      }}
                      className="p-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-2xl transition-all active:scale-95"
                      title="حذف السؤال"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-3">
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] px-2">
                        السؤال
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: كيف يمكنني الانضمام إلى كُتاب المنصة؟"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 font-bold text-base text-white outline-none focus:border-purple-500 transition-all"
                        value={item.question || ""}
                        onChange={(e) => {
                          const updated = [...form.faq];
                          updated[index].question = e.target.value;
                          setForm((p) => ({ ...p, faq: updated }));
                        }}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] px-2">
                        القسم
                      </label>
                      <input
                        type="text"
                        placeholder="عام، كاتب، دفع..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 font-bold text-base text-white/80 outline-none focus:border-purple-500 transition-all"
                        value={item.category || ""}
                        onChange={(e) => {
                          const updated = [...form.faq];
                          updated[index].category = e.target.value;
                          setForm((p) => ({ ...p, faq: updated }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] px-2">
                      الإجابة
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="اكتب الإجابة المفصلة هنا..."
                      className="w-full bg-black/40 border border-white/10 rounded-[2rem] py-5 px-6 font-medium text-sm text-white/70 outline-none focus:border-purple-500 transition-all resize-none shadow-inner"
                      value={item.answer || ""}
                      onChange={(e) => {
                        const updated = [...form.faq];
                        updated[index].answer = e.target.value;
                        setForm((p) => ({ ...p, faq: updated }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submit Button */}
        <div className="flex gap-6">
          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="flex-1 bg-white text-black py-8 rounded-[3rem] font-black text-2xl shadow-2xl shadow-purple-600/10 hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-6 active:scale-95 disabled:opacity-50 border border-white/20"
          >
            {updateSettings.isPending ? (
              <Loader2 className="animate-spin" size={28} />
            ) : saved ? (
              <Check size={28} className="text-green-500" />
            ) : (
              <Save size={28} />
            )}
            <span>
              {updateSettings.isPending
                ? "جاري المزامنة..."
                : saved
                  ? "تم حفظ التغييرات!"
                  : "تحديث إعدادات المنصة"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
