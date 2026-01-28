-- ============================================
-- HOUSE MOBILE - COMPLETE DATABASE SCHEMA
-- ============================================
-- Bu fayl to'liq mukammal database schema ni o'z ichiga oladi
-- Supabase'da ishlatish uchun mo'ljallangan
-- Barcha SQL migrationlar bitta faylga birlashtirilgan
-- ============================================

-- ============================================
-- 1. PROFILES TABLE - Username va Phone bilan
-- ============================================

-- Avval profiles jadvalini yangilash (agar mavjud bo'lsa)
DO $$ 
BEGIN
    -- Username maydonini qo'shish (agar mavjud bo'lmasa)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'username'
    ) THEN
        ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
    END IF;

    -- Phone maydonini qo'shish (agar mavjud bo'lmasa)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
        CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
    END IF;

    -- Bio maydonini qo'shish (agar mavjud bo'lmasa)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'bio'
    ) THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
    END IF;

    -- Address maydonini qo'shish
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'address'
    ) THEN
        ALTER TABLE profiles ADD COLUMN address TEXT;
    END IF;

    -- Social links maydonlarini qo'shish
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='profiles' AND column_name='telegram'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN telegram TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='profiles' AND column_name='instagram'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN instagram TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='profiles' AND column_name='facebook'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN facebook TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='profiles' AND column_name='youtube'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN youtube TEXT;
    END IF;

    -- Role maydonini qo'shish (agar mavjud bo'lmasa)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='profiles' AND column_name='role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
    END IF;

    -- last_seen maydonini qo'shish (agar mavjud bo'lmasa) - online status uchun
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='profiles' AND column_name='last_seen'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN last_seen TIMESTAMPTZ;
    END IF;
END $$;

-- Username unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON profiles(LOWER(username)) WHERE username IS NOT NULL;

-- Fix the role check constraint to allow 'blogger'
DO $$ 
BEGIN
    -- Faqat role ustuni mavjud bo'lsa constraint qo'shish
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
        -- Drop the old constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND constraint_name = 'profiles_role_check'
        ) THEN
            ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
        END IF;

        -- Add the new constraint with 'blogger'
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND constraint_name = 'profiles_role_check'
        ) THEN
            ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
            CHECK (role IN ('user', 'blogger', 'super_admin', 'admin'));
        END IF;
    END IF;
END $$;

-- Profiles RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update anyone" ON public.profiles;
CREATE POLICY "Admins can update anyone" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================
-- 2. FOLLOWS TABLE
-- ============================================

DROP TABLE IF EXISTS public.follows;

CREATE TABLE public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT cannot_follow_self CHECK (follower_id <> following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can see follows" ON public.follows;
CREATE POLICY "Anyone can see follows" ON public.follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can follow/unfollow" ON public.follows;
CREATE POLICY "Users can follow/unfollow" ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- ============================================
-- 3. PUBLIC POSTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video')),
    category TEXT DEFAULT 'general',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_posts_author_id ON public_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_public_posts_created_at ON public_posts(created_at DESC);

ALTER TABLE public_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public_posts;
CREATE POLICY "Public posts are viewable by everyone" 
ON public_posts FOR SELECT 
USING (true);

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

CREATE OR REPLACE FUNCTION update_public_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_public_posts_updated_at ON public_posts;
CREATE TRIGGER trigger_update_public_posts_updated_at
    BEFORE UPDATE ON public_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_public_posts_updated_at();

-- ============================================
-- 4. POST LIKES & DISLIKES
-- ============================================

CREATE TABLE IF NOT EXISTS public.public_post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.public_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.public_post_dislikes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.public_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

ALTER TABLE public.public_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_post_dislikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view post likes" ON public.public_post_likes;
CREATE POLICY "Anyone can view post likes" ON public.public_post_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can toggle own likes" ON public.public_post_likes;
CREATE POLICY "Users can toggle own likes" ON public.public_post_likes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view post dislikes" ON public.public_post_dislikes;
CREATE POLICY "Anyone can view post dislikes" ON public.public_post_dislikes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can toggle own dislikes" ON public.public_post_dislikes;
CREATE POLICY "Users can toggle own dislikes" ON public.public_post_dislikes FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 5. POST SAVED (Library)
-- ============================================

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

-- ============================================
-- 6. POST VIEWS
-- ============================================

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
CREATE POLICY "Anyone can insert views"
    ON public.public_post_views FOR INSERT
    with check (true);

DROP POLICY IF EXISTS "Users can read own views" ON public.public_post_views;
CREATE POLICY "Users can read own views"
    ON public.public_post_views FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- 7. POST COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.public_post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.public_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.public_post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='public_post_comments' AND column_name='parent_id') THEN
        ALTER TABLE public.public_post_comments ADD COLUMN parent_id UUID REFERENCES public.public_post_comments(id) ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE public.public_post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can see post comments" ON public.public_post_comments;
