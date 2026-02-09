-- Support Bridging Migration
-- Adds Telegram support bridging to admin_messages

-- 1. Update admin_messages table
ALTER TABLE admin_messages 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web' CHECK (source IN ('web', 'telegram', 'app')),
ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;

-- 2. Create support_admin_settings if not exists
CREATE TABLE IF NOT EXISTS support_admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_active_for_telegram BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update RLS for admin_messages to allow service role (bot)
DROP POLICY IF EXISTS "Service can insert admin messages" ON admin_messages;
CREATE POLICY "Service can insert admin messages" ON admin_messages
    FOR INSERT WITH CHECK (true);

-- 4. Grant access
GRANT ALL ON TABLE admin_messages TO authenticated, service_role;
GRANT ALL ON TABLE support_admin_settings TO authenticated, service_role;
