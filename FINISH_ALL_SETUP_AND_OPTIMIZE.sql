-- ==========================================================
-- UNIFIED SETUP & OPTIMIZATION SCRIPT (V2)
-- This script creates all missing tables, functions, and 
-- optimization indexes for YouTube-style interactions.
-- ==========================================================

----------------------------------------------------------
-- 1. POST LIKES & DISLIKES
----------------------------------------------------------
-- Likes
CREATE TABLE IF NOT EXISTS public.public_post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.public_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

-- Dislikes
CREATE TABLE IF NOT EXISTS public.public_post_dislikes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.public_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

ALTER TABLE public.public_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_post_dislikes ENABLE ROW LEVEL SECURITY;

-- Policies for Likes
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.public_post_likes;
CREATE POLICY "Anyone can view post likes" ON public.public_post_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can toggle own likes" ON public.public_post_likes;
CREATE POLICY "Users can toggle own likes" ON public.public_post_likes FOR ALL USING (auth.uid() = user_id);

-- Policies for Dislikes
DROP POLICY IF EXISTS "Anyone can view post dislikes" ON public.public_post_dislikes;
CREATE POLICY "Anyone can view post dislikes" ON public.public_post_dislikes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can toggle own dislikes" ON public.public_post_dislikes;
CREATE POLICY "Users can toggle own dislikes" ON public.public_post_dislikes FOR ALL USING (auth.uid() = user_id);

----------------------------------------------------------
-- 2. POST SAVING (Library)
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.public_post_saved (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.public_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

ALTER TABLE public.public_post_saved ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved" ON public.public_post_saved;
CREATE POLICY "Users can view own saved" ON public.public_post_saved FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can toggle own saved" ON public.public_post_saved;
CREATE POLICY "Users can toggle own saved" ON public.public_post_saved FOR ALL USING (auth.uid() = user_id);

----------------------------------------------------------
-- 3. UPDATED POST STATS RPC (Likes, Dislikes, Saved)
----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_post_stats(p_post_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_likes_count INT;
    v_has_liked BOOLEAN;
    v_has_disliked BOOLEAN;
    v_has_saved BOOLEAN;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Get total likes
    SELECT COUNT(*) INTO v_likes_count FROM public.public_post_likes WHERE post_id = p_post_id;
    
    -- Check user status
    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (SELECT 1 FROM public.public_post_likes WHERE post_id = p_post_id AND user_id = v_user_id) INTO v_has_liked;
        SELECT EXISTS (SELECT 1 FROM public.public_post_dislikes WHERE post_id = p_post_id AND user_id = v_user_id) INTO v_has_disliked;
        SELECT EXISTS (SELECT 1 FROM public.public_post_saved WHERE post_id = p_post_id AND user_id = v_user_id) INTO v_has_saved;
    ELSE
        v_has_liked := FALSE;
        v_has_disliked := FALSE;
        v_has_saved := FALSE;
    END IF;
    
    RETURN jsonb_build_object(
        'likes_count', v_likes_count,
        'has_liked', v_has_liked,
        'has_disliked', v_has_disliked,
        'has_saved', v_has_saved
    );
END;
$$;

----------------------------------------------------------
-- 4. POST COMMENTS (Threaded + Likes + Stats)
----------------------------------------------------------
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='public_post_comments' AND column_name='parent_id') THEN
        ALTER TABLE public.public_post_comments ADD COLUMN parent_id UUID REFERENCES public.public_post_comments(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.public_post_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES public.public_post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, comment_id)
);

ALTER TABLE public.public_post_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comment likes" ON public.public_post_comment_likes;
CREATE POLICY "Anyone can read comment likes" ON public.public_post_comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can toggle like" ON public.public_post_comment_likes;
CREATE POLICY "Authenticated users can toggle like" ON public.public_post_comment_likes FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION get_comments_with_stats(p_post_id UUID)
RETURNS TABLE (id UUID, post_id UUID, user_id UUID, content TEXT, created_at TIMESTAMPTZ, parent_id UUID, author_json JSONB, likes_count BIGINT, has_liked BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, c.parent_id,
        jsonb_build_object('id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url, 'role', p.role) as author_json,
        COUNT(DISTINCT l.id) as likes_count,
        EXISTS(SELECT 1 FROM public.public_post_comment_likes my_l WHERE my_l.comment_id = c.id AND my_l.user_id = auth.uid()) as has_liked
    FROM public.public_post_comments c
    LEFT JOIN public.profiles p ON c.user_id = p.id
    LEFT JOIN public.public_post_comment_likes l ON c.id = l.comment_id
    WHERE c.post_id = p_post_id
    GROUP BY c.id, p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

----------------------------------------------------------
-- 5. UNIQUE POST VIEWS
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.public_post_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.public_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);

ALTER TABLE public.public_post_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert views" ON public.public_post_views;
CREATE POLICY "Anyone can insert views" ON public.public_post_views FOR INSERT with check (true);

DROP POLICY IF EXISTS "Users can read own views" ON public.public_post_views;
CREATE POLICY "Users can read own views" ON public.public_post_views FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION increment_post_view_unique(p_post_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    IF p_user_id IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM public.public_post_views WHERE post_id = p_post_id AND user_id = p_user_id) INTO v_exists;
        IF v_exists THEN RETURN;
        ELSE
            INSERT INTO public.public_post_views (post_id, user_id) VALUES (p_post_id, p_user_id);
            UPDATE public.public_posts SET views = views + 1 WHERE id = p_post_id;
        END IF;
    ELSE
        UPDATE public.public_posts SET views = views + 1 WHERE id = p_post_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

----------------------------------------------------------
-- 6. PERFORMANCE OPTIMIZATION (INDEXES)
----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.public_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.public_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.public_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.public_post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_lookup ON public.public_post_likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_dislikes_lookup ON public.public_post_dislikes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_saved_lookup ON public.public_post_saved(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_lookup ON public.public_post_comment_likes(comment_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_lookup ON public.public_post_views(post_id, user_id);

-- Grant permissions
GRANT ALL ON TABLE public.public_post_likes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.public_post_dislikes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.public_post_saved TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.public_post_comment_likes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.public_post_views TO anon, authenticated, service_role;
