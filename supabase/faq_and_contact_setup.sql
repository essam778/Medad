-- 1. إضافة عمود الأسئلة الشائعة (FAQ) كـ JSONB إلى جدول الإعدادات العامة
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;

-- 2. التحقق من وجود عمود تواصل معنا (contact_us) لضمان توافقه
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS contact_us TEXT DEFAULT '';

-- 3. تأمين جدول الإعدادات العامة باستخدام صلاحيات الأعمدة (Column-Level Security)
-- سحب صلاحية القراءة الكاملة للجدول من الجميع لضمان الأمان المطلق
REVOKE SELECT ON public.settings FROM anon, authenticated;

-- السماح بقراءة الأعمدة العامة والآمنة فقط للزوار والمستخدمين المسجلين
GRANT SELECT (
  id, site_name, site_description, logo_url, posts_per_page, 
  comments_enabled, social_links, support_email, 
  privacy_policy, terms_of_service, about_us, contact_us, faq
) ON public.settings TO anon, authenticated;

-- 4. إدراج الأسئلة الشائعة الافتراضية إذا كان الجدول فارغاً
UPDATE public.settings 
SET faq = '[
  {
    "question": "ما هي منصة مداد؟",
    "answer": "مداد هي منصة تدوين عربية حديثة تهدف إلى تمكين الكُتّاب والمبدعين العرب من نشر أفكارهم وقصصهم في بيئة تصميمية راقية وممتازة تدعم اللغة العربية بشكل كامل وتوفر أدوات متقدمة للكتابة وتتبع الإحصائيات.",
    "category": "عام"
  },
  {
    "question": "كيف يمكنني البدء في الكتابة على مداد؟",
    "answer": "يمكنك إنشاء حساب مجاني كقارئ أولاً، ثم التقديم للحصول على صلاحيات كاتب من خلال لوحة التحكم (استوديو المبدعين). بعد الموافقة على طلبك، ستتمكن من استخدام المحرر المتقدم لنشر مقالاتك.",
    "category": "الكتابة"
  },
  {
    "question": "هل منصة مداد مجانية تماماً؟",
    "answer": "نعم، القراءة والتسجيل ونشر المقالات على مداد مجانية تماماً. نسعى لتوفير أفضل تجربة تدوين بدون إعلانات مزعجة وبأعلى جودة ممكنة.",
    "category": "عام"
  }
]'::jsonb
WHERE faq IS NULL OR faq = '[]'::jsonb;

-- 5. تفعيل حماية Row-Level Security (RLS) على جدول الإعدادات العامة لضمان التطبيق السليم للسياسات
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 6. إنشاء سياسة تسمح للجميع (الزوار والمستخدمين) بقراءة الصفوف
-- بفضل صلاحيات الأعمدة (Column Privileges) المحددة أعلاه، لن يرى المستخدمون سوى الأعمدة المصرح بها فقط!
DROP POLICY IF EXISTS "allow_public_read_settings" ON public.settings;
CREATE POLICY "allow_public_read_settings" ON public.settings
FOR SELECT TO anon, authenticated
USING (true);
