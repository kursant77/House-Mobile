-- Create public_post_likes table
CREATE TABLE IF NOT EXISTS public.public_post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.public_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.public_post_likes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.public_post_likes;
CREATE POLICY "Anyone can view post likes"
    ON public.public_post_likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can toggle likes" ON public.public_post_likes;
CREATE POLICY "Authenticated users can toggle likes"
    ON public.public_post_likes FOR ALL
    USING (auth.uid() = user_id);

-- RPC to get post stats (likes count and if current user liked)
CREATE OR REPLACE FUNCTION public.get_post_stats(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_likes_count INT;
    v_has_liked BOOLEAN;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    -- Get likes count
    SELECT COUNT(*) INTO v_likes_count
    FROM public.public_post_likes
    WHERE post_id = p_post_id;

    -- Check if user liked
    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.public_post_likes
            WHERE post_id = p_post_id AND user_id = v_user_id
        ) INTO v_has_liked;
    ELSE
        v_has_liked := FALSE;
    END IF;

    RETURN jsonb_build_object(
        'likes_count', v_likes_count,
        'has_liked', v_has_liked
    );
END;
$$;
