import { supabase } from "@/lib/supabase";
import { SupabaseProductMedia } from "@/types/api";

export type ContentType = 'reel' | 'post' | 'product';

export interface ViewHistoryItem {
    id: string;
    user_id: string;
    content_type: ContentType;
    content_id: string;
    viewed_at: string;
}

export interface HistoryItemWithDetails {
    id: string;
    type: ContentType;
    contentId: string;
    title?: string;
    description?: string;
    thumbnail: string;
    author?: {
        id: string;
        name: string;
        avatar: string;
    };
    viewedAt: Date;
    duration?: string;
    price?: number;
    mediaType?: 'image' | 'video';
    videoUrl?: string;
    hasMedia: boolean;
}

class HistoryService {
    /**
     * Add item to view history
     */
    async addToHistory(contentType: ContentType, contentId: string): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.rpc('add_view_history', {
                p_user_id: user.id,
                p_content_type: contentType,
                p_content_id: contentId
            });

            if (error) {
                console.error('Error adding to history:', error);
            }
        } catch (error) {
            console.error('Error in addToHistory:', error);
        }
    }

    /**
     * Get user's view history with filters
     */
    async getHistory(filter: 'all' | ContentType = 'all'): Promise<HistoryItemWithDetails[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            // Build query
            let query = supabase
                .from('view_history')
                .select('*')
                .eq('user_id', user.id)
                .order('viewed_at', { ascending: false })
                .limit(50);

            if (filter !== 'all') {
                query = query.eq('content_type', filter);
            }

            const { data: history, error } = await query;

            if (error) throw error;
            if (!history || history.length === 0) return [];

            // Fetch details for each item
            const detailedHistory = await Promise.all(
                history.map(async (item) => {
                    try {
                        return await this.fetchItemDetails(item);
                    } catch (err) {
                        // Skip failed fetches - return null
                        return null;
                    }
                })
            );

            // Filter out null values (failed fetches)
            return detailedHistory.filter((item): item is HistoryItemWithDetails => item !== null);
        } catch (error) {
            console.error('Error fetching history:', error);
            return [];
        }
    }

    /**
     * Fetch details for a history item
     */
    private async fetchItemDetails(historyItem: ViewHistoryItem): Promise<HistoryItemWithDetails | null> {
        const { content_type, content_id, viewed_at } = historyItem;

        try {
            if (content_type === 'reel' || content_type === 'product') {
                const { data: product, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        product_media(*),
                        profiles(id, full_name, avatar_url, role)
                    `)
                    .eq('id', content_id)
                    .maybeSingle();

                if (error) {
                    // Return null on error
                    return null;
                }
                if (!product) return null;

                // Map media logic exactly as in productService
                const media = (product.product_media || []) as SupabaseProductMedia[];
                const images = media.filter(m => m.type === 'image').map(m => m.url);
                const videoMedia = media.find(m => m.type === 'video');

                const thumbnail = content_type === 'reel'
                    ? (videoMedia?.thumbnail_url || (images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=128&q=75'))
                    : (images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=128&q=75');

                return {
                    id: historyItem.id,
                    type: content_type,
                    contentId: product.id,
                    title: product.title,
                    description: product.description,
                    thumbnail: thumbnail,
                    mediaType: content_type === 'reel' ? 'video' : 'image',
                    videoUrl: content_type === 'reel' ? videoMedia?.url : undefined,
                    hasMedia: true,
                    author: product.profiles ? {
                        id: product.profiles.id,
                        name: product.profiles.full_name || 'House Mobile',
                        avatar: product.profiles.avatar_url || ''
                    } : undefined,
                    viewedAt: new Date(viewed_at),
                    duration: content_type === 'reel' ? '0:45' : undefined,
                    price: product.price
                };
            } else if (content_type === 'post') {
                const { data: post, error } = await supabase
                    .from('public_posts')
                    .select(`
                        *,
                        profiles(id, full_name, avatar_url, role)
                    `)
                    .eq('id', content_id)
                    .maybeSingle();

                if (error) {
                    console.error(`HistoryService: Error fetching post ${content_id}:`, error);
                    return null;
                }
                if (!post) return null;

                return {
                    id: historyItem.id,
                    type: 'post',
                    contentId: post.id,
                    title: post.title,
                    description: post.content,
                    thumbnail: post.media_url || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80',
                    mediaType: post.media_type as 'image' | 'video',
                    videoUrl: post.media_type === 'video' ? post.media_url : undefined,
                    hasMedia: !!post.media_url,
                    author: post.profiles ? {
                        id: post.profiles.id,
                        name: post.profiles.full_name || 'Anonymous',
                        avatar: post.profiles.avatar_url || ''
                    } : undefined,
                    viewedAt: new Date(viewed_at)
                };
            }

            return null;
        } catch (error) {
            // Return null on unexpected error
            return null;
        }
    }

    /**
     * Clear all history
     */
    async clearHistory(): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('view_history')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error clearing history:', error);
            throw error;
        }
    }

    /**
     * Remove specific item from history
     */
    async removeFromHistory(historyId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('view_history')
                .delete()
                .eq('id', historyId);

            if (error) throw error;
        } catch (error) {
            // Silently ignore remove history errors
            throw error;
        }
    }
}

export const historyService = new HistoryService();
