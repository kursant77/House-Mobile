-- Add parent_id for threaded comments (replies)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='public_post_comments' AND column_name='parent_id') THEN
        ALTER TABLE public.public_post_comments ADD COLUMN parent_id UUID REFERENCES public.public_post_comments(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create table for interactions (likes) on comments
CREATE TABLE IF NOT EXISTS public.public_post_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES public.public_post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, comment_id)
);

-- Enable RLS
ALTER TABLE public.public_post_comment_likes ENABLE ROW LEVEL SECURITY;

-- Policies for comment likes
DROP POLICY IF EXISTS "Anyone can read comment likes" ON public.public_post_comment_likes;
CREATE POLICY "Anyone can read comment likes" ON public.public_post_comment_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can toggle like" ON public.public_post_comment_likes;
CREATE POLICY "Authenticated users can toggle like" ON public.public_post_comment_likes
    FOR ALL USING (auth.uid() = user_id);

-- Function to get comment details with like count and user like status
CREATE OR REPLACE FUNCTION get_comments_with_stats(p_post_id UUID)
RETURNS TABLE (
    id UUID,
    post_id UUID,
    user_id UUID,
    content TEXT,
    created_at TIMESTAMPTZ,
    parent_id UUID,
    author_json JSONB,
    likes_count BIGINT,
    has_liked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.created_at,
        c.parent_id,
        jsonb_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url,
            'role', p.role
        ) as author_json,
        COUNT(DISTINCT l.id) as likes_count,
        EXISTS(SELECT 1 FROM public.public_post_comment_likes my_l WHERE my_l.comment_id = c.id AND my_l.user_id = auth.uid()) as has_liked
    FROM public.public_post_comments c
    LEFT JOIN public.profiles p ON c.user_id = p.id
    LEFT JOIN public.public_post_comment_likes l ON c.id = l.comment_id
    WHERE c.post_id = p_post_id
    GROUP BY c.id, p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
