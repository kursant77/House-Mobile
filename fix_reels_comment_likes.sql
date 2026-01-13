-- Create table for interactions (likes) on product comments (Reels)
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES public.product_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, comment_id)
);

-- Enable RLS
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Policies for comment likes
DROP POLICY IF EXISTS "Anyone can read reels comment likes" ON public.comment_likes;
CREATE POLICY "Anyone can read reels comment likes" ON public.comment_likes
    FOR SELECT USING (true);

-- Allow authenticated users to insert/delete their own likes
DROP POLICY IF EXISTS "Authenticated users can toggle reels comment like" ON public.comment_likes;
CREATE POLICY "Authenticated users can toggle reels comment like" ON public.comment_likes
    FOR ALL USING (auth.uid() = user_id);

-- Performance Index
CREATE INDEX IF NOT EXISTS idx_reels_comment_likes_lookup ON public.comment_likes(comment_id, user_id);

-- Grant permissions
GRANT ALL ON TABLE public.comment_likes TO anon, authenticated, service_role;
