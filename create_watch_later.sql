-- Create watch_later table
CREATE TABLE IF NOT EXISTS watch_later (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate entries
    UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX idx_watch_later_user_id ON watch_later(user_id);
CREATE INDEX idx_watch_later_created_at ON watch_later(created_at DESC);

-- Enable RLS
ALTER TABLE watch_later ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own watch later"
    ON watch_later FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch later"
    ON watch_later FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watch later"
    ON watch_later FOR DELETE
    USING (auth.uid() = user_id);

COMMENT ON TABLE watch_later IS 'User saved videos for later viewing';
