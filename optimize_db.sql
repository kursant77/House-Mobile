-- Optimizing database performance with indexes

-- 1. Posts: Speed up sorting by date (Feed) and filtering by author (Profile)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.public_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.public_posts(author_id);

-- 2. Products: Speed up sorting by date (Feed)
-- Note: 'products_new' seems to be the main table, checking just in case
-- Assuming 'products' is the table used by productService
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- 3. Comments: Speed up fetching comments for a post
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.public_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.public_post_comments(user_id);

-- 4. Likes & Views: Speed up lookups for "has_liked" and "viewed" checks
CREATE INDEX IF NOT EXISTS idx_post_likes_lookup ON public.public_post_likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_lookup ON public.public_post_comment_likes(comment_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_lookup ON public.public_post_views(post_id, user_id);
