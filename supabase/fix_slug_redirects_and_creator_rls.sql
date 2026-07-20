-- 1. Slug redirects table for channel slug changes
CREATE TABLE IF NOT EXISTS public.slug_redirects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  old_slug text NOT NULL UNIQUE,
  new_slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT slug_redirects_pkey PRIMARY KEY (id)
);

ALTER TABLE slug_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Slug redirects are viewable by everyone"
ON slug_redirects FOR SELECT
USING (true);

CREATE POLICY "Authors can manage their own slug redirects"
ON slug_redirects FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authors can update slug redirects"
ON slug_redirects FOR UPDATE
USING (true)
WITH CHECK (true);

-- 2. Fix creator_requests — add missing UPDATE/DELETE policies for admins
CREATE POLICY "Admins can update creator requests"
ON creator_requests FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete creator requests"
ON creator_requests FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
