-- ============================================
-- SUPPORT ADMIN TABLES - COMPLETE SCHEMA
-- ============================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS admin_messages CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP SEQUENCE IF EXISTS support_ticket_seq CASCADE;

-- ============================================
-- 1. ADMIN MESSAGES TABLE
-- ============================================
CREATE TABLE admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_messages_from_user ON admin_messages(from_user_id);
CREATE INDEX idx_admin_messages_to_user ON admin_messages(to_user_id);
CREATE INDEX idx_admin_messages_status ON admin_messages(status);
CREATE INDEX idx_admin_messages_created_at ON admin_messages(created_at DESC);

-- ============================================
-- 2. EMAIL CAMPAIGNS TABLE
-- ============================================
CREATE TABLE email_campaigns (
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
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_created_at ON email_campaigns(created_at DESC);
CREATE INDEX idx_email_campaigns_created_by ON email_campaigns(created_by);

-- ============================================
-- 3. SUPPORT TICKETS TABLE
-- ============================================
CREATE SEQUENCE support_ticket_seq START 1234;

CREATE TABLE support_tickets (
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
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);

-- ============================================
-- 4. PLATFORM SETTINGS TABLE
-- ============================================
CREATE TABLE platform_settings (
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
CREATE INDEX idx_platform_settings_setting_key ON platform_settings(setting_key);
CREATE INDEX idx_platform_settings_category ON platform_settings(category);
CREATE INDEX idx_platform_settings_is_enabled ON platform_settings(is_enabled);

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

CREATE TRIGGER trigger_admin_messages_updated_at
  BEFORE UPDATE ON admin_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
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
-- VERIFICATION
-- ============================================

-- Verify tables created
SELECT 
  'admin_messages' as table_name, 
  COUNT(*) as row_count 
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
FROM platform_settings;
