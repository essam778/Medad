-- Secure Tables with Row Level Security (RLS)

-- 1. Profiles Table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. Posts Table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are viewable by everyone" 
ON posts FOR SELECT 
USING (status = 'published');

CREATE POLICY "Authors can view their own posts" 
ON posts FOR SELECT 
USING (auth.uid() = author_id);

CREATE POLICY "Authors can insert their own posts" 
ON posts FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts" 
ON posts FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own posts" 
ON posts FOR DELETE 
USING (auth.uid() = author_id);

-- 3. Comments Table
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" 
ON comments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert comments" 
ON comments FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments" 
ON comments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON comments FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Post Reactions (Likes)
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions are viewable by everyone" 
ON post_reactions FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can toggle reactions" 
ON post_reactions FOR ALL 
USING (auth.uid() = user_id);

-- 5. Site Settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are viewable by everyone" 
ON site_settings FOR SELECT 
USING (true);

CREATE POLICY "Authors can manage their own site settings" 
ON site_settings FOR ALL 
USING (auth.uid() = author_id);

-- 6. Collections (Playlists)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collections are viewable by everyone" 
ON collections FOR SELECT 
USING (true);

CREATE POLICY "Authors can manage their own collections" 
ON collections FOR ALL 
USING (auth.uid() = author_id);

-- 7. Creator Requests (Admin Only for viewing)
ALTER TABLE creator_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests" 
ON creator_requests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests" 
ON creator_requests FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert requests" 
ON creator_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 8. Tags (Public read, Admin write)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone" 
ON tags FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage tags" 
ON tags FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
