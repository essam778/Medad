-- =============================================
-- Migration: RLS Policies + site_settings columns
-- =============================================

-- site_settings new columns
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS hero_post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS trending_post_ids uuid[] DEFAULT '{}';

-- POSTS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_read_all_published" ON posts;
DROP POLICY IF EXISTS "posts_manage_own" ON posts;

-- COMMENTS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_manage_own" ON comments;
CREATE POLICY "comments_update" ON comments
FOR UPDATE USING ((user_id = auth.uid()) OR is_admin())
WITH CHECK ((user_id = auth.uid()) OR is_admin());

-- POST_REACTIONS
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_update_own" ON post_reactions
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- SAVED_POSTS
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own saves" ON saved_posts;
CREATE POLICY "saved_posts_select" ON saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_posts_insert" ON saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_posts_delete" ON saved_posts FOR DELETE USING (auth.uid() = user_id);

-- POST_VIEWS
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "post_views_insert" ON post_views;
CREATE POLICY "post_views_insert" ON post_views
FOR INSERT WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (auth.uid() IS NULL AND user_id IS NULL)
);

-- TAGS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tags_write" ON tags;
CREATE POLICY "tags_insert" ON tags FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "tags_update" ON tags FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "tags_delete" ON tags FOR DELETE USING (is_admin());