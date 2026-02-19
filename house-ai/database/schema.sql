-- ============================================
-- HOUSE AI — DATABASE SCHEMA
-- Supabase (PostgreSQL + pgvector)
-- ============================================
-- Run this in Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. AI PRODUCTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ai_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'UZS',
    cpu TEXT,
    gpu TEXT,
    ram TEXT,
    storage TEXT,
    battery TEXT,
    display TEXT,
    camera TEXT,
    image_url TEXT,
    gaming_score DECIMAL(3, 1) DEFAULT 0 CHECK (gaming_score >= 0 AND gaming_score <= 10),
    camera_score DECIMAL(3, 1) DEFAULT 0 CHECK (camera_score >= 0 AND camera_score <= 10),
    value_score DECIMAL(3, 1) DEFAULT 0 CHECK (value_score >= 0 AND value_score <= 10),
    trend_score DECIMAL(3, 1) DEFAULT 0 CHECK (trend_score >= 0 AND trend_score <= 10),
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_products_brand ON ai_products(brand);
CREATE INDEX IF NOT EXISTS idx_ai_products_price ON ai_products(price);
CREATE INDEX IF NOT EXISTS idx_ai_products_gaming_score ON ai_products(gaming_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_products_value_score ON ai_products(value_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_products_name ON ai_products USING gin(to_tsvector('english', name));

-- Vector index (IVFFlat for fast approximate search)
CREATE INDEX IF NOT EXISTS idx_ai_products_embedding ON ai_products
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- RLS
ALTER TABLE ai_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read ai_products" ON ai_products;
CREATE POLICY "Anyone can read ai_products" ON ai_products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage ai_products" ON ai_products;
CREATE POLICY "Admins can manage ai_products" ON ai_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- 2. BLOG POSTS TABLE (with embeddings)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vector index
CREATE INDEX IF NOT EXISTS idx_ai_blog_posts_embedding ON ai_blog_posts
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

-- RLS
ALTER TABLE ai_blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read ai_blog_posts" ON ai_blog_posts;
CREATE POLICY "Anyone can read ai_blog_posts" ON ai_blog_posts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage ai_blog_posts" ON ai_blog_posts;
CREATE POLICY "Admins can manage ai_blog_posts" ON ai_blog_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'blogger')
        )
    );

-- ============================================
-- 3. CHAT SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    anonymous_session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_anon_id ON chat_sessions(anonymous_session_id);

-- RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON chat_sessions;
CREATE POLICY "Users can view own sessions" ON chat_sessions
    FOR SELECT USING (
        auth.uid() = user_id
        OR anonymous_session_id IS NOT NULL
    );

DROP POLICY IF EXISTS "Anyone can create sessions" ON chat_sessions;
CREATE POLICY "Anyone can create sessions" ON chat_sessions
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 4. CHAT MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(session_id, created_at DESC);

-- RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
CREATE POLICY "Users can view own messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND (
                chat_sessions.user_id = auth.uid()
                OR chat_sessions.anonymous_session_id IS NOT NULL
            )
        )
    );

DROP POLICY IF EXISTS "Anyone can insert messages" ON chat_messages;
CREATE POLICY "Anyone can insert messages" ON chat_messages
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 5. VECTOR SEARCH FUNCTIONS (RPC)
-- ============================================

