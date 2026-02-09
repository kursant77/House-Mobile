-- ============================================
-- WITHDRAWALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'UZS',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    bank_details JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_seller_id ON withdrawals(seller_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- RLS for withdrawals
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can view own withdrawals" ON withdrawals;
CREATE POLICY "Sellers can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can create own withdrawal requests" ON withdrawals;
CREATE POLICY "Sellers can create own withdrawal requests" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON withdrawals;
CREATE POLICY "Admins can manage all withdrawals" ON withdrawals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Auto-update updated_at for withdrawals
DROP TRIGGER IF EXISTS trigger_withdrawals_updated_at ON withdrawals;
CREATE TRIGGER trigger_withdrawals_updated_at
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
