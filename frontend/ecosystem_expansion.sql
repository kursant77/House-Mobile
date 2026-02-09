-- ============================================
-- HOUSE MOBILE - ECOSYSTEM EXPANSION MIGRATION
-- ============================================
-- New tables for: Telegram Integration, Referrals, Badges, Stories,
-- Feature Flags, Push Notifications, and Content Moderation
-- ============================================

-- ============================================
-- 1. TELEGRAM USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS telegram_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    telegram_chat_id BIGINT NOT NULL UNIQUE,
    telegram_username TEXT,
    first_name TEXT,
    is_blocked BOOLEAN DEFAULT false,
    notification_settings JSONB DEFAULT '{"orders": true, "marketing": true, "security": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON telegram_users(telegram_chat_id);

ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own telegram connection
DROP POLICY IF EXISTS "Users can view own telegram" ON telegram_users;
CREATE POLICY "Users can view own telegram" ON telegram_users
    FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own telegram connection
DROP POLICY IF EXISTS "Users can manage own telegram" ON telegram_users;
CREATE POLICY "Users can manage own telegram" ON telegram_users
    FOR ALL USING (auth.uid() = user_id);

-- Admins can view all telegram users
DROP POLICY IF EXISTS "Admins can view all telegram users" ON telegram_users;
CREATE POLICY "Admins can view all telegram users" ON telegram_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Service role can insert (for bot)
DROP POLICY IF EXISTS "Service can insert telegram users" ON telegram_users;
CREATE POLICY "Service can insert telegram users" ON telegram_users
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 2. REFERRALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL UNIQUE,
    referral_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'completed')),
    reward_amount DECIMAL(12,2) DEFAULT 0,
    reward_currency TEXT DEFAULT 'UZS',
    first_order_id UUID REFERENCES orders(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (where they are the referrer)
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id);

-- Users can create referrals for themselves
DROP POLICY IF EXISTS "Users can create own referrals" ON referrals;
CREATE POLICY "Users can create own referrals" ON referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Admins can view and manage all referrals
DROP POLICY IF EXISTS "Admins can manage all referrals" ON referrals;
CREATE POLICY "Admins can manage all referrals" ON referrals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================
-- 3. REFERRAL SETTINGS TABLE (Admin configurable)
-- ============================================

CREATE TABLE IF NOT EXISTS referral_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_type TEXT DEFAULT 'fixed' CHECK (reward_type IN ('fixed', 'percentage')),
    reward_value DECIMAL(12,2) DEFAULT 10000, -- 10,000 UZS or 5%
    min_purchase_amount DECIMAL(12,2) DEFAULT 0,
    max_rewards_per_user INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view referral settings" ON referral_settings;
CREATE POLICY "Anyone can view referral settings" ON referral_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage referral settings" ON referral_settings;
CREATE POLICY "Admins can manage referral settings" ON referral_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Insert default settings
INSERT INTO referral_settings (reward_type, reward_value, min_purchase_amount, is_active)
VALUES ('fixed', 10000, 50000, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. BADGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_uz TEXT,
    description TEXT,
    description_uz TEXT,
    icon_url TEXT,
    color TEXT DEFAULT '#FFD700',
    criteria JSONB, -- e.g., {"type": "order_count", "value": 10}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schema Reconciliation: Ensure UZ translation columns exist for badges
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'name_uz') THEN
        ALTER TABLE badges ADD COLUMN name_uz TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'description_uz') THEN
        ALTER TABLE badges ADD COLUMN description_uz TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_badges_active ON badges(is_active);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active badges" ON badges;
CREATE POLICY "Anyone can view active badges" ON badges
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage badges" ON badges;
CREATE POLICY "Admins can manage badges" ON badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Default badges
INSERT INTO badges (name, name_uz, description, icon_url, color, criteria) VALUES
    ('Early Adopter', 'Ilk Foydalanuvchi', 'One of the first users on the platform', '🌟', '#FFD700', '{"type": "account_age_days", "value": 30}'),
    ('Expert Buyer', 'Ekspert Xaridor', 'Completed 10+ purchases', '🛒', '#4CAF50', '{"type": "order_count", "value": 10}'),
    ('Top Reviewer', 'Top Sharhlovchi', 'Left 5+ reviews', '⭐', '#2196F3', '{"type": "review_count", "value": 5}'),
    ('Power Seller', 'Kuchli Sotuvchi', 'Sold 50+ items', '💎', '#9C27B0', '{"type": "sales_count", "value": 50}'),
    ('Verified', 'Tasdiqlangan', 'Verified account', '✓', '#1DA1F2', '{"type": "manual", "value": null}')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. USER BADGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    awarded_by UUID REFERENCES profiles(id), -- NULL = auto-assigned
    UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view user badges" ON user_badges;
