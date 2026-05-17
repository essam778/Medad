-- =============================================
-- Migration: Fix profiles Table Permissions and RLS Policies
-- =============================================

-- 1. منح الصلاحيات الكاملة للأعضاء المسجلين (authenticated) للتحكم في البروفايل الخاص بهم أو تعديله كمدير
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- 2. منح صلاحية القراءة العامة للزوار (anon)
GRANT SELECT ON public.profiles TO anon;

-- 3. حماية البريد الإلكتروني الخاص بالمستخدمين من العرض للزوار العاديين (Security Column)
REVOKE SELECT (email) ON public.profiles FROM anon;

-- 4. تمكين RLS على جدول profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. إنشاء السياسات الأمنية للجدول
-- أ. سياسة قراءة ملفات التعريف (Profiles) متاحة للجميع
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "anon_select_public_fields" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (true);

-- ب. سياسة إنشاء ملف التعريف للمستخدم نفسه أثناء التسجيل
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- ج. سياسة تعديل ملف التعريف (لصاحب الملف أو لمدير المنصة)
-- تمنع أي مستخدم عادي من تغيير رتبته أو حظره أو نقاطه، وتمنح الصلاحيات الكاملة للأدمن
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile_or_admins" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (
  (auth.uid() = id AND (
    role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    is_banned IS NOT DISTINCT FROM (SELECT is_banned FROM public.profiles WHERE id = auth.uid()) AND
    points IS NOT DISTINCT FROM (SELECT points FROM public.profiles WHERE id = auth.uid())
  ))
  OR public.is_admin()
);

-- د. سياسة حذف الملفات التعريفية (لمدير المنصة فقط)
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE TO authenticated
USING (public.is_admin());

-- =============================================
-- RPC Function: get_profiles_with_email
-- =============================================
-- جلب البروفايلات مع البريد الإلكتروني للمشرفين فقط لأغراض الإدارة
CREATE OR REPLACE FUNCTION public.get_profiles_with_email()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT,
  points INTEGER,
  is_banned BOOLEAN,
  email TEXT,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
AS $$
BEGIN
  -- التحقق من أن المستخدم الحالي هو مسؤول (Admin)
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مصرح لك بالوصول إلى هذه البيانات.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.role,
    p.points,
    p.is_banned,
    p.email,
    p.created_at
  FROM public.profiles p;
END;
$$ LANGUAGE plpgsql;

-- منح صلاحية تنفيذ الدالة للمستخدمين المسجلين
GRANT EXECUTE ON FUNCTION public.get_profiles_with_email() TO authenticated;
