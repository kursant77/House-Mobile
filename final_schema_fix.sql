-- ============================================
-- FINAL SCHEMA FIX - FORCED REBUILD
-- ============================================

-- 1. Drop and Recreate follows table to ensure clean relationships
DROP TABLE IF EXISTS public.follows;

CREATE TABLE public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT cannot_follow_self CHECK (follower_id <> following_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies for follows
CREATE POLICY "Anyone can see follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow/unfollow" ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- 2. Update profiles table RLS and Constraints
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Fix the role check constraint to allow 'blogger'
DO $$ 
BEGIN
    -- Drop the old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    END IF;

    -- Add the new constraint with 'blogger'
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'blogger', 'super_admin', 'admin'));
END $$;

-- Ensure "blogger" role can be set by admins
DROP POLICY IF EXISTS "Admins can update anyone" ON public.profiles;
CREATE POLICY "Admins can update anyone" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Anyone can see profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (if not done by trigger)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Ensure Notifications Table and RLS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
    target TEXT CHECK (target IN ('all', 'admin', 'seller', 'user')) DEFAULT 'user',
    read_by UUID[] DEFAULT '{}',
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
DROP POLICY IF EXISTS "Anyone can see their own notifications" ON public.notifications;
CREATE POLICY "Anyone can see their own notifications" ON public.notifications 
FOR SELECT USING (
    target = 'all' OR 
    (target = 'user' AND user_id = auth.uid()) OR 
    (target = 'admin' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')) OR
    sender_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can send notifications" ON public.notifications;
CREATE POLICY "Users can send notifications" ON public.notifications 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own read_by status" ON public.notifications;
CREATE POLICY "Users can update their own read_by status" ON public.notifications 
FOR UPDATE USING (
    user_id = auth.uid() OR 
    target = 'all' OR 
    (target = 'admin' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

-- 4. Ensure RPC functions exist
CREATE OR REPLACE FUNCTION increment_post_views(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public_posts
    SET views = COALESCE(views, 0) + 1
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_product_views(product_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET views = COALESCE(views, 0) + 1
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Post Comments Table
CREATE TABLE IF NOT EXISTS public.public_post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.public_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Update public_posts to have title
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='public_posts' AND column_name='title') THEN
        ALTER TABLE public.public_posts ADD COLUMN title TEXT;
    END IF;
END $$;

-- Update profiles to have social links
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='telegram') THEN
        ALTER TABLE public.profiles ADD COLUMN telegram TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='instagram') THEN
        ALTER TABLE public.profiles ADD COLUMN instagram TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='facebook') THEN
        ALTER TABLE public.profiles ADD COLUMN facebook TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='youtube') THEN
        ALTER TABLE public.profiles ADD COLUMN youtube TEXT;
    END IF;
END $$;

-- Enable RLS for comments
ALTER TABLE public.public_post_comments ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can see post comments" ON public.public_post_comments;
CREATE POLICY "Anyone can see post comments" ON public.public_post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can comment" ON public.public_post_comments;
CREATE POLICY "Authenticated users can comment" ON public.public_post_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authors can delete their own comments" ON public.public_post_comments;
CREATE POLICY "Authors can delete their own comments" ON public.public_post_comments FOR DELETE USING (auth.uid() = user_id);

-- 6. Grant access
GRANT EXECUTE ON FUNCTION increment_post_views(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_product_views(UUID) TO anon, authenticated, service_role;
