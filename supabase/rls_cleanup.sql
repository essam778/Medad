-- =============================================
-- Migration: RLS Cleanup and fixes
-- =============================================

-- 1. invite_codes: allow public read and update during registration
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_invite_codes" ON invite_codes;
CREATE POLICY "public_read_invite_codes" ON invite_codes 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_update_invite_codes" ON invite_codes;
CREATE POLICY "public_update_invite_codes" ON invite_codes 
FOR UPDATE USING (is_used = false) WITH CHECK (is_used = true);

-- 2. cleanup redundant comments policies (keep comments_read, comments_update, comments_delete)
DROP POLICY IF EXISTS "comments_delete_own" ON comments;
DROP POLICY IF EXISTS "comments_update_own" ON comments;

-- 3. cleanup redundant notifications policies (keep v2 policies)
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;

-- 4. cleanup redundant settings policies
DROP POLICY IF EXISTS "allow_public_read_settings" ON settings;
DROP POLICY IF EXISTS "allow_admin_update_settings" ON settings;