CREATE POLICY "Anyone can see post comments" ON public.public_post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can comment" ON public.public_post_comments;
CREATE POLICY "Authenticated users can comment" ON public.public_post_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authors can delete their own comments" ON public.public_post_comments;
CREATE POLICY "Authors can delete their own comments" ON public.public_post_comments FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 8. POST COMMENT LIKES
-- ============================================

CREATE TABLE IF NOT EXISTS public.public_post_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES public.public_post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, comment_id)
);

ALTER TABLE public.public_post_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comment likes" ON public.public_post_comment_likes;
CREATE POLICY "Anyone can read comment likes" ON public.public_post_comment_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can toggle like" ON public.public_post_comment_likes;
CREATE POLICY "Authenticated users can toggle like" ON public.public_post_comment_likes
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 9. PRODUCT COMMENTS TABLE
-- ============================================

-- Product comments jadvalini yaratish (agar mavjud bo'lmasa)
-- Eslatma: products jadvali allaqachon mavjud bo'lishi kerak
DO $$
BEGIN
    -- Product comments jadvalini yaratish (agar mavjud bo'lmasa)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_comments'
    ) THEN
        -- Avval products jadvali mavjudligini tekshirish
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'products'
        ) THEN
            CREATE TABLE product_comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                parent_comment_id UUID REFERENCES product_comments(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            -- Indexlar
            CREATE INDEX IF NOT EXISTS idx_product_comments_product_id ON product_comments(product_id);
            CREATE INDEX IF NOT EXISTS idx_product_comments_user_id ON product_comments(user_id);
            CREATE INDEX IF NOT EXISTS idx_product_comments_parent ON product_comments(parent_comment_id);
            CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON product_comments(created_at DESC);
        END IF;
    END IF;
    
    -- Agar jadval mavjud bo'lsa, parent_comment_id ustunini qo'shish (agar mavjud bo'lmasa)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_comments'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'product_comments' AND column_name = 'parent_comment_id'
        ) THEN
            ALTER TABLE product_comments ADD COLUMN parent_comment_id UUID;
            
            -- Foreign key constraint qo'shish
            ALTER TABLE product_comments 
            ADD CONSTRAINT product_comments_parent_comment_id_fkey 
            FOREIGN KEY (parent_comment_id) REFERENCES product_comments(id) ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_product_comments_parent ON product_comments(parent_comment_id);
        END IF;
    END IF;
END $$;

-- ============================================
-- 10. PRODUCTS TABLE
-- ============================================

-- Products table creation with safe index handling
DO $$
BEGIN
    -- Create products table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'products'
    ) THEN
        CREATE TABLE products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            price DECIMAL(12, 2) NOT NULL,
            currency TEXT NOT NULL DEFAULT 'UZS',
            category TEXT NOT NULL,
            in_stock BOOLEAN NOT NULL DEFAULT true,
            rating DECIMAL(3, 2) DEFAULT NULL,
            review_count INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Create indexes for newly created table
        CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_products_category_created ON products(category, created_at DESC);
    END IF;
END $$;

-- ============================================
-- 11. PRODUCT MEDIA TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_product_type ON product_media(product_id, type);

-- ============================================
-- 12. PRODUCT LIKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS product_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Indexes for product_likes (with column existence checks)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_likes'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'product_likes' AND column_name = 'user_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_product_likes_user_id ON product_likes(user_id);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'product_likes' AND column_name = 'product_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_product_likes_product_id ON product_likes(product_id);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'product_likes' 
            AND column_name = 'product_id'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'product_likes' 
            AND column_name = 'user_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_product_likes_product_user ON product_likes(product_id, user_id);
        END IF;
    END IF;
END $$;

ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_likes (only if user_id column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'product_likes' AND column_name = 'user_id'
    ) THEN
        DROP POLICY IF EXISTS "Anyone can view product likes" ON product_likes;
        CREATE POLICY "Anyone can view product likes" ON product_likes FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Users can toggle own likes" ON product_likes;
        CREATE POLICY "Users can toggle own likes" ON product_likes FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- 13. FAVORITES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Indexes for favorites (with column existence checks)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'favorites'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'user_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'product_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'favorites' 
            AND column_name = 'user_id'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'favorites' 
            AND column_name = 'product_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_favorites_user_product ON favorites(user_id, product_id);
        END IF;
    END IF;
