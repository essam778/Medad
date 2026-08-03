-- =============================================
-- Midad RLS Fixes for Core Tables
-- =============================================

-- Enable RLS for all core tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_requests ENABLE ROW LEVEL SECURITY;

-- 1. POSTS Policies
-- Anyone can view published posts
CREATE POLICY "Public can view published posts" ON public.posts
  FOR SELECT USING (status = 'published');

-- Admins can view all posts
CREATE POLICY "Admins can view all posts" ON public.posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Authors can view, update, delete their own posts
CREATE POLICY "Authors can view own posts" ON public.posts
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Authors can insert own posts" ON public.posts
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own posts" ON public.posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own posts" ON public.posts
  FOR DELETE USING (author_id = auth.uid());

-- Admins can manage all posts
CREATE POLICY "Admins can manage all posts" ON public.posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 2. TAGS Policies
-- Anyone can view tags
CREATE POLICY "Public can view tags" ON public.tags FOR SELECT USING (true);

-- Authenticated users (authors/admins) can insert tags (used when publishing)
CREATE POLICY "Auth users can insert tags" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can update or delete tags
CREATE POLICY "Admins can update tags" ON public.tags
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can delete tags" ON public.tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 3. COMMENTS Policies
-- Anyone can view approved comments
CREATE POLICY "Public can view approved comments" ON public.comments FOR SELECT USING (is_approved = true);

-- Authors/Admins can view all comments on their posts
CREATE POLICY "Authors can view all comments on their posts" ON public.comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.posts WHERE posts.id = comments.post_id AND posts.author_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Users can view their own pending comments
CREATE POLICY "Users can view own comments" ON public.comments FOR SELECT USING (user_id = auth.uid());

-- Authenticated users can insert comments
CREATE POLICY "Auth users can insert comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can update/delete their own comments
CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (user_id = auth.uid());

-- Authors/Admins can delete/update comments on their posts
CREATE POLICY "Authors can manage comments on their posts" ON public.comments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.posts WHERE posts.id = comments.post_id AND posts.author_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 4. POST_REACTIONS Policies
-- Anyone can view reactions
CREATE POLICY "Public can view reactions" ON public.post_reactions FOR SELECT USING (true);
-- Auth users can insert their own reaction
CREATE POLICY "Auth users can insert reaction" ON public.post_reactions FOR INSERT WITH CHECK (user_id = auth.uid());
-- Auth users can update their own reaction
CREATE POLICY "Auth users can update own reaction" ON public.post_reactions FOR UPDATE USING (user_id = auth.uid());
-- Auth users can delete their own reaction
CREATE POLICY "Auth users can delete own reaction" ON public.post_reactions FOR DELETE USING (user_id = auth.uid());

-- 5. POST_VIEWS Policies
-- Auth users can insert views (anonymous views are handled via RPC usually or inserted by service role, but let's allow insert)
CREATE POLICY "Anyone can insert views" ON public.post_views FOR INSERT WITH CHECK (true);
-- Only Authors/Admins can view stats
CREATE POLICY "Authors can view views on their posts" ON public.post_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_views.post_id AND posts.author_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 6. SAVED_POSTS Policies
-- Users can only view/manage their own saved posts
CREATE POLICY "Users can view own saved posts" ON public.saved_posts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own saved posts" ON public.saved_posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own saved posts" ON public.saved_posts FOR DELETE USING (user_id = auth.uid());

-- 7. INVITE_CODES Policies
-- Admins can manage all invite codes
CREATE POLICY "Admins can manage invite codes" ON public.invite_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
-- Public can select invite codes (needed for validation during registration)
CREATE POLICY "Public can select invite codes" ON public.invite_codes
  FOR SELECT USING (true);
-- Public can update invite codes to mark as used
CREATE POLICY "Public can update invite codes" ON public.invite_codes
  FOR UPDATE USING (true);

-- 8. CREATOR_REQUESTS Policies
-- Users can insert their own request
CREATE POLICY "Users can insert creator request" ON public.creator_requests FOR INSERT WITH CHECK (user_id = auth.uid());
-- Users can view their own requests
CREATE POLICY "Users can view own creator requests" ON public.creator_requests FOR SELECT USING (user_id = auth.uid());
-- Admins can manage all creator requests
CREATE POLICY "Admins can manage creator requests" ON public.creator_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
