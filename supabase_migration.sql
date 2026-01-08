-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS telegram TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT;

-- 2. Ensure CASCADE DELETE on foreign keys
-- Note: Replace these if the constraints already exist with different names
-- Products cascade delete
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_seller_id_fkey') THEN
        ALTER TABLE public.products DROP CONSTRAINT products_seller_id_fkey;
    END IF;
    ALTER TABLE public.products 
    ADD CONSTRAINT products_seller_id_fkey 
    FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
END $$;

-- Reels cascade delete
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'reels_author_id_fkey') THEN
        ALTER TABLE public.reels DROP CONSTRAINT reels_author_id_fkey;
    END IF;
    -- Note: Adjust reels table name and author column if different
    -- ALTER TABLE public.reels 
    -- ADD CONSTRAINT reels_author_id_fkey 
    -- FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
END $$;

-- 3. Create a function to delete users from both public.profiles and auth.users
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(user_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to toggle user block status
CREATE OR REPLACE FUNCTION public.toggle_user_block(target_user_id UUID, block_status BOOLEAN)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles 
    SET is_blocked = block_status 
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create/Update notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    target TEXT DEFAULT 'all',
    user_id UUID REFERENCES auth.users(id), -- Specific user target
    sender_id UUID REFERENCES auth.users(id),
    read_by UUID[] DEFAULT '{}' -- Array of user IDs who read it
);

-- Ensure user_id column exists if table was already there
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 6. Create platform_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    setting_value JSONB DEFAULT '{"enabled": true}'::jsonb,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- 7. Initial Platform Settings (seed)
INSERT INTO public.platform_settings (setting_key, category, is_enabled, description)
VALUES 
('new_user_registration', 'asosiy_sozlamalar', true, 'Yangi foydalanuvchilar ro''yxatdan o''tishiga ruxsat berish'),
('email_verification', 'xavfsizlik', false, 'Ro''yxatdan o''tgandan so''ng emailni tasdiqlashni talab qilish'),
('product_moderation', 'mahsulotlar', false, 'Mahsulotlar e''lon qilinishidan oldin admin tasdig''idan o''tishi kerak')
ON CONFLICT (setting_key) DO NOTHING;

-- 8. Enable RLS and add policies
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
DROP POLICY IF EXISTS "Allow users to read their own notifications or global ones" ON public.notifications;
CREATE POLICY "Allow users to read their own notifications or global ones" 
ON public.notifications FOR SELECT 
USING (
    target = 'all' 
    OR user_id = auth.uid() 
    OR (target = 'admin' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

DROP POLICY IF EXISTS "Allow admins to insert notifications" ON public.notifications;
CREATE POLICY "Allow admins to insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- Settings Policies
DROP POLICY IF EXISTS "Allow all users to read settings" ON public.platform_settings;
CREATE POLICY "Allow all users to read settings" 
ON public.platform_settings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow admins to update settings" ON public.platform_settings;
CREATE POLICY "Allow admins to update settings" 
ON public.platform_settings FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Allow admins to insert settings" ON public.platform_settings;
CREATE POLICY "Allow admins to insert settings" 
ON public.platform_settings FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- 9. Fix Notifications RLS to allow users to send messages/likes
DROP POLICY IF EXISTS "Allow admins to insert notifications" ON public.notifications;

CREATE POLICY "Allow users to insert own notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (
    auth.uid() = sender_id
);

