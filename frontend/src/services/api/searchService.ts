/**
 * CENTRALIZED SEARCH SERVICE
 * 
 * Barcha qidiruv funksiyalari shu yerda — server-side Supabase query.
 * Client-side filtrlash ISHLATILMAYDI. Har bir qidiruv to'g'ridan-to'g'ri
 * ma'lumotlar bazasida bajariladi.
 */

import { supabase } from "@/lib/supabase";
import { Product } from "@/types/product";
import { PublicPost } from "@/services/api/posts";
import { SupabaseProductWithRelations, SupabaseProductMedia, SupabasePublicPostWithAuthor } from "@/types/api";
import { mapSupabaseProductsToProducts } from "@/lib/productMapper";
import { socialService } from "@/services/api/social";

// ======================== TYPES ========================

export interface SearchFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

export interface SearchResultItem {
    id: string;
    type: 'product' | 'post' | 'reel' | 'user';
    title: string;
    subtitle?: string;
    imageUrl?: string;
    url: string;
}

export interface ReelSearchResult {
    id: string;
    title: string;
    thumbnailUrl?: string;
    videoUrl: string;
    authorName?: string;
    likes: number;
    views: number;
    productId: string;
}

// ======================== TRENDING (static for now) ========================

const TRENDING_SEARCHES = [
    "iPhone",
    "Samsung",
    "Xiaomi",
    "Noutbuk",
    "AirPods",
    "Smartfon",
    "Planshet",
    "Smart soat",
    "Naushnik",
    "Zaryadka",
];

// ======================== SEARCH SERVICE ========================

export const searchService = {
    /**
     * Server-side mahsulot qidirish — ILIKE + filterlar + pagination
     */
    searchProducts: async (
        query: string,
        filters?: SearchFilters,
        limit = 20,
        offset = 0
    ): Promise<{ products: Product[]; total: number }> => {
        if (!query.trim()) return { products: [], total: 0 };

        let dbQuery = supabase
            .from('products')
            .select(`
                *,
                product_media(*),
                profiles!seller_id(id, full_name, avatar_url, role)
            `, { count: 'exact' })
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .eq('status', 'active');

        // Category filter
        if (filters?.category) {
            dbQuery = dbQuery.eq('category', filters.category);
        }

        // Price filters
        if (filters?.minPrice !== undefined) {
            dbQuery = dbQuery.gte('price', filters.minPrice);
        }
        if (filters?.maxPrice !== undefined) {
            dbQuery = dbQuery.lte('price', filters.maxPrice);
        }

        // Sorting
        switch (filters?.sortBy) {
            case 'price_asc':
                dbQuery = dbQuery.order('price', { ascending: true });
                break;
            case 'price_desc':
                dbQuery = dbQuery.order('price', { ascending: false });
                break;
            case 'popular':
                dbQuery = dbQuery.order('views', { ascending: false, nullsFirst: false });
                break;
            case 'newest':
            default:
                dbQuery = dbQuery.order('created_at', { ascending: false });
                break;
        }

        // Pagination
        dbQuery = dbQuery.range(offset, offset + limit - 1);

        const { data, error, count } = await dbQuery;

        if (error) throw error;

        return {
            products: mapSupabaseProductsToProducts(data as SupabaseProductWithRelations[]),
            total: count || 0,
        };
    },

    /**
     * Server-side post qidirish — ILIKE title + content
     */
    searchPosts: async (query: string, limit = 20): Promise<PublicPost[]> => {
        if (!query.trim()) return [];

        const { data, error } = await supabase
            .from('public_posts')
            .select(`
                *,
                profiles!author_id(id, full_name, avatar_url, role, telegram, instagram, facebook, youtube)
            `)
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return (data as SupabasePublicPostWithAuthor[]).map((p) => ({
            id: p.id,
            author_id: p.author_id,
            content: p.content,
            title: p.title ?? undefined,
            category: p.category,
            views: p.views,
            created_at: p.created_at,
            mediaUrl: p.media_url ?? undefined,
            mediaType: p.media_type ?? undefined,
            author: p.profiles ? {
                id: p.profiles.id,
                fullName: p.profiles.full_name ?? '',
                avatarUrl: p.profiles.avatar_url ?? undefined,
                role: p.profiles.role,
                telegram: p.profiles.telegram ?? undefined,
                instagram: p.profiles.instagram ?? undefined,
                facebook: p.profiles.facebook ?? undefined,
                youtube: p.profiles.youtube ?? undefined,
            } : undefined,
        }));
    },

    /**
     * Server-side reel qidirish — video media bo'lgan mahsulotlar
     */
    searchReels: async (query: string, limit = 20): Promise<ReelSearchResult[]> => {
        if (!query.trim()) return [];

        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                product_media!inner(*),
                profiles!seller_id(id, full_name, avatar_url, role)
            `)
            .eq('product_media.type', 'video')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return (data as SupabaseProductWithRelations[])
            .filter((p) => {
                const media = Array.isArray(p.product_media) ? p.product_media : (p.product_media ? [p.product_media] : []);
                return media.some((m: SupabaseProductMedia) => m.type === 'video');
            })
            .map((p) => {
                const media = Array.isArray(p.product_media) ? p.product_media : (p.product_media ? [p.product_media] : []);
                const videoMedia = media.find((m: SupabaseProductMedia) => m.type === 'video');
                const imageMedia = media.find((m: SupabaseProductMedia) => m.type === 'image');

                return {
                    id: p.id,
                    title: p.title,
                    thumbnailUrl: videoMedia?.thumbnail_url || imageMedia?.url,
                    videoUrl: videoMedia?.url || '',
                    authorName: p.profiles?.full_name ?? undefined,
                    likes: 0, // Will be enriched in UI if needed
                    views: p.views ?? 0,
                    productId: p.id,
                };
            });
    },

    /**
     * Foydalanuvchilarni qidirish — mavjud socialService.searchUsers'ni ishlatadi
     */
    searchUsers: async (query: string, limit = 20) => {
        return socialService.searchUsers(query);
    },

    /**
     * Barcha turlarni parallel qidirish
     */
    searchAll: async (query: string) => {
        if (!query.trim()) return { products: [], posts: [], reels: [], users: [] };

        const [productsResult, posts, reels, users] = await Promise.all([
            searchService.searchProducts(query, undefined, 6),
            searchService.searchPosts(query, 6),
            searchService.searchReels(query, 6),
            searchService.searchUsers(query, 6),
        ]);

        return {
            products: productsResult.products,
            posts,
            reels,
            users,
        };
    },

    /**
     * Trend qidiruvlarni qaytarish (hozircha statik, kelajakda server-side)
     */
    getTrendingSearches: (): string[] => {
        return TRENDING_SEARCHES;
    },

    /**
     * Autocomplete uchun — tarix + trending'dan filter
     */
    getAutocompleteSuggestions: (query: string, history: string[]): string[] => {
        if (!query.trim()) return [];

        const q = query.toLowerCase();
        const fromHistory = history.filter(h => h.toLowerCase().includes(q));
        const fromTrending = TRENDING_SEARCHES.filter(t => t.toLowerCase().includes(q));

        // Dedup
        const seen = new Set<string>();
        const suggestions: string[] = [];

        for (const item of [...fromHistory, ...fromTrending]) {
            const lower = item.toLowerCase();
            if (!seen.has(lower) && lower !== q) {
                seen.add(lower);
                suggestions.push(item);
            }
        }

        return suggestions.slice(0, 8);
    },
};
