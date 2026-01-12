-- Create view_history table to track what users have viewed
CREATE TABLE IF NOT EXISTS view_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('reel', 'post', 'product')),
    content_id UUID NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate entries (same user viewing same content)
    UNIQUE(user_id, content_type, content_id)
);

-- Create indexes for better performance
CREATE INDEX idx_view_history_user_id ON view_history(user_id);
CREATE INDEX idx_view_history_content_type ON view_history(content_type);
CREATE INDEX idx_view_history_viewed_at ON view_history(viewed_at DESC);
CREATE INDEX idx_view_history_user_content ON view_history(user_id, content_type, viewed_at DESC);

-- Enable RLS
ALTER TABLE view_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own history
CREATE POLICY "Users can view own history"
    ON view_history FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert own history"
    ON view_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete own history"
    ON view_history FOR DELETE
    USING (auth.uid() = user_id);

-- Function to add or update view history
CREATE OR REPLACE FUNCTION add_view_history(
    p_user_id UUID,
    p_content_type TEXT,
    p_content_id UUID
) RETURNS void AS $$
BEGIN
    -- Insert or update the view history
    INSERT INTO view_history (user_id, content_type, content_id, viewed_at)
    VALUES (p_user_id, p_content_type, p_content_id, NOW())
    ON CONFLICT (user_id, content_type, content_id)
    DO UPDATE SET viewed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE view_history IS 'Tracks user viewing history for reels, posts, and products';
COMMENT ON FUNCTION add_view_history IS 'Adds or updates a view history entry, updating timestamp if already exists';
