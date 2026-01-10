import { supabase } from "@/lib/supabase";
import { Product, ReelItem } from "@/types/product";

export const productService = {
    /**
     * Fetch all products with their media and seller info
     */
    getProducts: async (): Promise<Product[]> => {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                product_media(*),
                profiles!seller_id(id, full_name, avatar_url, role)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            price: p.price,
            currency: p.currency,
            category: p.category,
            inStock: p.in_stock,
            rating: p.rating,
            reviewCount: p.review_count,
            sellerId: p.seller_id,
            views: p.views || 0,
            author: p.profiles ? {
                id: p.profiles.id,
                fullName: p.profiles.full_name,
                avatarUrl: p.profiles.avatar_url,
                role: p.profiles.role // Ensure role is available
            } : undefined,
            images: p.product_media.filter((m: any) => m.type === 'image').map((m: any) => m.url),
            videoUrl: p.product_media.find((m: any) => m.type === 'video')?.url,
        }));
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
            .in('profiles.role', ['admin', 'super_admin'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            price: p.price,
            currency: p.currency,
            category: p.category,
            inStock: p.in_stock,
            rating: p.rating,
            reviewCount: p.review_count,
            sellerId: p.seller_id,
            views: p.views || 0,
            author: p.profiles ? {
                id: p.profiles.id,
                fullName: p.profiles.full_name,
                avatarUrl: p.profiles.avatar_url,
                role: p.profiles.role
            } : undefined,
            images: p.product_media.filter((m: any) => m.type === 'image').map((m: any) => m.url),
            videoUrl: p.product_media.find((m: any) => m.type === 'video')?.url,
        }));
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

        if (error) throw error;

        return data.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            price: p.price,
            currency: p.currency,
            category: p.category,
            inStock: p.in_stock,
            rating: p.rating,
            reviewCount: p.review_count,
            sellerId: p.seller_id,
            views: p.views || 0,
            author: p.profiles ? {
                id: p.profiles.id,
                fullName: p.profiles.full_name,
                avatarUrl: p.profiles.avatar_url,
            } : undefined,
            images: p.product_media.filter((m: any) => m.type === 'image').map((m: any) => m.url),
            videoUrl: p.product_media.find((m: any) => m.type === 'video')?.url,
        }));
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
                profiles(id, full_name, avatar_url)
            `)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            price: data.price,
            currency: data.currency,
            category: data.category,
            inStock: data.in_stock,
            rating: data.rating,
            reviewCount: data.review_count,
            sellerId: data.seller_id,
            views: data.views || 0,
            author: data.profiles ? {
                id: data.profiles.id,
                fullName: data.profiles.full_name,
                avatarUrl: data.profiles.avatar_url,
            } : undefined,
            images: data.product_media.filter((m: any) => m.type === 'image').map((m: any) => m.url),
            videoUrl: data.product_media.find((m: any) => m.type === 'video')?.url,
        };
    },

    /**
     * Fetch reels (products with videos)
     */
    getReels: async (): Promise<ReelItem[]> => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                product_media!inner(*),
                profiles!seller_id(id, full_name, avatar_url)
            `)
            .eq('product_media.type', 'video');

        if (error) throw error;

        // Fetch meta information for each reel (likes, comments, etc.)
        const reels = await Promise.all(
            data.filter((p: any) => p.product_media.some((m: any) => m.type === 'video'))
                .map(async (p: any) => {
                    const videoMedia = p.product_media.find((m: any) => m.type === 'video');
                    const images = p.product_media.filter((m: any) => m.type === 'image').map((m: any) => m.url);
                    const author = p.profiles ? {
                        id: p.profiles.id,
                        fullName: p.profiles.full_name,
                        avatarUrl: p.profiles.avatar_url,
                    } : undefined;

                    // Fetch real counts - faqat parent comments (replies emas)
                    const [likes, comments, userLike] = await Promise.all([
                        supabase.from('product_likes').select('*', { count: 'exact', head: true }).eq('product_id', p.id),
                        supabase.from('product_comments').select('*', { count: 'exact', head: true }).eq('product_id', p.id).is('parent_comment_id', null),
                        userId ? supabase.from('product_likes').select('*').eq('user_id', userId).eq('product_id', p.id).maybeSingle() : Promise.resolve({ data: null }),
                    ]);

                    return {
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
                            rating: p.rating,
                            reviewCount: p.review_count,
                            sellerId: p.seller_id,
                            images,
                            videoUrl: videoMedia.url,
                            author,
                            commentCount: comments.count || 0, // Add comment count to product if needed
                        },
                        likes: likes.count || 0,
                        commentCount: comments.count || 0,
                        isLiked: !!userLike.data,
                        isFavorite: false, // This will be handled by the store
                    };
                })
        );

        return reels;
    },

    /**
     * Upload media to Supabase Storage
     */
    uploadMedia: async (file: File, bucket: string = 'product-media'): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 10);
        const fileName = `${timestamp}-${randomString}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    /**
     * Create a new product with media
     */
    createProduct: async (
        product: Omit<Product, 'id' | 'images' | 'videoUrl'>,
        media: { file: File, type: 'image' | 'video' }[]
    ) => {
        // 1. Insert product
        const { data: productData, error: productError } = await supabase
            .from('products')
            .insert([{
                seller_id: (product as any).sellerId || (product as any).seller_id,
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
        const mediaInserts = await Promise.all(
            media.map(async (m, index) => {
                const url = await productService.uploadMedia(m.file);
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

        if (error) throw error;
    },

    /**
     * Update an existing product
     */
    updateProduct: async (productId: string, updates: Partial<Product>): Promise<void> => {
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

        if (error) throw error;
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
                .update({ views: (p?.views || 0) + 1 })
                .eq('id', realId);
        } catch (err) {
            // Silently ignore
        }
    }
};
