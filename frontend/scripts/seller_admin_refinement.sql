-- ============================================
-- HOUSE MOBILE - SELLER & ADMIN FINAL FIX (RECURSION FREE)
-- ============================================

-- 1. YORDAMCHI FUNKSIYA (REKURSIYANI OLDINI OLISH UCHUN)
-- Bu funksiya SECURITY DEFINER bilan ishlaydi, ya'ni RLS talablaridan aylanib o'tib 
-- rolni tekshiradi. Bu 500 errorlarini bartaraf qiladi.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ROLLARNI SOZLASH
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND constraint_name = 'profiles_role_check'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    END IF;

    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'blogger', 'super_admin', 'admin', 'seller'));

    -- Ustunlarni tekshirish va qo'shish
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_blocked') THEN
        ALTER TABLE public.profiles ADD COLUMN is_blocked BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_professional') THEN
        ALTER TABLE public.profiles ADD COLUMN is_professional BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. RLS POLICIES (TO'G'RILANGAN)

-- PROFILES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.check_is_admin());

-- PRODUCTS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
        CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Sellers can manage their own products" ON public.products;
        CREATE POLICY "Sellers can manage their own products"
        ON public.products FOR ALL
        USING (auth.uid() = seller_id OR public.check_is_admin());
        
        DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
        CREATE POLICY "Admins can manage all products" ON public.products FOR ALL USING (public.check_is_admin());
    END IF;
END $$;

-- REELS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reels') THEN
        DROP POLICY IF EXISTS "Reels are viewable by everyone" ON public.reels;
        CREATE POLICY "Reels are viewable by everyone" ON public.reels FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Users can manage own reels" ON public.reels;
        CREATE POLICY "Users can manage own reels" ON public.reels FOR ALL
        USING (auth.uid() = user_id OR public.check_is_admin());
    END IF;
END $$;

-- POSTS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'public_posts') THEN
        DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.public_posts;
        CREATE POLICY "Public posts are viewable by everyone" ON public.public_posts FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Authors can manage posts" ON public.public_posts;
        CREATE POLICY "Authors can manage posts" ON public.public_posts FOR ALL
        USING (auth.uid() = author_id OR public.check_is_admin());
    END IF;
END $$;

-- 4. ADMIN RPC FUNKSIYALARI (YANGILANGAN)

CREATE OR REPLACE FUNCTION public.toggle_user_block(
    target_user_id UUID,
    block_status BOOLEAN,
    reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.check_is_admin() THEN
        RAISE EXCEPTION 'Faqat administratorlar foydalanuvchini bloklay oladi';
    END IF;

    UPDATE public.profiles
    SET 
        is_blocked = block_status,
        blocked_reason = CASE WHEN block_status THEN reason ELSE NULL END,
        blocked_at = CASE WHEN block_status THEN NOW() ELSE NULL END,
        blocked_by = CASE WHEN block_status THEN auth.uid() ELSE NULL END
    WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_by_admin(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT (SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Faqat super-administratorlar foydalanuvchini o''chira oladi';
    END IF;

    DELETE FROM public.profiles WHERE id = user_id;
    DELETE FROM auth.users WHERE id = user_id;
END;
$$;

COMMENT ON FUNCTION public.check_is_admin() IS 'Admin rolni xavfsiz tekshirish uchun (RLS rekurisiyasiz)';
