-- ============================================
-- FIX FOREIGN KEY CONSTRAINTS - COMPREHENSIVE
-- ============================================
-- Bu migration barcha foreign key constraintlarni
-- to'g'ri cascade strategiya bilan yangilaydi

-- ============================================
-- 1. NOTIFICATIONS TABLE
-- ============================================
DO $$ 
BEGIN
    -- user_id constraint
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
    
    -- sender_id constraint (agar mavjud bo'lsa)
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

-- ============================================
-- 2. PLATFORM_SETTINGS TABLE
-- ============================================
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

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================
DO $$ 
BEGIN
    -- products_seller_id_fkey
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_seller_id_fkey' 
        AND table_name = 'products'
    ) THEN
        ALTER TABLE public.products DROP CONSTRAINT products_seller_id_fkey;
        ALTER TABLE public.products
        ADD CONSTRAINT products_seller_id_fkey
        FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 4. PRODUCT_LIKES TABLE (agar mavjud bo'lsa)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_likes'
    ) THEN
        -- user_id constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%product_likes%user%'
            AND table_name = 'product_likes'
        ) THEN
            -- Eski constraintni o'chirish
            ALTER TABLE public.product_likes DROP CONSTRAINT IF EXISTS product_likes_user_id_fkey;
            ALTER TABLE public.product_likes DROP CONSTRAINT IF EXISTS product_likes_profile_id_fkey;
        END IF;
        
        ALTER TABLE public.product_likes
        ADD CONSTRAINT product_likes_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        -- product_id constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%product_likes%product%'
            AND table_name = 'product_likes'
        ) THEN
            ALTER TABLE public.product_likes DROP CONSTRAINT IF EXISTS product_likes_product_id_fkey;
        END IF;
        
        ALTER TABLE public.product_likes
        ADD CONSTRAINT product_likes_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 5. PRODUCT_COMMENTS TABLE
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_comments'
    ) THEN
        -- user_id
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'product_comments'
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%user%'
        ) THEN
            ALTER TABLE public.product_comments DROP CONSTRAINT IF EXISTS product_comments_user_id_fkey;
        END IF;
        
        ALTER TABLE public.product_comments
        ADD CONSTRAINT product_comments_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        -- product_id
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'product_comments'
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%product%'
        ) THEN
            ALTER TABLE public.product_comments DROP CONSTRAINT IF EXISTS product_comments_product_id_fkey;
        END IF;
        
        ALTER TABLE public.product_comments
        ADD CONSTRAINT product_comments_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 6. REELS TABLE (products dan kelib chiqadi, lekin qo'shimcha check)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'reels'
    ) THEN
        -- product_id constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%reels%product%'
            AND table_name = 'reels'
        ) THEN
            ALTER TABLE public.reels DROP CONSTRAINT IF EXISTS reels_product_id_fkey;
        END IF;
        
        ALTER TABLE public.reels
        ADD CONSTRAINT reels_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 7. FAVORITES TABLE (agar mavjud bo'lsa)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'favorites'
    ) THEN
        -- user_id
        ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
        ALTER TABLE public.favorites
        ADD CONSTRAINT favorites_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        -- product_id
        ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_product_id_fkey;
        ALTER TABLE public.favorites
        ADD CONSTRAINT favorites_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 8. CART TABLE (agar mavjud bo'lsa)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'cart'
    ) THEN
        -- user_id
        ALTER TABLE public.cart DROP CONSTRAINT IF EXISTS cart_user_id_fkey;
        ALTER TABLE public.cart
        ADD CONSTRAINT cart_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        -- product_id
        ALTER TABLE public.cart DROP CONSTRAINT IF EXISTS cart_product_id_fkey;
        ALTER TABLE public.cart
        ADD CONSTRAINT cart_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 9. VERIFICATION QUERY
-- ============================================
-- Barcha foreign key constraintlarni ko'rish
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule AS on_delete_action
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN (
    'notifications', 
    'platform_settings', 
    'products', 
    'product_likes',
    'product_comments',
    'reels',
    'favorites',
    'cart',
    'admin_messages', 
    'support_tickets'
)
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- COMPLETE!
-- ============================================
