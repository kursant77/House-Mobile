-- ============================================
-- HOUSE MOBILE - COMPLETE DATABASE SCHEMA
-- ============================================
-- Bu fayl to'liq mukammal database schema ni o'z ichiga oladi
-- Supabase'da ishlatish uchun mo'ljallangan

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
END $$;

-- Username unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON profiles(LOWER(username)) WHERE username IS NOT NULL;

-- ============================================
-- 2. COMMENT REPLIES TABLE - Reply funksiyasi uchun
-- ============================================

CREATE TABLE IF NOT EXISTS comment_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES product_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reply_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for comment_replies
CREATE INDEX IF NOT EXISTS idx_comment_replies_comment_id ON comment_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_user_id ON comment_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_created_at ON comment_replies(created_at DESC);

-- ============================================
-- 3. PRODUCT COMMENTS TABLE - Comment count real-time uchun
-- ============================================

-- Product comments jadvalini yangilash (agar mavjud bo'lsa)
DO $$
BEGIN
    -- Parent comment maydonini qo'shish (replies uchun)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_comments' AND column_name = 'parent_comment_id'
    ) THEN
        ALTER TABLE product_comments ADD COLUMN parent_comment_id UUID REFERENCES product_comments(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_product_comments_parent ON product_comments(parent_comment_id);
    END IF;

    -- Product comments jadvalini yaratish (agar mavjud bo'lmasa)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_comments'
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

        CREATE INDEX IF NOT EXISTS idx_product_comments_product_id ON product_comments(product_id);
        CREATE INDEX IF NOT EXISTS idx_product_comments_user_id ON product_comments(user_id);
        CREATE INDEX IF NOT EXISTS idx_product_comments_parent ON product_comments(parent_comment_id);
        CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON product_comments(created_at DESC);
    END IF;
END $$;

-- Comment count uchun view yoki function
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

-- Real-time comment count update trigger
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Agar yangi comment qo'shilsa
    IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NULL THEN
        -- Product jadvalida comment_count maydoni bo'lsa, yangilash
        -- Agar yo'q bo'lsa, bu yerda hech narsa qilmaymiz
        RETURN NEW;
    END IF;
    
    -- Agar comment o'chirilsa
    IF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NULL THEN
        RETURN OLD;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger (comment count maydoni bo'lsa ishlatiladi)
-- DROP TRIGGER IF EXISTS trigger_update_comment_count ON product_comments;
-- CREATE TRIGGER trigger_update_comment_count
--     AFTER INSERT OR DELETE ON product_comments
--     FOR EACH ROW
--     EXECUTE FUNCTION update_comment_count();

-- ============================================
-- 4. ADMIN MESSAGES TABLE
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_messages_from_user ON admin_messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_to_user ON admin_messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_status ON admin_messages(status);
CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON admin_messages(created_at DESC);

-- ============================================
-- 5. EMAIL CAMPAIGNS TABLE
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON email_campaigns(created_by);

-- ============================================
-- 6. SUPPORT TICKETS TABLE
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);

-- ============================================
-- 7. PLATFORM SETTINGS TABLE
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_platform_settings_setting_key ON platform_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_category ON platform_settings(category);
CREATE INDEX IF NOT EXISTS idx_platform_settings_is_enabled ON platform_settings(is_enabled);

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

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admin_messages_select_policy" ON admin_messages;
DROP POLICY IF EXISTS "admin_messages_insert_policy" ON admin_messages;
DROP POLICY IF EXISTS "admin_messages_update_policy" ON admin_messages;
DROP POLICY IF EXISTS "admin_messages_delete_policy" ON admin_messages;
DROP POLICY IF EXISTS "email_campaigns_admin_only" ON email_campaigns;
DROP POLICY IF EXISTS "support_tickets_select_policy" ON support_tickets;
DROP POLICY IF EXISTS "support_tickets_insert_policy" ON support_tickets;
DROP POLICY IF EXISTS "support_tickets_update_policy" ON support_tickets;
DROP POLICY IF EXISTS "support_tickets_delete_policy" ON support_tickets;
DROP POLICY IF EXISTS "platform_settings_select_policy" ON platform_settings;
DROP POLICY IF EXISTS "platform_settings_update_policy" ON platform_settings;
DROP POLICY IF EXISTS "comment_replies_select_policy" ON comment_replies;
DROP POLICY IF EXISTS "comment_replies_insert_policy" ON comment_replies;
DROP POLICY IF EXISTS "comment_replies_update_policy" ON comment_replies;
DROP POLICY IF EXISTS "comment_replies_delete_policy" ON comment_replies;

-- Admin Messages Policies
CREATE POLICY "admin_messages_select_policy" ON admin_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        ) OR from_user_id = auth.uid() OR to_user_id = auth.uid()
    );

