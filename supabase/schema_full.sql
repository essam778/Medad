-- =============================================
-- Midad Full Schema
-- =============================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  bio text,
  role text NOT NULL DEFAULT 'reader' CHECK (role = ANY (ARRAY['reader','author','admin'])),
  is_banned boolean DEFAULT false,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- POSTS
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text,
  cover_image_url text,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft','published','scheduled'])),
  published_at timestamptz,
  scheduled_for timestamptz,
  views integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  reading_time integer DEFAULT 0,
  author_id uuid,
  seo_title text,
  seo_description text,
  excerpt text,
  comments_disabled boolean DEFAULT false,
  featured_type text,
  search_vector tsvector,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);

-- TAGS
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text UNIQUE,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT tags_pkey PRIMARY KEY (id)
);

-- COMMENTS
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  user_id uuid,
  content text NOT NULL,
  parent_id uuid,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id)
);

-- POST_REACTIONS
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  user_id uuid,
  type text CHECK (type = ANY (ARRAY['like','love','haha','sad','angry'])),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT post_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT post_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT post_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- POST_VIEWS
CREATE TABLE IF NOT EXISTS public.post_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  user_id uuid,
  viewer_ip text,
  viewed_at timestamptz DEFAULT now(),
  CONSTRAINT post_views_pkey PRIMARY KEY (id),
  CONSTRAINT post_views_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT post_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- SAVED_POSTS
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT saved_posts_pkey PRIMARY KEY (id),
  CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- COLLECTIONS
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT collections_pkey PRIMARY KEY (id),
  CONSTRAINT collections_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id)
);

-- COLLECTION_POSTS
CREATE TABLE IF NOT EXISTS public.collection_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL,
  post_id uuid NOT NULL,
  added_at timestamptz DEFAULT now(),
  CONSTRAINT collection_posts_pkey PRIMARY KEY (id),
  CONSTRAINT collection_posts_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id),
  CONSTRAINT collection_posts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);

-- FOLLOWS
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid,
  following_id uuid,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT follows_pkey PRIMARY KEY (id),
  CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id),
  CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id)
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  actor_id uuid,
  type text NOT NULL,
  title text,
  message text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id),
  CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id)
);

-- SITE_SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid UNIQUE,
  site_name text DEFAULT 'مدونتي الخاصة',
  site_description text,
  logo_url text,
  footer_text text,
  theme_color text DEFAULT '#000000',
  channel_slug text UNIQUE,
  hero_post_id uuid,
  trending_post_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (id),
  CONSTRAINT site_settings_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id),
  CONSTRAINT site_settings_hero_post_id_fkey FOREIGN KEY (hero_post_id) REFERENCES public.posts(id)
);

-- INVITE_CODES
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  role text DEFAULT 'author',
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT invite_codes_pkey PRIMARY KEY (id)
);

-- CREATOR_REQUESTS
CREATE TABLE IF NOT EXISTS public.creator_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text DEFAULT 'pending',
  message text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT creator_requests_pkey PRIMARY KEY (id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- PUSH_SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- NEWSLETTER_SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_subscriptions_pkey PRIMARY KEY (id)
);

-- =============================================
-- is_admin() Helper Function
-- =============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- =============================================
-- RLS Policies
-- =============================================

-- POSTS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_read" ON posts FOR SELECT USING (status = 'published' OR auth.uid() = author_id OR is_admin());
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'author') OR is_admin()));
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = author_id OR is_admin()) WITH CHECK (auth.uid() = author_id OR is_admin());
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (auth.uid() = author_id OR is_admin());
CREATE POLICY "admin_full_access_posts" ON posts FOR ALL USING (is_admin());

-- COMMENTS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_read" ON comments FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR is_admin());
CREATE POLICY "comments_insert_user" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON comments FOR UPDATE USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- POST_REACTIONS
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select" ON post_reactions FOR SELECT USING (true);
CREATE POLICY "Allow individual insert" ON post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow individual delete" ON post_reactions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "reactions_update_own" ON post_reactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SAVED_POSTS
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_posts_select" ON saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_posts_insert" ON saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_posts_delete" ON saved_posts FOR DELETE USING (auth.uid() = user_id);

-- POST_VIEWS
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_views_admin_read" ON post_views FOR SELECT USING (is_admin());
CREATE POLICY "post_views_author_read" ON post_views FOR SELECT USING (post_id IN (SELECT id FROM posts WHERE author_id = auth.uid()));
CREATE POLICY "post_views_insert" ON post_views FOR INSERT WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- TAGS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_read_all" ON tags FOR SELECT USING (true);
CREATE POLICY "tags_insert" ON tags FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "tags_update" ON tags FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "tags_delete" ON tags FOR DELETE USING (is_admin());