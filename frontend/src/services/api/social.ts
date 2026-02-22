import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { Profile } from "@/types/product";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimiter";
import { SupabaseCommentWithUser, SupabaseComment } from "@/types/api";

export const socialService = {
    getProfile: async (userId: string): Promise<Profile | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, bio, address, telegram, instagram, facebook, youtube, role, username')
                .eq('id', userId)
                .single();

            if (error) {
                // Return null on error - error is handled by caller
                return null;
            }

            return {
                id: data.id,
                fullName: data.full_name,
                avatarUrl: data.avatar_url,
                bio: data.bio,
                address: data.address,
                telegram: data.telegram,
                instagram: data.instagram,
                facebook: data.facebook,
                youtube: data.youtube,
                role: data.role,
                username: data.username,
            };
        } catch (e) {
            // Return null on error - error is handled by caller
            return null;
        }
    },

    getStats: async (userId: string) => {
        const [followers, following, products] = await Promise.all([
            supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
            supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', userId),
        ]);

        return {
            followers: followers.count || 0,
            following: following.count || 0,
            posts: products.count || 0,
        };
    },

    isFollowing: async (followingId: string): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', followingId)
            .maybeSingle();

        return !!data;
    },

    follow: async (followingId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");

        const { error } = await supabase
            .from('follows')
            .insert([{ follower_id: user.id, following_id: followingId }]);

        if (error) throw error;
    },

    unfollow: async (followingId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");

        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', followingId);

        if (error) throw error;
    },

    // --- Likes ---
    isLiked: async (productId: string): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data } = await supabase
            .from('product_likes')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .maybeSingle();

        return !!data;
    },

    toggleLike: async (productId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");

        // Rate limiting for likes
        checkRateLimit(`like:${user.id}`, RATE_LIMITS.LIKE);

        const isLiked = await socialService.isLiked(productId);

        if (isLiked) {
            await supabase
                .from('product_likes')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);
        } else {
            await supabase
                .from('product_likes')
                .insert([{ user_id: user.id, product_id: productId }]);
        }
    },

    getLikesCount: async (productId: string): Promise<number> => {
        const { count, error } = await supabase
            .from('product_likes')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', productId);

        if (error) return 0;
        return count || 0;
    },

    // --- Comments ---
    getComments: async (productId: string, parentId?: string | null) => {
        let query = supabase
            .from('product_comments')
            .select(`
                *,
                profiles!user_id(id, full_name, avatar_url, username, role)
            `)
            .eq('product_id', productId);

        // Agar parentId bo'lsa, faqat replies, aks holda parent comments
        if (parentId !== undefined) {
            if (parentId === null) {
                query = query.is('parent_comment_id', null);
            } else {
                query = query.eq('parent_comment_id', parentId);
            }
        } else {
            query = query.is('parent_comment_id', null);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Har bir comment uchun replies sonini olish (bitta query bilan)
        const commentIds = (data as SupabaseCommentWithUser[]).map((c) => c.id);
        const repliesCounts: Record<string, number> = {};

        if (commentIds.length > 0) {
            const { data: repliesData } = await supabase
                .from('product_comments')
                .select('parent_comment_id')
                .in('parent_comment_id', commentIds);

            if (repliesData) {
                repliesData.forEach((r) => {
                    const parentId = r.parent_comment_id as string;
                    repliesCounts[parentId] = (repliesCounts[parentId] || 0) + 1;
                });
            }
        }

        return (data as SupabaseCommentWithUser[]).map((c) => ({
            id: c.id,
            userId: c.user_id,
            text: c.text || c.content,
            createdAt: c.created_at,
            repliesCount: repliesCounts[c.id] || 0,
            user: {
                id: c.profiles?.id || '',
                fullName: c.profiles?.full_name || '',
                username: c.profiles?.username || '',
                avatarUrl: c.profiles?.avatar_url || '',
                role: c.profiles?.role || 'user',
            }
        }));
    },

    // Get comment replies
    getCommentReplies: async (commentId: string) => {
        const { data, error } = await supabase
            .from('product_comments')
            .select(`
                *,
                profiles!user_id(id, full_name, avatar_url, username, role)
            `)
            .eq('parent_comment_id', commentId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return (data as (SupabaseComment & { profiles: any })[] || []).map((c) => ({
            id: c.id,
            userId: c.user_id,
            text: c.text ?? undefined,
            createdAt: c.created_at,
            user: {
                id: c.profiles?.id || '',
                fullName: c.profiles?.full_name || '',
                username: c.profiles?.username || '',
                avatarUrl: c.profiles?.avatar_url || '',
                role: c.profiles?.role || 'user',
            }
        }));
    },

    // Add reply to comment
    addCommentReply: async (commentId: string, text: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");

        // Parent comment ma'lumotlarini olish
        const { data: parentComment, error: parentError } = await supabase
            .from('product_comments')
            .select('product_id, parent_comment_id')
            .eq('id', commentId)
            .single();

        if (parentError) throw parentError;

        // Reply yaratish - parent_comment_id sifatida commentId ni qo'shish
        const { data, error } = await supabase
            .from('product_comments')
            .insert([{
                user_id: user.id,
                product_id: parentComment.product_id,
                parent_comment_id: parentComment.parent_comment_id || commentId,
                text
            }])
            .select(`
                *,
                profiles!user_id(id, full_name, avatar_url, username, role)
            `)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            userId: data.user_id,
            text: data.text,
            createdAt: data.created_at,
            user: {
                id: data.profiles.id,
                fullName: data.profiles.full_name,
                username: data.profiles.username,
                avatarUrl: data.profiles.avatar_url,
                role: data.profiles.role,
            }
        };
    },

    addComment: async (productId: string, text: string, parentCommentId?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");

        // Rate limiting for comments
        checkRateLimit(`comment:${user.id}`, RATE_LIMITS.COMMENT);

        const { data, error } = await supabase
            .from('product_comments')
            .insert([{
                user_id: user.id,
                product_id: productId,
                parent_comment_id: parentCommentId || null,
                text
            }])
            .select(`
                *,
                profiles!user_id(id, full_name, avatar_url, username, role)
            `)
            .single();

        if (error) throw error;

        // Replies count
        const { count } = await supabase
            .from('product_comments')
            .select('*', { count: 'exact', head: true })
            .eq('parent_comment_id', data.id);

        return {
            id: data.id,
            userId: data.user_id,
            text: data.text,
            createdAt: data.created_at,
            repliesCount: count || 0,
            user: {
                id: data.profiles.id,
                fullName: data.profiles.full_name,
                username: data.profiles.username,
                avatarUrl: data.profiles.avatar_url,
                role: data.profiles.role,
            }
        };
    },

    // Get comment count for product
    getCommentCount: async (productId: string): Promise<number> => {
        const { count, error } = await supabase
            .from('product_comments')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', productId)
            .is('parent_comment_id', null);

        if (error) return 0;
        return count || 0;
    },

    // --- Comment Likes ---
    isCommentLiked: async (commentId: string): Promise<boolean> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { data, error } = await supabase
                .from('comment_likes')
                .select('id')
                .eq('user_id', user.id)
                .eq('comment_id', commentId)
                .maybeSingle();

            if (error) {
                logger.error("isCommentLiked error:", error);
                return false;
            }
            return !!data;
        } catch (e) {
            return false;
        }
    },

    toggleCommentLike: async (commentId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Avtorizatsiya zarur");

        // First check if already liked
        const { data: existingLike, error: fetchError } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('comment_id', commentId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingLike) {
            const { error: deleteError } = await supabase
                .from('comment_likes')
                .delete()
                .eq('id', existingLike.id);
            if (deleteError) throw deleteError;
        } else {
            const { error: insertError } = await supabase
                .from('comment_likes')
                .insert([{ user_id: user.id, comment_id: commentId }]);
            if (insertError) throw insertError;
        }
    },

    getCommentLikesCount: async (commentId: string): Promise<number> => {
        const { count, error } = await supabase
            .from('comment_likes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', commentId);

        if (error) return 0;
        return count || 0;
    },

    // --- User Search ---
    searchUsers: async (query: string) => {
        if (!query.trim()) return [];

        // Rate limiting for search
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'anonymous';
        checkRateLimit(`search:${userId}`, RATE_LIMITS.SEARCH);

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, role')
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
            .limit(20);

        if (error) throw error;

        return (data as any[] || []).map((p) => ({
            id: p.id,
            fullName: p.full_name || undefined,
            username: p.username || undefined,
            avatarUrl: p.avatar_url || undefined,
            role: (['user', 'blogger', 'super_admin', 'seller'].includes(p.role) ? p.role : undefined),
        }));
    },

    // Get followed users for current user
    getFollowing: async (): Promise<string[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);

        if (error) return [];
        return data.map((f: { following_id: string }) => f.following_id);
    },

    // Get followed profiles with full data
    getFollowedProfiles: async (): Promise<Profile[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('follows')
            .select(`
                following_id,
                profiles!following_id (
                    id,
                    full_name,
                    username,
                    avatar_url,
                    role
                )
            `)
            .eq('follower_id', user.id);

        if (error) {
            // Return empty array on error
            return [];
        }

        return (data as any[] || [])
            .map((f) => {
                const profileData = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
                if (!profileData) return null;

                return {
                    id: profileData.id,
                    fullName: profileData.full_name ?? undefined,
                    username: profileData.username ?? undefined,
                    avatarUrl: profileData.avatar_url ?? undefined,
                    role: (['user', 'blogger', 'super_admin', 'seller'].includes(profileData.role) ? profileData.role : undefined),
                } as Profile;
            })
            .filter((p): p is Profile => p !== null && p.id !== undefined);
    }
};