END $$;

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorites (only if user_id column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'user_id'
    ) THEN
        DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
        CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
        CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- 14. CART TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Indexes for cart (with column existence checks)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'cart'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'cart' AND column_name = 'user_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'cart' AND column_name = 'product_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_cart_product_id ON cart(product_id);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'cart' 
            AND column_name = 'user_id'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'cart' 
            AND column_name = 'product_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_cart_user_product ON cart(user_id, product_id);
        END IF;
    END IF;
END $$;

ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cart (only if user_id column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'cart' AND column_name = 'user_id'
    ) THEN
        DROP POLICY IF EXISTS "Users can view own cart" ON cart;
        CREATE POLICY "Users can view own cart" ON cart FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can manage own cart" ON cart;
        CREATE POLICY "Users can manage own cart" ON cart FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- 15. REELS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for reels (with column existence checks)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'reels'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'reels' AND column_name = 'product_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_reels_product_id ON reels(product_id);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'reels' AND column_name = 'user_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
        END IF;

        CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
    END IF;
END $$;

ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reels (only if user_id column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'reels' AND column_name = 'user_id'
    ) THEN
        DROP POLICY IF EXISTS "Anyone can view reels" ON reels;
        CREATE POLICY "Anyone can view reels" ON reels FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Authenticated users can create reels" ON reels;
        CREATE POLICY "Authenticated users can create reels" ON reels FOR INSERT WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can update own reels" ON reels;
        CREATE POLICY "Users can update own reels" ON reels FOR UPDATE USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can delete own reels" ON reels;
        CREATE POLICY "Users can delete own reels" ON reels FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- 16. COMMENT REPLIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS comment_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES product_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reply_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comment_replies_comment_id ON comment_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_user_id ON comment_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_created_at ON comment_replies(created_at DESC);

-- ============================================
-- 11. COMMENT LIKES (Reels)
-- ============================================

CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES public.product_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, comment_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reels comment likes" ON public.comment_likes;
CREATE POLICY "Anyone can read reels comment likes" ON public.comment_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can toggle reels comment like" ON public.comment_likes;
CREATE POLICY "Authenticated users can toggle reels comment like" ON public.comment_likes
    FOR ALL USING (auth.uid() = user_id);

-- Index for comment_likes (with existence checks)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'comment_likes'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'comment_likes' AND column_name = 'comment_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'comment_likes' AND column_name = 'user_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_reels_comment_likes_lookup ON public.comment_likes(comment_id, user_id);
    END IF;
END $$;

-- ============================================
-- 12. VIEW HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS view_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('reel', 'post', 'product')),
    content_id UUID NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_type, content_id)
);

-- Indexes for view_history (with existence checks)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'view_history'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'view_history' AND column_name = 'user_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_view_history_user_id ON view_history(user_id);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'view_history' AND column_name = 'content_type'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_view_history_content_type ON view_history(content_type);
        END IF;

        CREATE INDEX IF NOT EXISTS idx_view_history_viewed_at ON view_history(viewed_at DESC);

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'view_history' AND column_name = 'user_id'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'view_history' AND column_name = 'content_type'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'view_history' AND column_name = 'viewed_at'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_view_history_user_content ON view_history(user_id, content_type, viewed_at DESC);
        END IF;
    END IF;
END $$;

-- RLS for view_history (with existence check)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'view_history'
    ) THEN
        ALTER TABLE view_history ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- RLS Policies for view_history (only if table and user_id column exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'view_history'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'view_history' AND column_name = 'user_id'
    ) THEN
        DROP POLICY IF EXISTS "Users can view own history" ON view_history;
        CREATE POLICY "Users can view own history"
            ON view_history FOR SELECT
            USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can insert own history" ON view_history;
        CREATE POLICY "Users can insert own history"
            ON view_history FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can delete own history" ON view_history;
        CREATE POLICY "Users can delete own history"
            ON view_history FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- 13. WATCH LATER TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS watch_later (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Indexes for watch_later (with existence checks)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'watch_later'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'watch_later' AND column_name = 'user_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_watch_later_user_id ON watch_later(user_id);
        END IF;

        CREATE INDEX IF NOT EXISTS idx_watch_later_created_at ON watch_later(created_at DESC);
    END IF;
END $$;

-- RLS for watch_later (with existence check)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'watch_later'
    ) THEN
        ALTER TABLE watch_later ENABLE ROW LEVEL SECURITY;
        
        -- RLS Policies for watch_later (only if user_id column exists)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'watch_later' AND column_name = 'user_id'
        ) THEN
            DROP POLICY IF EXISTS "Users can view own watch later" ON watch_later;
            CREATE POLICY "Users can view own watch later"
                ON watch_later FOR SELECT
                USING (auth.uid() = user_id);

            DROP POLICY IF EXISTS "Users can insert own watch later" ON watch_later;
            CREATE POLICY "Users can insert own watch later"
                ON watch_later FOR INSERT
                WITH CHECK (auth.uid() = user_id);

            DROP POLICY IF EXISTS "Users can delete own watch later" ON watch_later;
            CREATE POLICY "Users can delete own watch later"
                ON watch_later FOR DELETE
                USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- ============================================