CREATE POLICY "admin_messages_insert_policy" ON admin_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        ) OR from_user_id = auth.uid()
    );

CREATE POLICY "admin_messages_update_policy" ON admin_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "admin_messages_delete_policy" ON admin_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Email Campaigns Policies (Admin Only)
CREATE POLICY "email_campaigns_admin_only" ON email_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Support Tickets Policies
CREATE POLICY "support_tickets_select_policy" ON support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        ) OR user_id = auth.uid()
    );

CREATE POLICY "support_tickets_insert_policy" ON support_tickets
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "support_tickets_update_policy" ON support_tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "support_tickets_delete_policy" ON support_tickets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Platform Settings Policies (Admin Only)
CREATE POLICY "platform_settings_select_policy" ON platform_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "platform_settings_update_policy" ON platform_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Comment Replies Policies
CREATE POLICY "comment_replies_select_policy" ON comment_replies
    FOR SELECT USING (true);

CREATE POLICY "comment_replies_insert_policy" ON comment_replies
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "comment_replies_update_policy" ON comment_replies
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "comment_replies_delete_policy" ON comment_replies
    FOR DELETE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

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
    
    -- Xavfsizlik
    ('require_2fa', '{"enabled": false}'::jsonb, 'xavfsizlik', 'Barcha adminlar uchun 2FA majburiy', false),
    ('email_verification', '{"enabled": true}'::jsonb, 'xavfsizlik', 'Royxatdan otishda email tasdiqlash', true),
    ('ip_blocking', '{"enabled": true}'::jsonb, 'xavfsizlik', 'Shubhali IP manzillarni bloklash', true),
    
    -- Mahsulotlar
    ('auto_moderation', '{"enabled": true}'::jsonb, 'mahsulotlar', 'Yangi mahsulotlarni avtomatik tekshirish', true),
    ('video_reels', '{"enabled": true}'::jsonb, 'mahsulotlar', 'Foydalanuvchilar video yuklashi mumkin', true),
    ('premium_features', '{"enabled": false}'::jsonb, 'mahsulotlar', 'Premium xususiyatlarni yoqish', false)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    is_enabled = EXCLUDED.is_enabled;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Jadval mavjudligini tekshirish
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') 
        THEN 'username column exists'
        ELSE 'username column missing'
    END as username_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') 
        THEN 'phone column exists'
        ELSE 'phone column missing'
    END as phone_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'admin_messages', 'email_campaigns', 'support_tickets', 'platform_settings', 'comment_replies', 'product_comments')
ORDER BY table_name;

-- Jadval sonlarini ko'rish
SELECT 
    'profiles' as table_name, 
    COUNT(*) as row_count 
FROM profiles
UNION ALL
SELECT 
    'admin_messages', 
    COUNT(*) 
FROM admin_messages
UNION ALL
SELECT 
    'email_campaigns', 
    COUNT(*) 
FROM email_campaigns
UNION ALL
SELECT 
    'support_tickets', 
    COUNT(*) 
FROM support_tickets
UNION ALL
SELECT 
    'platform_settings', 
    COUNT(*) 
FROM platform_settings
UNION ALL
SELECT 
    'comment_replies', 
    COUNT(*) 
FROM comment_replies;

-- ============================================
-- COMPLETE!
-- ============================================
