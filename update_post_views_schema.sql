-- Create table to track unique views
CREATE TABLE IF NOT EXISTS public.public_post_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.public_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ip_address TEXT, -- Optional, for future IP-based unique checks
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id) -- Ensure one view per user per post
);

-- Enable RLS
ALTER TABLE public.public_post_views ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can insert views" ON public.public_post_views;
CREATE POLICY "Anyone can insert views"
    ON public.public_post_views FOR INSERT
    with check (true);

DROP POLICY IF EXISTS "Users can read own views" ON public.public_post_views;
CREATE POLICY "Users can read own views"
    ON public.public_post_views FOR SELECT
    USING (auth.uid() = user_id);

-- RPC to safely increment views only if unique
CREATE OR REPLACE FUNCTION increment_post_view_unique(p_post_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- If user is logged in, check uniqueness
    IF p_user_id IS NOT NULL THEN
        -- Check if view already exists for this user
        SELECT EXISTS(
            SELECT 1 FROM public.public_post_views 
            WHERE post_id = p_post_id AND user_id = p_user_id
        ) INTO v_exists;
        
        IF v_exists THEN
            -- Already viewed, do nothing
            RETURN;
        ELSE
            -- Record new view
            INSERT INTO public.public_post_views (post_id, user_id)
            VALUES (p_post_id, p_user_id);
            
            -- Increment post counter
            UPDATE public.public_posts
            SET views = views + 1
            WHERE id = p_post_id;
        END IF;
    ELSE
        -- Anonymous user: For now, just increment. 
        -- (Optional: unique check by IP could be added here later if ip is passed)
        UPDATE public.public_posts
        SET views = views + 1
        WHERE id = p_post_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
