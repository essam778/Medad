-- =============================================
-- Migration: Enforce Safe URLs via CHECK constraints
-- =============================================
-- هذا الكود يمنع حفظ أي روابط خبيثة في قاعدة البيانات 
-- (مثل javascript:alert) ويشترط أن تبدأ الروابط بـ http أو https

-- 1. إضافة قيد لجدول profiles (حقل avatar_url)
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS valid_avatar_url;

ALTER TABLE public.profiles 
  ADD CONSTRAINT valid_avatar_url 
  CHECK (
    avatar_url IS NULL 
    OR avatar_url = '' 
    OR avatar_url ~* '^https?://.+'
  );

-- 2. إضافة قيد لجدول posts (حقل cover_image_url)
ALTER TABLE public.posts 
  DROP CONSTRAINT IF EXISTS valid_cover_image_url;

ALTER TABLE public.posts 
  ADD CONSTRAINT valid_cover_image_url 
  CHECK (
    cover_image_url IS NULL 
    OR cover_image_url = '' 
    OR cover_image_url ~* '^https?://.+'
  );

-- 3. إضافة قيد لجدول site_settings (حقل logo_url)
ALTER TABLE public.site_settings 
  DROP CONSTRAINT IF EXISTS valid_logo_url;

ALTER TABLE public.site_settings 
  ADD CONSTRAINT valid_logo_url 
  CHECK (
    logo_url IS NULL 
    OR logo_url = '' 
    OR logo_url ~* '^https?://.+'
  );