-- 14. NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
    target TEXT CHECK (target IN ('all', 'admin', 'seller', 'user')) DEFAULT 'user',
    read_by UUID[] DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- 15. ADMIN MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS admin_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_messages_from_user ON admin_messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_to_user ON admin_messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_status ON admin_messages(status);
CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON admin_messages(created_at DESC);

ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_messages_select_policy" ON admin_messages;
CREATE POLICY "admin_messages_select_policy" ON admin_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        ) OR from_user_id = auth.uid() OR to_user_id = auth.uid()
    );

DROP POLICY IF EXISTS "admin_messages_insert_policy" ON admin_messages;
CREATE POLICY "admin_messages_insert_policy" ON admin_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        ) OR from_user_id = auth.uid()
    );

DROP POLICY IF EXISTS "admin_messages_update_policy" ON admin_messages;
CREATE POLICY "admin_messages_update_policy" ON admin_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "admin_messages_delete_policy" ON admin_messages;
CREATE POLICY "admin_messages_delete_policy" ON admin_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- ============================================
-- 16. EMAIL CAMPAIGNS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'admin', 'seller', 'premium')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'scheduled')),
    sent_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON email_campaigns(created_by);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_campaigns_admin_only" ON email_campaigns;
CREATE POLICY "email_campaigns_admin_only" ON email_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- ============================================
-- 17. SUPPORT TICKETS TABLE
-- ============================================

CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START 1234;

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    issue_title TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets_select_policy" ON support_tickets;
CREATE POLICY "support_tickets_select_policy" ON support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        ) OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "support_tickets_insert_policy" ON support_tickets;
CREATE POLICY "support_tickets_insert_policy" ON support_tickets
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "support_tickets_update_policy" ON support_tickets;
CREATE POLICY "support_tickets_update_policy" ON support_tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "support_tickets_delete_policy" ON support_tickets;
CREATE POLICY "support_tickets_delete_policy" ON support_tickets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- ============================================
-- 18. PLATFORM SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    category TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_settings_setting_key ON platform_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_category ON platform_settings(category);
CREATE INDEX IF NOT EXISTS idx_platform_settings_is_enabled ON platform_settings(is_enabled);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings_select_policy" ON platform_settings;
CREATE POLICY "platform_settings_select_policy" ON platform_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "platform_settings_update_policy" ON platform_settings;
CREATE POLICY "platform_settings_update_policy" ON platform_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := '#' || LPAD(NEXTVAL('support_ticket_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_ticket_number ON support_tickets;
CREATE TRIGGER trigger_generate_ticket_number
    BEFORE INSERT ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_ticket_number();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_messages_updated_at ON admin_messages;
CREATE TRIGGER trigger_admin_messages_updated_at
    BEFORE UPDATE ON admin_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER trigger_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER trigger_platform_settings_updated_at
    BEFORE UPDATE ON platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_comment_replies_updated_at ON comment_replies;
CREATE TRIGGER trigger_comment_replies_updated_at
    BEFORE UPDATE ON comment_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comment count function
CREATE OR REPLACE FUNCTION get_product_comment_count(product_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM product_comments
        WHERE product_id = product_uuid
        AND parent_comment_id IS NULL
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- View history function
CREATE OR REPLACE FUNCTION add_view_history(
    p_user_id UUID,
    p_content_type TEXT,
    p_content_id UUID
) RETURNS void AS $$
BEGIN
    INSERT INTO view_history (user_id, content_type, content_id, viewed_at)
    VALUES (p_user_id, p_content_type, p_content_id, NOW())
    ON CONFLICT (user_id, content_type, content_id)
    DO UPDATE SET viewed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Post stats function
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
    
    SELECT COUNT(*) INTO v_likes_count FROM public.public_post_likes WHERE post_id = p_post_id;
    
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

-- Post view increment function
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

-- Comments with stats function
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

-- User management functions
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(user_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.toggle_user_block(target_user_id UUID, block_status BOOLEAN)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles 
    SET is_blocked = block_status 
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FOREIGN KEY CONSTRAINTS FIXES
-- ============================================

-- Notifications foreign keys
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_user_id_fkey' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_user_id_fkey;
    END IF;
    
    ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_sender_id_fkey' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_sender_id_fkey;
    END IF;
    
    ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- Platform settings foreign keys
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'platform_settings_updated_by_fkey' 
        AND table_name = 'platform_settings'
    ) THEN
        ALTER TABLE public.platform_settings DROP CONSTRAINT platform_settings_updated_by_fkey;
    END IF;
    
    ALTER TABLE public.platform_settings
    ADD CONSTRAINT platform_settings_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
END $$;

-- Products foreign keys
DO $$ 
BEGIN
    -- Agar products jadvali mavjud bo'lsa
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'products'
    ) THEN
        -- seller_id ustunini qo'shish (agar mavjud bo'lmasa)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'seller_id'
        ) THEN
            ALTER TABLE public.products ADD COLUMN seller_id UUID;
        END IF;

        -- Foreign key constraint (agar mavjud bo'lmasa)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'products_seller_id_fkey' 
            AND table_name = 'products'
        ) THEN
            ALTER TABLE public.products
            ADD CONSTRAINT products_seller_id_fkey
            FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        ELSE
            -- Agar constraint mavjud bo'lsa, uni yangilash
            ALTER TABLE public.products DROP CONSTRAINT products_seller_id_fkey;
            ALTER TABLE public.products
            ADD CONSTRAINT products_seller_id_fkey
            FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Product likes foreign keys
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_likes'
    ) THEN
        -- user_id ustunini qo'shish (agar mavjud bo'lmasa)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'product_likes' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE public.product_likes ADD COLUMN user_id UUID;
        END IF;

        -- product_id ustunini qo'shish (agar mavjud bo'lmasa)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'product_likes' AND column_name = 'product_id'
        ) THEN
            ALTER TABLE public.product_likes ADD COLUMN product_id UUID;
        END IF;

        -- Foreign key constraints
        ALTER TABLE public.product_likes DROP CONSTRAINT IF EXISTS product_likes_user_id_fkey;
        ALTER TABLE public.product_likes DROP CONSTRAINT IF EXISTS product_likes_profile_id_fkey;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'product_likes_user_id_fkey' 
            AND table_name = 'product_likes'
        ) THEN
            ALTER TABLE public.product_likes
            ADD CONSTRAINT product_likes_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
        
        ALTER TABLE public.product_likes DROP CONSTRAINT IF EXISTS product_likes_product_id_fkey;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'product_likes_product_id_fkey' 
            AND table_name = 'product_likes'
        ) THEN
            ALTER TABLE public.product_likes
            ADD CONSTRAINT product_likes_product_id_fkey
            FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Product comments foreign keys
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_comments'
    ) THEN
        ALTER TABLE public.product_comments DROP CONSTRAINT IF EXISTS product_comments_user_id_fkey;
        
        ALTER TABLE public.product_comments
        ADD CONSTRAINT product_comments_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        ALTER TABLE public.product_comments DROP CONSTRAINT IF EXISTS product_comments_product_id_fkey;
        
        ALTER TABLE public.product_comments
        ADD CONSTRAINT product_comments_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Reels foreign keys
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'reels'
    ) THEN
        -- user_id ustunini qo'shish (agar mavjud bo'lmasa)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'reels' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE public.reels ADD COLUMN user_id UUID;
        END IF;

        -- product_id foreign key
        ALTER TABLE public.reels DROP CONSTRAINT IF EXISTS reels_product_id_fkey;
        ALTER TABLE public.reels
        ADD CONSTRAINT reels_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

        -- user_id foreign key (agar mavjud bo'lmasa)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'reels_user_id_fkey' 
            AND table_name = 'reels'
        ) THEN
            ALTER TABLE public.reels
            ADD CONSTRAINT reels_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Favorites foreign keys
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'favorites'
    ) THEN
        -- user_id ustunini qo'shish (agar mavjud bo'lmasa)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE public.favorites ADD COLUMN user_id UUID;
        END IF;

        -- product_id ustunini qo'shish (agar mavjud bo'lmasa)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'product_id'
        ) THEN
            ALTER TABLE public.favorites ADD COLUMN product_id UUID;
        END IF;

        -- Foreign key constraints
        ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'favorites_user_id_fkey' 
            AND table_name = 'favorites'
        ) THEN
            ALTER TABLE public.favorites
            ADD CONSTRAINT favorites_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
        
        ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_product_id_fkey;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'favorites_product_id_fkey' 
            AND table_name = 'favorites'
        ) THEN
            ALTER TABLE public.favorites
            ADD CONSTRAINT favorites_product_id_fkey
            FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Cart foreign keys
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'cart'
    ) THEN
        -- user_id ustunini qo'shish (agar mavjud bo'lmasa)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'cart' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE public.cart ADD COLUMN user_id UUID;
        END IF;

        -- product_id ustunini qo'shish (agar mavjud bo'lmasa)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'cart' AND column_name = 'product_id'
        ) THEN
            ALTER TABLE public.cart ADD COLUMN product_id UUID;
        END IF;

        -- Foreign key constraints
        ALTER TABLE public.cart DROP CONSTRAINT IF EXISTS cart_user_id_fkey;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'cart_user_id_fkey' 
            AND table_name = 'cart'
        ) THEN
            ALTER TABLE public.cart
            ADD CONSTRAINT cart_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
        
        ALTER TABLE public.cart DROP CONSTRAINT IF EXISTS cart_product_id_fkey;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'cart_product_id_fkey' 
            AND table_name = 'cart'
        ) THEN
            ALTER TABLE public.cart
            ADD CONSTRAINT cart_product_id_fkey
            FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- ============================================
