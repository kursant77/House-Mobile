import { supabase } from "@/lib/supabase";
import { Product, ReelItem } from "@/types/product";
import { SupabaseProductWithRelations, SupabaseProductMedia } from "@/types/api";
import { handleError, getErrorMessage } from "@/lib/errorHandler";
import { imageFileSchema, videoFileSchema } from "@/lib/validation";
import { sanitizeFilename } from "@/lib/sanitize";
import { SUPABASE_STORAGE_LIMIT } from "@/lib/config";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimiter";
import { mapSupabaseProductsToProducts, mapSupabaseProductToProduct } from "@/lib/productMapper";

export const productService = {
    /**
     * Fetch all products with their media and seller info
     * Supports pagination for better performance
     */
    getProducts: async (params?: {
        limit?: number;
        offset?: number;
        category?: string;
    }): Promise<{ products: Product[]; total: number }> => {
        const limit = params?.limit || 20;
        const offset = params?.offset || 0;

        let query = supabase
            .from('products')
            .select(`
                *,
                product_media(*),
                profiles!seller_id(id, full_name, avatar_url, role)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply category filter if provided
        if (params?.category) {
            query = query.eq('category', params.category);
        }

        const { data, error, count } = await query;

        if (error) {
            const appError = handleError(error, 'getProducts');
            throw new Error(appError.message);
        }

        return {
            products: mapSupabaseProductsToProducts(data as SupabaseProductWithRelations[]),
            total: count || 0,
        };
    },

    /**
     * Fetch products posted by admins (for Home page reviews)
     */
    getAdminProducts: async (): Promise<Product[]> => {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                product_media(*),
                profiles!seller_id(id, full_name, avatar_url, role)
            `)
            .in('profiles.role', ['super_admin'])
            .order('created_at', { ascending: false });

        if (error) {
            const appError = handleError(error, 'getProducts');
            throw new Error(appError.message);
        }

        if (!data) {
            return [];
        }

        return mapSupabaseProductsToProducts(data as SupabaseProductWithRelations[]);
    },

    /**
     * Fetch products by a specific user (for Profile page)
     */
    getProductsByUserId: async (userId: string): Promise<Product[]> => {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                product_media(*),
                profiles!seller_id(id, full_name, avatar_url, role)
            `)
            .eq('seller_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            const appError = handleError(error, 'getProducts');
            throw new Error(appError.message);
        }

        if (!data) {
            return [];
        }

        return mapSupabaseProductsToProducts(data as SupabaseProductWithRelations[]);
    },

    /**
     * Fetch a single product by ID
     */
    getProductById: async (id: string): Promise<Product | null> => {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                product_media(*),
                profiles!seller_id(id, full_name, avatar_url, role)
            `)
            .eq('id', id)
            .single();

        if (error) {
            handleError(error, 'getProductById');
            return null;
        }

        return mapSupabaseProductToProduct(data as SupabaseProductWithRelations);
    },

    /**
     * Fetch reels (products with videos) with unviewed priority
     */
    getReels: async (): Promise<ReelItem[]> => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        // 1. Fetch all products with videos
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                product_media!inner(*),
                profiles!seller_id(id, full_name, avatar_url, role, username)
            `)
            .eq('product_media.type', 'video')
            .order('created_at', { ascending: false });

        if (error) {
            const appError = handleError(error, 'getProducts');
            throw new Error(appError.message);
        }

        // 2. Fetch user's view history if logged in
        let viewedReelIds = new Set<string>();
        if (userId) {
            const { data: history } = await supabase
                .from('view_history')
                .select('content_id')
                .eq('user_id', userId)
                .eq('content_type', 'reel');

            if (history) {
                viewedReelIds = new Set(history.map(h => h.content_id));
            }
        }

        // 3. Optimize: Batch fetch all likes and comments counts
        const productIds = (data as SupabaseProductWithRelations[])
            .filter((p) => {
                const media = Array.isArray(p.product_media) ? p.product_media : (p.product_media ? [p.product_media] : []);
                return media.some((m: SupabaseProductMedia) => m.type === 'video');
            })
            .map(p => p.id);

        // Batch fetch likes counts for all products
        const { data: allLikes } = await supabase
            .from('product_likes')
            .select('product_id')
            .in('product_id', productIds);

        // Batch fetch comment counts for all products
        const { data: allComments } = await supabase
            .from('product_comments')
            .select('product_id')
            .in('product_id', productIds)
            .is('parent_comment_id', null);

        // Batch fetch user likes if logged in
        const { data: userLikes } = userId
            ? await supabase
                .from('product_likes')
                .select('product_id')
                .eq('user_id', userId)
                .in('product_id', productIds)
            : { data: null };

        // Count likes and comments per product
        const likesCounts = new Map<string, number>();
        const commentCounts = new Map<string, number>();
        const userLikedProducts = new Set<string>();

        allLikes?.forEach(like => {
            likesCounts.set(like.product_id, (likesCounts.get(like.product_id) || 0) + 1);
        });

        allComments?.forEach(comment => {
            commentCounts.set(comment.product_id, (commentCounts.get(comment.product_id) || 0) + 1);
        });

        userLikes?.forEach(like => {
            userLikedProducts.add(like.product_id);
        });

        // 4. Map reels with pre-fetched data
        const reels: ReelItem[] = (data as SupabaseProductWithRelations[])
            .filter((p) => {
                const media = Array.isArray(p.product_media) ? p.product_media : (p.product_media ? [p.product_media] : []);
                return media.some((m: SupabaseProductMedia) => m.type === 'video');
            })
            .map((p) => {
                const media = Array.isArray(p.product_media) ? p.product_media : (p.product_media ? [p.product_media] : []);
                const videoMedia = media.find((m: SupabaseProductMedia) => m.type === 'video');
                if (!videoMedia) return null;

                const images = media
                    .filter((m: SupabaseProductMedia) => m.type === 'image')
                    .map((m: SupabaseProductMedia) => m.url);

                const author: ReelItem['author'] = p.profiles ? {
                    id: p.profiles.id,
                    fullName: p.profiles.full_name ?? undefined,
                    username: p.profiles.username ?? undefined,
                    avatarUrl: p.profiles.avatar_url ?? undefined,
                    role: p.profiles.role,
                } : undefined;

                const reelItem: ReelItem = {
                    id: `reel-${p.id}`,
                    videoUrl: videoMedia.url,
                    thumbnailUrl: videoMedia.thumbnail_url || images[0],
                    author,
                    product: {
                        id: p.id,
                        title: p.title,
                        description: p.description,
                        price: p.price,
                        currency: p.currency,
                        category: p.category,
                        inStock: p.in_stock,
                        rating: p.rating ?? undefined,
                        reviewCount: p.review_count ?? undefined,
                        sellerId: p.seller_id,
                        images,
                        videoUrl: videoMedia.url,
                        author,
                        views: p.views ?? 0,
                    },
                    likes: likesCounts.get(p.id) || 0,
                    commentCount: commentCounts.get(p.id) || 0,
                    isLiked: userLikedProducts.has(p.id),
                    isFavorite: false,
                    isViewed: viewedReelIds.has(p.id)
                };

                return reelItem;
            })
            .filter((reel): reel is ReelItem => reel !== null);

        // Sort: Unviewed first (already sorted by date), then viewed
        return reels.sort((a, b) => {
            const aViewed = a.isViewed ?? false;
            const bViewed = b.isViewed ?? false;
            if (aViewed === bViewed) return 0;
            return aViewed ? 1 : -1;
        });
    },

    /**
     * Upload media to Supabase Storage with progress and validation
     */
    uploadMedia: async (file: File, bucket: string = 'product-media', onProgress?: (progress: number) => void, skipSizeValidation: boolean = false): Promise<string> => {
        // Rate limiting for file uploads
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'anonymous';
        checkRateLimit(`upload:${userId}`, RATE_LIMITS.FILE_UPLOAD);

        // Validate file type and size
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (isImage) {
            const imageValidation = imageFileSchema.safeParse(file);
            if (!imageValidation.success) {
                throw new Error(imageValidation.error.errors[0]?.message || 'Rasm fayli noto\'g\'ri');
            }
        } else if (isVideo) {
            // Check Supabase storage limit first (even for news videos)
            if (file.size > SUPABASE_STORAGE_LIMIT) {
                const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
                const limitInMB = (SUPABASE_STORAGE_LIMIT / 1024 / 1024).toFixed(0);
                throw new Error(
                    `Fayl hajmi ${sizeInMB}MB, lekin maksimal ruxsat etilgan hajm ${limitInMB}MB. ` +
                    `Iltimos, videoni siqish yoki kichikroq fayl tanlang.`
                );
            }

            // Skip size validation if requested (for news uploads, but still check Supabase limit)
            if (!skipSizeValidation) {
                const videoValidation = videoFileSchema.safeParse(file);
                if (!videoValidation.success) {
                    throw new Error(videoValidation.error.errors[0]?.message || 'Video fayli noto\'g\'ri');
                }
            } else {
                // Only validate file type, not size (but Supabase limit still applies)
                if (!file.type.startsWith('video/')) {
                    throw new Error('Fayl video formatida bo\'lishi kerak');
                }
            }
        } else {
            throw new Error('Faqat rasm yoki video fayllar qabul qilinadi');
        }

        // Sanitize filename
        const sanitizedOriginalName = sanitizeFilename(file.name);
        const fileExt = sanitizedOriginalName.split('.').pop() || 'bin';
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 10);
        const sanitizedFileName = `${timestamp}-${randomString}.${fileExt}`;
        const filePath = `${userId}/${sanitizedFileName}`;

        // Upload with progress tracking
        if (onProgress) {
            onProgress(10); // Start
        }

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (onProgress) {
            onProgress(90); // Almost done
        }

        if (uploadError) {
            // Check for specific error types
            if (uploadError.message.includes('exceeded') || uploadError.message.includes('maximum') || uploadError.message.includes('size')) {
                const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
                throw new Error(
                    `Fayl juda katta (${sizeInMB}MB). Supabase storage limiti: 50MB. ` +
                    `Iltimos, faylni siqish yoki kichikroq fayl tanlang.`
                );
            }
            throw new Error(`Fayl yuklashda xatolik: ${uploadError.message}`);
        }

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        if (!data?.publicUrl) {
            throw new Error(getErrorMessage(new Error('Fayl URL olishda xatolik')));
        }

        if (onProgress) {
            onProgress(100); // Complete
        }

        return data.publicUrl;
    },

    /**
     * Create a new product with media and track overall progress
     */
    createProduct: async (
        product: Omit<Product, 'id' | 'images' | 'videoUrl'>,
        media: { file: File, type: 'image' | 'video' }[],
        onProgress?: (percent: number) => void
    ) => {
        // Rate limiting for product creation
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'anonymous';
        checkRateLimit(`create-product:${userId}`, RATE_LIMITS.FORM_SUBMIT);

        // 1. Insert product
        const { data: productData, error: productError } = await supabase
            .from('products')
            .insert([{
                seller_id: product.sellerId,
                title: product.title,
                description: product.description,
                price: product.price,
                category: product.category,
                currency: product.currency,
                in_stock: product.inStock,
            }])
            .select()
            .single();

        if (productError) throw productError;

        // 2. Upload media and get URLs
        const totalFiles = media.length;
        let uploadedFiles = 0;

        const mediaInserts = await Promise.all(
            media.map(async (m, index) => {
                const url = await productService.uploadMedia(m.file);
                uploadedFiles++;
                if (onProgress) {
                    onProgress(Math.round((uploadedFiles / totalFiles) * 100));
                }
                return {
                    product_id: productData.id,
                    type: m.type,
                    url,
                    order_index: index,
                };
            })
        );

        // 3. Insert media records
        const { error: mediaError } = await supabase
            .from('product_media')
            .insert(mediaInserts);

        if (mediaError) throw mediaError;

        return productData;
    },

    /**
     * Delete a product and its records
     */
    deleteProduct: async (productId: string): Promise<void> => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) {
            const appError = handleError(error, 'deleteProduct');
            throw new Error(appError.message);
        }
    },

    /**
     * Update an existing product
     */
    updateProduct: async (
        productId: string,
        updates: Partial<Product>,
        media?: { file: File, type: 'image' | 'video' }[],
        onProgress?: (percent: number) => void
    ): Promise<void> => {


        // 1. Update product basic info

        const { error } = await supabase
            .from('products')
            .update({
                title: updates.title,
                description: updates.description,
                price: updates.price,
                category: updates.category,
                currency: updates.currency,
                in_stock: updates.inStock,
            })
            .eq('id', productId);

        if (error) {

            const appError = handleError(error, 'updateProduct');
            throw new Error(appError.message);
        }

        // 2. Handle media updates if provided
        if (media && media.length > 0) {

            // Get existing media
            const { data: existingMedia } = await supabase
                .from('product_media')
                .select('*')
                .eq('product_id', productId);

            // Delete all existing media
            if (existingMedia && existingMedia.length > 0) {

                const { error: deleteError } = await supabase
                    .from('product_media')
                    .delete()
                    .eq('product_id', productId);

                if (deleteError) {

                    const appError = handleError(deleteError, 'updateProduct.deleteMedia');
                    throw new Error(appError.message);
                }
            }

            // Upload new media
            const totalFiles = media.length;
            let uploadedFiles = 0;

            const mediaInserts = await Promise.all(
                media.map(async (m, index) => {
                    const url = await productService.uploadMedia(m.file);
                    uploadedFiles++;
                    if (onProgress) {
                        onProgress(Math.round((uploadedFiles / totalFiles) * 100));
                    }
                    return {
                        product_id: productId,
                        type: m.type,
                        url,
                        order_index: index,
                    };
                })
            );

            // Insert new media records
            const { error: mediaError } = await supabase
                .from('product_media')
                .insert(mediaInserts);

            if (mediaError) {

                const appError = handleError(mediaError, 'updateProduct.insertMedia');
                throw new Error(appError.message);
            }

        }

    },

    /**
     * Increment product view count
     */
    incrementViews: async (productId: string): Promise<void> => {
        try {
            const realId = productId.startsWith('reel-') ? productId.replace('reel-', '') : productId;

            const { data: p, error: getError } = await supabase
                .from('products')
                .select('views')
                .eq('id', realId)
                .single();

            if (getError) return;

            await supabase
                .from('products')
                .update({ views: (p?.views ?? 0) + 1 })
                .eq('id', realId);
        } catch (err) {
            // Silently ignore
        }
    },

    // ==================== PRODUCT REVIEWS ====================

    /**
     * Get reviews for a product
     */
    getReviews: async (productId: string): Promise<ProductReview[]> => {
        const { data, error } = await supabase
            .from('product_reviews')
            .select(`
                *,
                profiles!user_id(id, full_name, avatar_url)
            `)
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) {
            handleError(error, 'getReviews');
            return [];
        }

        return (data || []).map(review => ({
            id: review.id,
            productId: review.product_id,
            userId: review.user_id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.created_at,
            updatedAt: review.updated_at,
            user: review.profiles ? {
                id: review.profiles.id,
                fullName: review.profiles.full_name,
                avatarUrl: review.profiles.avatar_url,
            } : undefined,
        }));
    },

    /**
     * Add a review for a product
     */
    addReview: async (productId: string, rating: number, comment: string): Promise<ProductReview> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error("Sharh qoldirish uchun tizimga kiring");
        }

        checkRateLimit(`review:${user.id}`, RATE_LIMITS.FORM_SUBMIT);

        // Check if user already reviewed this product
        const { data: existing } = await supabase
            .from('product_reviews')
            .select('id')
            .eq('product_id', productId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing) {
            throw new Error("Siz bu mahsulotga allaqachon sharh qoldirgansiz");
        }

        const { data, error } = await supabase
            .from('product_reviews')
            .insert([{
                product_id: productId,
                user_id: user.id,
                rating,
                comment,
            }])
            .select(`
                *,
                profiles!user_id(id, full_name, avatar_url)
            `)
            .single();

        if (error) {
            const appError = handleError(error, 'addReview');
            throw new Error(appError.message);
        }

        // Update product average rating
        await productService.updateProductRating(productId);

        return {
            id: data.id,
            productId: data.product_id,
            userId: data.user_id,
            rating: data.rating,
            comment: data.comment,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            user: data.profiles ? {
                id: data.profiles.id,
                fullName: data.profiles.full_name,
                avatarUrl: data.profiles.avatar_url,
            } : undefined,
        };
    },

    /**
     * Update a review
     */
    updateReview: async (reviewId: string, rating: number, comment: string): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error("Avtorizatsiya zarur");
        }

        // Verify ownership
        const { data: review } = await supabase
            .from('product_reviews')
            .select('user_id, product_id')
            .eq('id', reviewId)
            .single();

        if (!review || review.user_id !== user.id) {
            throw new Error("Bu sharhni tahrirlash huquqingiz yo'q");
        }

        const { error } = await supabase
            .from('product_reviews')
            .update({
                rating,
                comment,
                updated_at: new Date().toISOString(),
            })
            .eq('id', reviewId);

        if (error) {
            const appError = handleError(error, 'updateReview');
            throw new Error(appError.message);
        }

        // Update product average rating
        await productService.updateProductRating(review.product_id);
    },

    /**
     * Delete a review
     */
    deleteReview: async (reviewId: string): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error("Avtorizatsiya zarur");
        }

        // Verify ownership or admin
        const { data: review } = await supabase
            .from('product_reviews')
            .select('user_id, product_id')
            .eq('id', reviewId)
            .single();

        if (!review) {
            throw new Error("Sharh topilmadi");
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const isAdmin = profile?.role === 'super_admin';
        if (review.user_id !== user.id && !isAdmin) {
            throw new Error("Bu sharhni o'chirish huquqingiz yo'q");
        }

        const { error } = await supabase
            .from('product_reviews')
            .delete()
            .eq('id', reviewId);

        if (error) {
            const appError = handleError(error, 'deleteReview');
            throw new Error(appError.message);
        }

        // Update product average rating
        await productService.updateProductRating(review.product_id);
    },

    /**
     * Get review statistics for a product
     */
    getReviewStats: async (productId: string): Promise<{
        averageRating: number;
        totalReviews: number;
        ratingDistribution: Record<number, number>;
    }> => {
        const { data, error } = await supabase
            .from('product_reviews')
            .select('rating')
            .eq('product_id', productId);

        if (error || !data || data.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            };
        }

        const totalReviews = data.length;
        const sum = data.reduce((acc, r) => acc + r.rating, 0);
        const averageRating = sum / totalReviews;

        const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        data.forEach(r => {
            ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
        });

        return { averageRating, totalReviews, ratingDistribution };
    },

    /**
     * Update product's average rating (internal helper)
     */
    updateProductRating: async (productId: string): Promise<void> => {
        const stats = await productService.getReviewStats(productId);

        await supabase
            .from('products')
            .update({
                rating: stats.averageRating,
                review_count: stats.totalReviews,
            })
            .eq('id', productId);
    },

    /**
     * Check if user has reviewed a product
     */
    hasUserReviewed: async (productId: string): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data } = await supabase
            .from('product_reviews')
            .select('id')
            .eq('product_id', productId)
            .eq('user_id', user.id)
            .maybeSingle();

        return !!data;
    },
};

// Review type
export interface ProductReview {
    id: string;
    productId: string;
    userId: string;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        fullName: string;
        avatarUrl?: string;
    };
}
