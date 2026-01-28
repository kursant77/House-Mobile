import { supabase } from "@/lib/supabase";
import { Product } from "@/types/product";
import { SupabaseProductWithRelations } from "@/types/api";

export class WatchLaterService {
    /**
     * Get all watch later items for the current user
     */
    async getWatchLaterItems(): Promise<Product[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('watch_later')
                .select(`
                    product:products(
                        *,
                        product_media(*),
                        author:profiles!seller_id(id, full_name, avatar_url, role)
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map the nested products with media
            return (data as Array<{ product: SupabaseProductWithRelations | SupabaseProductWithRelations[] }> || [])
                .map(item => {
                    const p = Array.isArray(item.product) ? item.product[0] : item.product;
                    if (!p) return null;

                    return {
                        ...p,
                        inStock: p.in_stock,
                        sellerId: p.seller_id,
                        images: p.product_media?.filter(m => m.type === 'image').map(m => m.url) || [],
                        videoUrl: p.product_media?.find(m => m.type === 'video')?.url,
                        author: p.author ? {
                            id: p.author.id,
                            fullName: p.author.full_name,
                            avatarUrl: p.author.avatar_url,
                            role: p.author.role
                        } : undefined
                    };
                })
                .filter((p): p is Product => p !== null);
        } catch (error) {
            // Return empty array on error
            return [];
        }
    }

    /**
     * Add a product to watch later
     */
    async addToWatchLater(productId: string): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error } = await supabase
                .from('watch_later')
                .upsert({
                    user_id: user.id,
                    product_id: productId
                }, { onConflict: 'user_id,product_id' });

            if (error) throw error;
        } catch (error) {
            // Silently ignore add watch later errors
            throw error;
        }
    }

    /**
     * Remove a product from watch later
     */
    async removeFromWatchLater(productId: string): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error } = await supabase
                .from('watch_later')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);

            if (error) throw error;
        } catch (error) {
            console.error('Error removing from watch later:', error);
            throw error;
        }
    }

    /**
     * Check if a product is in watch later
     */
    async isInWatchLater(productId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { data, error } = await supabase
                .from('watch_later')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .maybeSingle();

            if (error) throw error;
            return !!data;
        } catch (error) {
            // Return false on error
            return false;
        }
    }
}

export const watchLaterService = new WatchLaterService();