CREATE POLICY "Anyone can view user badges" ON user_badges
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage user badges" ON user_badges;
CREATE POLICY "Admins can manage user badges" ON user_badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================
-- 6. STORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT CHECK (media_type IN ('image', 'video')),
    thumbnail_url TEXT,
    caption TEXT,
    link_url TEXT,
    link_product_id UUID REFERENCES products(id),
    view_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(is_active, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_featured ON stories(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active stories" ON stories;
CREATE POLICY "Anyone can view active stories" ON stories
    FOR SELECT USING (is_active = true AND expires_at > NOW());

DROP POLICY IF EXISTS "Users can create own stories" ON stories;
CREATE POLICY "Users can create own stories" ON stories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own stories" ON stories;
CREATE POLICY "Users can delete own stories" ON stories
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all stories" ON stories;
CREATE POLICY "Admins can manage all stories" ON stories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

-- ============================================
-- 7. STORY VIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS story_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer ON story_views(viewer_id);

ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view story views" ON story_views;
CREATE POLICY "Users can view story views" ON story_views
    FOR SELECT USING (
        auth.uid() = viewer_id OR
        EXISTS (
            SELECT 1 FROM stories
            WHERE stories.id = story_views.story_id AND stories.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert story views" ON story_views;
CREATE POLICY "Users can insert story views" ON story_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- ============================================
-- 8. FEATURE FLAGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_uz TEXT,
    description TEXT,
    is_enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- Schema Reconciliation: Ensure name_uz column exists for feature_flags
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'name_uz') THEN
        ALTER TABLE feature_flags ADD COLUMN name_uz TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can view feature flags (for frontend to check)
DROP POLICY IF EXISTS "Anyone can view feature flags" ON feature_flags;
CREATE POLICY "Anyone can view feature flags" ON feature_flags
    FOR SELECT USING (true);

-- Only admins can modify feature flags
DROP POLICY IF EXISTS "Admins can manage feature flags" ON feature_flags;
CREATE POLICY "Admins can manage feature flags" ON feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Default feature flags
INSERT INTO feature_flags (key, name, name_uz, description, is_enabled) VALUES
    ('stories', 'Stories', 'Hikoyalar', 'Instagram-style stories feature', true),
    ('referrals', 'Referral System', 'Referal tizimi', 'User referral rewards system', true),
    ('telegram_bot', 'Telegram Bot', 'Telegram Bot', 'Telegram integration and notifications', true),
    ('push_notifications', 'Push Notifications', 'Push bildirishnomalar', 'FCM push notifications', true),
    ('voice_search', 'Voice Search', 'Ovozli qidiruv', 'Voice search using Web Speech API', true),
    ('one_click_checkout', 'One-Click Checkout', 'Tezkor xarid', 'Quick checkout for returning users', true),
    ('gamification', 'Gamification', 'Gamifikatsiya', 'Badges and achievements system', true),
    ('smart_search', 'Smart Search', 'Aqlli qidiruv', 'Fuzzy search and suggestions', true)
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    name_uz = EXCLUDED.name_uz,
    description = EXCLUDED.description;

-- ============================================
-- 9. PUSH SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    device_type TEXT CHECK (device_type IN ('web', 'android', 'ios')),
    device_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, fcm_token)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_token ON push_subscriptions(fcm_token);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all push subscriptions" ON push_subscriptions;
CREATE POLICY "Admins can view all push subscriptions" ON push_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================
-- 10. PUSH CAMPAIGNS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS push_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'active', 'inactive', 'buyers', 'sellers')),
    target_filter JSONB, -- e.g., {"inactive_days": 30}
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_campaigns_status ON push_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_push_campaigns_scheduled ON push_campaigns(scheduled_at) WHERE status = 'scheduled';