-- Match products by embedding similarity
CREATE OR REPLACE FUNCTION match_products(
    query_embedding vector(1536),
    match_count INT DEFAULT 3,
    match_threshold FLOAT DEFAULT 0.75
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    brand TEXT,
    price DECIMAL,
    currency TEXT,
    cpu TEXT,
    gpu TEXT,
    ram TEXT,
    storage TEXT,
    battery TEXT,
    display TEXT,
    camera TEXT,
    image_url TEXT,
    gaming_score DECIMAL,
    camera_score DECIMAL,
    value_score DECIMAL,
    trend_score DECIMAL,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ap.id,
        ap.name,
        ap.brand,
        ap.price,
        ap.currency,
        ap.cpu,
        ap.gpu,
        ap.ram,
        ap.storage,
        ap.battery,
        ap.display,
        ap.camera,
        ap.image_url,
        ap.gaming_score,
        ap.camera_score,
        ap.value_score,
        ap.trend_score,
        1 - (ap.embedding <=> query_embedding) AS similarity
    FROM ai_products ap
    WHERE ap.embedding IS NOT NULL
    AND 1 - (ap.embedding <=> query_embedding) > match_threshold
    ORDER BY ap.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Match blog posts by embedding similarity
CREATE OR REPLACE FUNCTION match_blog_posts(
    query_embedding vector(1536),
    match_count INT DEFAULT 3,
    match_threshold FLOAT DEFAULT 0.75
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        bp.id,
        bp.title,
        bp.content,
        1 - (bp.embedding <=> query_embedding) AS similarity
    FROM ai_blog_posts bp
    WHERE bp.embedding IS NOT NULL
    AND 1 - (bp.embedding <=> query_embedding) > match_threshold
    ORDER BY bp.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================
-- 6. SAMPLE DATA (Optional)
-- ============================================

-- Uncomment and run to insert sample products
/*
INSERT INTO ai_products (name, brand, price, cpu, gpu, ram, storage, battery, display, camera, gaming_score, camera_score, value_score, trend_score) VALUES
('Samsung Galaxy S24 Ultra', 'Samsung', 15990000, 'Snapdragon 8 Gen 3', 'Adreno 750', '12GB', '256GB', '5000mAh', '6.8" QHD+ AMOLED 120Hz', '200MP + 12MP + 50MP + 10MP', 9.5, 9.8, 7.0, 9.5),
('iPhone 15 Pro Max', 'Apple', 16990000, 'A17 Pro', 'Apple GPU 6-core', '8GB', '256GB', '4422mAh', '6.7" OLED 120Hz', '48MP + 12MP + 12MP', 9.0, 9.5, 6.5, 9.8),
('Google Pixel 8 Pro', 'Google', 9990000, 'Tensor G3', 'Mali-G715', '12GB', '128GB', '5050mAh', '6.7" QHD+ OLED 120Hz', '50MP + 48MP + 48MP', 7.5, 9.7, 8.5, 8.0),
('Samsung Galaxy A54', 'Samsung', 4990000, 'Exynos 1380', 'Mali-G68', '8GB', '128GB', '5000mAh', '6.4" FHD+ AMOLED 120Hz', '50MP + 12MP + 5MP', 6.0, 7.0, 9.0, 7.5),
('Xiaomi 14', 'Xiaomi', 8990000, 'Snapdragon 8 Gen 3', 'Adreno 750', '12GB', '256GB', '4610mAh', '6.36" LTPO AMOLED 120Hz', '50MP + 50MP + 50MP', 9.0, 9.0, 8.5, 8.5),
('OnePlus 12', 'OnePlus', 8490000, 'Snapdragon 8 Gen 3', 'Adreno 750', '12GB', '256GB', '5400mAh', '6.82" QHD+ AMOLED 120Hz', '50MP + 48MP + 64MP', 9.5, 8.5, 8.0, 7.5),
('Realme GT5 Pro', 'Realme', 5990000, 'Snapdragon 8 Gen 3', 'Adreno 750', '12GB', '256GB', '5400mAh', '6.78" QHD+ AMOLED 144Hz', '50MP + 8MP + 50MP', 9.0, 8.0, 9.0, 7.0),
('Nothing Phone 2', 'Nothing', 5490000, 'Snapdragon 8+ Gen 1', 'Adreno 730', '12GB', '256GB', '4700mAh', '6.7" FHD+ OLED 120Hz', '50MP + 50MP', 7.5, 7.5, 8.5, 8.0),
('Poco F6 Pro', 'Poco', 4490000, 'Snapdragon 8 Gen 2', 'Adreno 740', '12GB', '256GB', '5000mAh', '6.67" QHD+ AMOLED 120Hz', '50MP + 8MP + 2MP', 9.0, 7.0, 9.5, 7.0),
('Samsung Galaxy Z Fold5', 'Samsung', 22990000, 'Snapdragon 8 Gen 2', 'Adreno 740', '12GB', '256GB', '4400mAh', '7.6" QXGA+ AMOLED 120Hz', '50MP + 12MP + 10MP', 8.0, 8.0, 5.0, 9.0);
*/