-- PERFORMANCE OPTIMIZATION (INDEXES)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.public_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.public_posts(author_id);

-- Products indexes (with column existence checks)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'products'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'seller_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'category'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
            CREATE INDEX IF NOT EXISTS idx_products_category_created ON public.products(category, created_at DESC);
        END IF;
    END IF;
END $$;
-- Indexes for post-related tables (with existence checks)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_post_comments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_comments' AND column_name = 'post_id') THEN
            CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.public_post_comments(post_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_comments' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.public_post_comments(user_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_comments' AND column_name = 'post_id') 
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_comments' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_comments_post_created ON public.public_post_comments(post_id, created_at DESC);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_post_likes') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_likes' AND column_name = 'post_id')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_likes' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_post_likes_lookup ON public.public_post_likes(post_id, user_id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_post_dislikes') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_dislikes' AND column_name = 'post_id')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_dislikes' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_post_dislikes_lookup ON public.public_post_dislikes(post_id, user_id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_post_saved') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_saved' AND column_name = 'post_id')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_saved' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_post_saved_lookup ON public.public_post_saved(post_id, user_id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_post_comment_likes') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_comment_likes' AND column_name = 'comment_id')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_comment_likes' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_comment_likes_lookup ON public.public_post_comment_likes(comment_id, user_id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_post_views') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_views' AND column_name = 'post_id')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_post_views' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_post_views_lookup ON public.public_post_views(post_id, user_id);
        END IF;
    END IF;
END $$;

-- Conditional indexes for product-related tables
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_likes'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_product_likes_product_user ON public.product_likes(product_id, user_id);
        CREATE INDEX IF NOT EXISTS idx_product_likes_product ON public.product_likes(product_id);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'favorites'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_favorites_user_product ON public.favorites(user_id, product_id);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'cart'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_cart_user_product ON public.cart(user_id, product_id);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_media'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_product_media_product_type ON public.product_media(product_id, type);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_following ON public.follows(follower_id, following_id);

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value, category, description, is_enabled)
VALUES
    -- Asosiy Sozlamalar
    ('site_active', '{"enabled": true}'::jsonb, 'asosiy_sozlamalar', 'Sayt faol yoki yoq', true),
    ('maintenance_mode', '{"enabled": false}'::jsonb, 'asosiy_sozlamalar', 'Texnik ishlar rejimi', false),
    ('new_registrations', '{"enabled": true}'::jsonb, 'asosiy_sozlamalar', 'Yangi royxatlarni qabul qilish', true),
    ('new_user_registration', '{"enabled": true}'::jsonb, 'asosiy_sozlamalar', 'Yangi foydalanuvchilar ro''yxatdan o''tishiga ruxsat berish', true),
    
    -- Xavfsizlik
    ('require_2fa', '{"enabled": false}'::jsonb, 'xavfsizlik', 'Barcha adminlar uchun 2FA majburiy', false),
    ('email_verification', '{"enabled": true}'::jsonb, 'xavfsizlik', 'Royxatdan otishda email tasdiqlash', true),
    ('ip_blocking', '{"enabled": true}'::jsonb, 'xavfsizlik', 'Shubhali IP manzillarni bloklash', true),
    
    -- Mahsulotlar
    ('auto_moderation', '{"enabled": true}'::jsonb, 'mahsulotlar', 'Yangi mahsulotlarni avtomatik tekshirish', true),
    ('video_reels', '{"enabled": true}'::jsonb, 'mahsulotlar', 'Foydalanuvchilar video yuklashi mumkin', true),
    ('premium_features', '{"enabled": false}'::jsonb, 'mahsulotlar', 'Premium xususiyatlarni yoqish', false),
    ('product_moderation', '{"enabled": false}'::jsonb, 'mahsulotlar', 'Mahsulotlar e''lon qilinishidan oldin admin tasdig''idan o''tishi kerak', false)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    is_enabled = EXCLUDED.is_enabled;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION increment_post_views(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_product_views(UUID) TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.public_post_likes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.public_post_dislikes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.public_post_saved TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.public_post_comment_likes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.public_post_views TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.comment_likes TO anon, authenticated, service_role;

-- ============================================
-- ORDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    notes TEXT,
    total_amount DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'UZS',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'UZS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own orders" ON orders;
CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own order items" ON order_items;
CREATE POLICY "Users can create own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Auto-generate order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'ORD-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_order_number ON orders;
CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- Auto-update updated_at for orders
DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 16. MESSAGING SYSTEM TABLES
-- ============================================

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
    name TEXT,
    avatar_url TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Conversation Participants Table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    muted_until TIMESTAMPTZ,
    UNIQUE(conversation_id, user_id, left_at)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_active ON conversation_participants(conversation_id, user_id) WHERE left_at IS NULL;

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'voice', 'file')),
    media_url TEXT,
    media_thumbnail_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    duration INTEGER,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_active ON messages(conversation_id, created_at DESC) WHERE deleted_at IS NULL;