ALTER TABLE push_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage push campaigns" ON push_campaigns;
CREATE POLICY "Admins can manage push campaigns" ON push_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================
-- 11. CONTENT REPORTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('story', 'reel', 'review', 'product', 'comment', 'user')),
    content_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'fake', 'copyright', 'other')),
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_type ON content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
CREATE POLICY "Users can create reports" ON content_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON content_reports;
CREATE POLICY "Users can view own reports" ON content_reports
    FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can manage all reports" ON content_reports;
CREATE POLICY "Admins can manage all reports" ON content_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

-- ============================================
-- 12. ABANDONED CARTS TRACKING (for push notifications)
-- ============================================

-- Add last_cart_activity to profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_cart_activity'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_cart_activity TIMESTAMPTZ;
    END IF;

    -- Add notification preferences
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'push_preferences'
    ) THEN
        ALTER TABLE profiles ADD COLUMN push_preferences JSONB DEFAULT '{"marketing": true, "orders": true, "price_drops": true, "abandoned_cart": true}'::jsonb;
    END IF;
END $$;

-- ============================================
-- 13. PRODUCT PRICE HISTORY (for price drop notifications)
-- ============================================

CREATE TABLE IF NOT EXISTS product_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    old_price DECIMAL(12,2) NOT NULL,
    new_price DECIMAL(12,2) NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON product_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_changed ON product_price_history(changed_at DESC);

ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view price history" ON product_price_history;
CREATE POLICY "Anyone can view price history" ON product_price_history
    FOR SELECT USING (true);

-- Trigger to track price changes
CREATE OR REPLACE FUNCTION track_product_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO product_price_history (product_id, old_price, new_price)
        VALUES (NEW.id, OLD.price, NEW.price);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_track_price_change ON products;
CREATE TRIGGER trigger_track_price_change
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION track_product_price_change();

-- ============================================
-- 14. FUNCTIONS FOR FEATURES
-- ============================================

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        new_code := UPPER(SUBSTRING(MD5(user_id::TEXT || RANDOM()::TEXT) FROM 1 FOR 8));
        
        -- Check if code exists
        SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = new_code) INTO code_exists;
        
        -- Exit loop if unique
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create user's referral code
CREATE OR REPLACE FUNCTION get_or_create_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    existing_code TEXT;
    new_code TEXT;
BEGIN
    -- Check for existing code
    SELECT referral_code INTO existing_code
    FROM referrals
    WHERE referrer_id = p_user_id AND referred_user_id IS NULL
    LIMIT 1;
    
    IF existing_code IS NOT NULL THEN
        RETURN existing_code;
    END IF;
    
    -- Generate new code
    new_code := generate_referral_code(p_user_id);
    
    -- Insert new referral entry
    INSERT INTO referrals (referrer_id, referral_code, status)
    VALUES (p_user_id, new_code, 'pending');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and auto-assign badges
CREATE OR REPLACE FUNCTION check_and_assign_badges(p_user_id UUID)
RETURNS void AS $$
DECLARE
    badge_rec RECORD;
    order_count INTEGER;
    review_count INTEGER;
    account_age INTEGER;
BEGIN
    -- Get user stats
    SELECT COUNT(*) INTO order_count FROM orders WHERE user_id = p_user_id AND status = 'delivered';
    SELECT COUNT(*) INTO review_count FROM product_comments WHERE user_id = p_user_id;
    SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER INTO account_age FROM profiles WHERE id = p_user_id;
    
    -- Loop through badges and assign if criteria met
    FOR badge_rec IN SELECT * FROM badges WHERE is_active = true AND criteria IS NOT NULL LOOP
        -- Check if already has badge
        IF NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = badge_rec.id) THEN
            -- Check criteria
            IF badge_rec.criteria->>'type' = 'order_count' AND order_count >= (badge_rec.criteria->>'value')::INTEGER THEN
                INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, badge_rec.id);
            ELSIF badge_rec.criteria->>'type' = 'review_count' AND review_count >= (badge_rec.criteria->>'value')::INTEGER THEN
                INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, badge_rec.id);
            ELSIF badge_rec.criteria->>'type' = 'account_age_days' AND account_age >= (badge_rec.criteria->>'value')::INTEGER THEN
                INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, badge_rec.id);
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete referral on first order
CREATE OR REPLACE FUNCTION complete_referral_on_order()
RETURNS TRIGGER AS $$
DECLARE
    referral_rec RECORD;
    settings_rec RECORD;
    reward DECIMAL(12,2);
