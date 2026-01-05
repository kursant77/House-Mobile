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
    }
};