-- Message Reads Table (Read Receipts)
CREATE TABLE IF NOT EXISTS message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);

-- Typing Indicators Table
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_typing BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_active ON typing_indicators(conversation_id, updated_at DESC) WHERE is_typing = true;

-- Message Reactions Table
DO $$
BEGIN
    -- Check if messages table exists before creating message_reactions
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'message_reactions'
        ) THEN
            CREATE TABLE message_reactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                emoji TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(message_id, user_id, emoji)
            );
        END IF;
    END IF;
END $$;

-- Indexes for message_reactions (only if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'message_reactions'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'message_reactions' AND column_name = 'message_id'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'message_reactions' AND column_name = 'emoji'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id, emoji);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'message_reactions' AND column_name = 'user_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'message_reactions' 
            AND column_name = 'message_id'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'message_reactions' 
            AND column_name = 'user_id'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_message_reactions_message_user ON message_reactions(message_id, user_id);
        END IF;
    END IF;

    -- Index for messages pinned (only if table and column exist)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_pinned'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages(conversation_id, is_pinned, created_at DESC) WHERE is_pinned = true;
    END IF;
END $$;

-- Enable RLS for all messaging tables (with existence checks)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversation_participants') THEN
        ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'message_reads') THEN
        ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'typing_indicators') THEN
        ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'message_reactions') THEN
        ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Security definer function to check if user is a participant (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conv_id
        AND user_id = check_user_id
        AND left_at IS NULL
    );
END;
$$;

-- Security definer function to check if user is an admin participant
CREATE OR REPLACE FUNCTION is_conversation_admin(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conv_id
        AND user_id = check_user_id
        AND role = 'admin'
        AND left_at IS NULL
    );
END;
$$;

