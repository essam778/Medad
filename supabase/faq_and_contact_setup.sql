-- 1. إضافة عمود الأسئلة الشائعة (FAQ) كـ JSONB إلى جدول الإعدادات العامة
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;

-- 2. إضافة حقول الاتصال المنفصلة والدقيقة
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS contact_us TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS contact_phone TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS contact_address TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS contact_hours TEXT DEFAULT '';

-- 3. إنشاء وعاء تخزين الشعارات (logos Bucket) تلقائياً إذا لم يكن موجوداً
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 4. إعداد سياسات الأمان الخاصة بوعاء الشعارات (storage.objects)
-- السماح بالوصول العام للقراءة للجميع
DROP POLICY IF EXISTS "Public Access to Logos" ON storage.objects;
CREATE POLICY "Public Access to Logos" ON storage.objects 
FOR SELECT USING (bucket_id = 'logos');

-- السماح للمستخدمين المصادقين برفع ملفاتهم الخاصة فقط مع مطابقة المالك الفعلي للملف
DROP POLICY IF EXISTS "Authenticated Insert to Logos" ON storage.objects;
CREATE POLICY "Authenticated Insert to Logos" ON storage.objects 
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'logos' AND owner = auth.uid()
);

-- السماح للمستخدمين بتعديل وتحديث ملفاتهم الخاصة فقط لمنع التخريب
DROP POLICY IF EXISTS "Authenticated Update to Logos" ON storage.objects;
CREATE POLICY "Authenticated Update to Logos" ON storage.objects 
FOR UPDATE TO authenticated USING (
  bucket_id = 'logos' AND owner = auth.uid()
);

-- السماح للمستخدمين بحذف ملفاتهم الخاصة فقط
DROP POLICY IF EXISTS "Authenticated Delete to Logos" ON storage.objects;
CREATE POLICY "Authenticated Delete to Logos" ON storage.objects 
FOR DELETE TO authenticated USING (
  bucket_id = 'logos' AND owner = auth.uid()
);

-- السماح لمدير المنصة (الأدمن) بالتحكم والوصول الكامل لجميع الشعارات
DROP POLICY IF EXISTS "Admins Full Access to Logos" ON storage.objects;
CREATE POLICY "Admins Full Access to Logos" ON storage.objects 
FOR ALL TO authenticated USING (
  bucket_id = 'logos' AND public.is_admin()
);

-- 5. منح الصلاحيات اللازمة لجدول الإعدادات العامة (public.settings)
-- السماح بقراءة الجدول للزوار والمستخدمين
GRANT SELECT ON public.settings TO anon, authenticated;

-- السماح بتعديل الإعدادات للمستخدمين المسجلين (تحت حماية سياسات RLS الصارمة بالأسفل)
GRANT UPDATE ON public.settings TO authenticated;

-- 6. إدراج الأسئلة الشائعة الافتراضية إذا كان الجدول فارغاً
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

-- 7. تفعيل حماية Row-Level Security (RLS) على جدول الإعدادات العامة لضمان التطبيق السليم للسياسات
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 8. إنشاء السياسات الأمنية للجدول
-- أ. سياسة تسمح للجميع بقراءة الإعدادات العامة
DROP POLICY IF EXISTS "allow_public_read_settings" ON public.settings;
CREATE POLICY "allow_public_read_settings" ON public.settings
FOR SELECT TO anon, authenticated
USING (true);

-- ب. سياسة تسمح لمدير المنصة (الأدمن) فقط بتحديث الإعدادات العامة
DROP POLICY IF EXISTS "allow_admin_update_settings" ON public.settings;
CREATE POLICY "allow_admin_update_settings" ON public.settings
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