BEGIN
    -- Only process on first successful order
    IF NEW.status = 'delivered' THEN
        -- Check if user was referred and referral not yet completed
        SELECT r.* INTO referral_rec
        FROM referrals r
        WHERE r.referred_user_id = NEW.user_id AND r.status = 'registered';
        
        IF FOUND THEN
            -- Get reward settings
            SELECT * INTO settings_rec FROM referral_settings WHERE is_active = true LIMIT 1;
            
            IF settings_rec.reward_type = 'fixed' THEN
                reward := settings_rec.reward_value;
            ELSE
                reward := NEW.total_amount * (settings_rec.reward_value / 100);
            END IF;
            
            -- Update referral to completed
            UPDATE referrals
            SET status = 'completed',
                reward_amount = reward,
                first_order_id = NEW.id,
                completed_at = NOW()
            WHERE id = referral_rec.id;
            
            -- TODO: Add reward to referrer's wallet/balance (future implementation)
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_complete_referral_on_order ON orders;
CREATE TRIGGER trigger_complete_referral_on_order
    AFTER UPDATE ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION complete_referral_on_order();

-- Function to increment story view count
CREATE OR REPLACE FUNCTION increment_story_views(p_story_id UUID, p_viewer_id UUID)
RETURNS void AS $$
BEGIN
    -- Insert view record (ignore if already exists)
    INSERT INTO story_views (story_id, viewer_id)
    VALUES (p_story_id, p_viewer_id)
    ON CONFLICT (story_id, viewer_id) DO NOTHING;
    
    -- Increment view count
    UPDATE stories
    SET view_count = view_count + 1
    WHERE id = p_story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 15. ENABLE PG_TRGM FOR FUZZY SEARCH
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm ON profiles USING gin (full_name gin_trgm_ops);

-- Fuzzy search function
CREATE OR REPLACE FUNCTION search_products_fuzzy(search_query TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    title TEXT,
    price DECIMAL,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.title, p.price, similarity(p.title, search_query) as similarity_score
    FROM products p
    WHERE p.title % search_query OR p.description % search_query
    ORDER BY similarity_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 16. CLEANUP EXPIRED STORIES (CRON JOB)
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
    UPDATE stories
    SET is_active = false
    WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 17. GRANTS
-- ============================================

GRANT EXECUTE ON FUNCTION get_or_create_referral_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_assign_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_story_views(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_products_fuzzy(TEXT, INTEGER) TO anon, authenticated;

GRANT ALL ON TABLE telegram_users TO authenticated, service_role;
GRANT ALL ON TABLE referrals TO authenticated, service_role;
GRANT ALL ON TABLE referral_settings TO authenticated, service_role;
GRANT ALL ON TABLE badges TO authenticated, service_role;
GRANT ALL ON TABLE user_badges TO authenticated, service_role;
GRANT ALL ON TABLE stories TO authenticated, service_role;
GRANT ALL ON TABLE story_views TO authenticated, service_role;
GRANT ALL ON TABLE feature_flags TO authenticated, service_role;
GRANT ALL ON TABLE push_subscriptions TO authenticated, service_role;
GRANT ALL ON TABLE push_campaigns TO authenticated, service_role;
GRANT ALL ON TABLE content_reports TO authenticated, service_role;
GRANT ALL ON TABLE product_price_history TO authenticated, service_role;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE telegram_users IS 'Stores Telegram bot connection details for users';
COMMENT ON TABLE referrals IS 'Tracks user referral relationships and rewards';
COMMENT ON TABLE referral_settings IS 'Admin-configurable referral reward settings';
COMMENT ON TABLE badges IS 'Gamification badges that can be earned by users';
COMMENT ON TABLE user_badges IS 'Badges earned by individual users';
COMMENT ON TABLE stories IS 'Ephemeral content that expires after 24 hours';
COMMENT ON TABLE story_views IS 'Tracks who viewed which stories';
COMMENT ON TABLE feature_flags IS 'Dynamic feature toggles controlled by admins';
COMMENT ON TABLE push_subscriptions IS 'FCM tokens for push notification delivery';
COMMENT ON TABLE push_campaigns IS 'Marketing push notification campaigns';
COMMENT ON TABLE content_reports IS 'User-submitted content moderation reports';
COMMENT ON TABLE product_price_history IS 'Price change history for price drop notifications';
