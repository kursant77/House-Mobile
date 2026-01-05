import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/product";

export const socialService = {
    getProfile: async (userId: string): Promise<Profile | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', userId)
                .single();

            if (error) {
                console.error("Profile fetch error:", error);
                return null;
            }

            return {
                id: data.id,
                fullName: data.full_name,
                avatarUrl: data.avatar_url,
            };
        } catch (e) {
            console.error("getProfile unexpected error:", e);
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

        const { data, error } = await supabase
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
    getComments: async (productId: string) => {
        const { data, error } = await supabase
            .from('product_comments')
            .select(`
                *,
                profiles(id, full_name, avatar_url)
            `)
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            text: c.text,
            createdAt: c.created_at,
            user: {
                id: c.profiles.id,
                fullName: c.profiles.full_name,
                avatarUrl: c.profiles.avatar_url,
            }
        }));
    },

    addComment: async (productId: string, text: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");

        const { data, error } = await supabase
            .from('product_comments')
            .insert([{
                user_id: user.id,
                product_id: productId,
                text
            }])
            .select(`
                *,
                profiles(id, full_name, avatar_url)
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
                avatarUrl: data.profiles.avatar_url,
            }
        };
    }
};