-- RLS Policies for Conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (
        conversations.created_by = auth.uid() OR
        is_conversation_participant(conversations.id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
CREATE POLICY "Users can update their conversations" ON conversations
    FOR UPDATE USING (
        created_by = auth.uid() OR
        is_conversation_admin(conversations.id, auth.uid())
    );

-- RLS Policies for Conversation Participants
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
    FOR SELECT USING (
        is_conversation_participant(conversation_participants.conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can add participants to their conversations" ON conversation_participants;
CREATE POLICY "Users can add participants to their conversations" ON conversation_participants
    FOR INSERT WITH CHECK (
        is_conversation_admin(conversation_participants.conversation_id, auth.uid()) OR
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_participants.conversation_id
            AND c.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own participation" ON conversation_participants;
CREATE POLICY "Users can update their own participation" ON conversation_participants
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for Messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        is_conversation_participant(messages.conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        is_conversation_participant(messages.conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
CREATE POLICY "Users can delete their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- RLS Policies for Message Reads
DROP POLICY IF EXISTS "Users can view reads for messages in their conversations" ON message_reads;
CREATE POLICY "Users can view reads for messages in their conversations" ON message_reads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_reads.message_id
            AND is_conversation_participant(m.conversation_id, auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can mark messages as read" ON message_reads;
CREATE POLICY "Users can mark messages as read" ON message_reads
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_reads.message_id
            AND is_conversation_participant(m.conversation_id, auth.uid())
        )
    );

-- RLS Policies for Typing Indicators
DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON typing_indicators;
CREATE POLICY "Users can view typing indicators in their conversations" ON typing_indicators
    FOR SELECT USING (
        is_conversation_participant(typing_indicators.conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can set their typing status" ON typing_indicators;
CREATE POLICY "Users can set their typing status" ON typing_indicators
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for Message Reactions (only if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'message_reactions'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'message_reactions' AND column_name = 'user_id'
    ) THEN
        DROP POLICY IF EXISTS "Users can view reactions in their conversations" ON message_reactions;
        CREATE POLICY "Users can view reactions in their conversations" ON message_reactions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM messages m
                    WHERE m.id = message_reactions.message_id
                    AND is_conversation_participant(m.conversation_id, auth.uid())
                )
            );

        DROP POLICY IF EXISTS "Users can add reactions to messages" ON message_reactions;
        CREATE POLICY "Users can add reactions to messages" ON message_reactions
            FOR INSERT WITH CHECK (
                user_id = auth.uid() AND
                EXISTS (
                    SELECT 1 FROM messages m
                    WHERE m.id = message_reactions.message_id
                    AND is_conversation_participant(m.conversation_id, auth.uid())
                )
            );

        DROP POLICY IF EXISTS "Users can remove their own reactions" ON message_reactions;
        CREATE POLICY "Users can remove their own reactions" ON message_reactions
            FOR DELETE USING (user_id = auth.uid());
    END IF;
END $$;

-- Function to update conversation's last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NULL)
    EXECUTE FUNCTION update_conversation_last_message();

-- Function to auto-update updated_at for conversations
DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-update updated_at for messages
DROP TRIGGER IF EXISTS trigger_messages_updated_at ON messages;
CREATE TRIGGER trigger_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE view_history IS 'Tracks user viewing history for reels, posts, and products';
COMMENT ON FUNCTION add_view_history IS 'Adds or updates a view history entry, updating timestamp if already exists';
COMMENT ON TABLE watch_later IS 'User saved videos for later viewing';
COMMENT ON TABLE orders IS 'Customer orders for products';
COMMENT ON TABLE order_items IS 'Items in each order';
COMMENT ON TABLE conversations IS 'Chat conversations (direct or group)';
COMMENT ON TABLE conversation_participants IS 'Users participating in conversations';
COMMENT ON TABLE messages IS 'Messages in conversations';
COMMENT ON TABLE message_reads IS 'Read receipts for messages';
COMMENT ON TABLE typing_indicators IS 'Real-time typing indicators';
COMMENT ON TABLE message_reactions IS 'Emoji reactions on messages';

-- ============================================
-- ADDITIONAL CHAT OPTIMIZATION INDEXES
-- ============================================

-- Message search optimization (for content search) - conditional
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'content'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'deleted_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_messages_content_search ON messages USING gin(to_tsvector('simple', content)) WHERE deleted_at IS NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'conversation_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'sender_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'deleted_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender_time ON messages(conversation_id, sender_id, created_at DESC) WHERE deleted_at IS NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'message_reads'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'message_reads' AND column_name = 'message_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'message_reads' AND column_name = 'user_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_message_reads_message_user ON message_reads(message_id, user_id);
    END IF;
END $$;

-- Conversation last message optimization (if not already exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversations'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'last_message_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_seen'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen DESC) WHERE last_seen IS NOT NULL;
    END IF;
END $$;

-- ============================================
-- STORAGE BUCKET SETUP NOTE
-- ============================================
-- IMPORTANT: Create the following storage bucket in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket named "chat-media"
-- 3. Set it to PUBLIC (or configure RLS policies for authenticated users)
-- 4. This bucket will store chat media files (images, videos, voice messages, files)
--
-- Bucket policies should allow:
-- - Authenticated users to upload files
-- - Authenticated users to read files
-- - File size limits: 10MB for images, 500MB for videos, 50MB for voice, 100MB for files
-- ============================================

-- ============================================
-- COMPLETE!
-- ============================================
-- Bu fayl to'liq database schema ni o'z ichiga oladi
-- Barcha jadvallar, indexlar, RLS policies va funksiyalar yaratiladi
-- Supabase SQL Editor'da ishga tushiring
-- ============================================
