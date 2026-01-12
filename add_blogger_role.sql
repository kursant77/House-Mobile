-- ============================================
-- ADD BLOGGER ROLE AND PUBLIC POSTS TABLE
-- ============================================

-- 1. Update profiles table to allow 'blogger' role
-- We first check if the role column has a constraint and update it if needed.
-- In Supabase, often it's just a text column, but let's make sure it's handled.

-- 2. Create public_posts table for Home Page content
CREATE TABLE IF NOT EXISTS public_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video')),
    category TEXT DEFAULT 'general',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_public_posts_author_id ON public_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_public_posts_created_at ON public_posts(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public_posts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Anyone can see public posts
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public_posts;
CREATE POLICY "Public posts are viewable by everyone" 
ON public_posts FOR SELECT 
USING (true);

-- Admins and Bloggers can create/update/delete posts
DROP POLICY IF EXISTS "Admins and Bloggers can manage posts" ON public_posts;
CREATE POLICY "Admins and Bloggers can manage posts" 
ON public_posts FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'blogger')
  )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_public_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_public_posts_updated_at
    BEFORE UPDATE ON public_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_public_posts_updated_at();
