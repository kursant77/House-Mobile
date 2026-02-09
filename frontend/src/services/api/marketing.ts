import { supabase } from "@/lib/supabase";
import { Badge, Referral, Story, UserBadge } from "@/types/marketing";

export const marketingService = {
    // --- Referrals ---

    async getReferralStats(): Promise<{ total: number, earnings: number, referrals: Referral[] }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { total: 0, earnings: 0, referrals: [] };

        const { data, error } = await supabase
            .from("referrals")
            .select(`
        *,
        referred_user:referred_user_id(full_name, avatar_url)
      `)
            .eq("referrer_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching referrals:", error);
            return { total: 0, earnings: 0, referrals: [] };
        }

        const referrals = data as Referral[];
        const total = referrals.length;
        const earnings = referrals.reduce((sum, r) => sum + (r.status === 'completed' ? r.reward_amount : 0), 0);

        return { total, earnings, referrals };
    },

    async getReferralLink(): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return "";
        return `${window.location.origin}/auth?ref=${user.id}`;
    },

    // --- Badges ---

    async getMyBadges(): Promise<UserBadge[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from("user_badges")
            .select(`
        *,
        badge:badges(*)
      `)
            .eq("user_id", user.id);

        if (error) {
            console.error("Error fetching badges:", error);
            return [];
        }

        return data as UserBadge[];
    },

    async getAllBadges(): Promise<Badge[]> {
        const { data, error } = await supabase
            .from("badges")
            .select("*");

        if (error) {
            console.error("Error fetching all badges:", error);
            return [];
        }

        return data as Badge[];
    },

    // --- Stories ---

    async getActiveStories(): Promise<Story[]> {
        const { data, error } = await supabase
            .from("stories")
            .select(`
        *,
        user:user_id(full_name, avatar_url, is_verified)
      `)
            .eq("is_active", true)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching stories:", error);
            return [];
        }

        return data as Story[];
    },


    async createStory(mediaUrl: string, mediaType: 'image' | 'video', caption?: string): Promise<Story | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { data, error } = await supabase
            .from("stories")
            .insert({
                user_id: user.id,
                media_url: mediaUrl,
                media_type: mediaType,
                caption,
                expires_at: expiresAt.toISOString(),
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;
        return data as Story;
    },

    async markStoryAsViewed(storyId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        // If not logged in, just ignore
        if (!user) return;

        // Check if already viewed
        // This part might be better handled by a database function or just ignoring duplicate errors
        const { error } = await supabase
            .from("story_views")
            .insert({
                story_id: storyId,
                viewer_id: user.id
            });

        if (error && error.code !== '23505') { // Ignore unique constraint violation
            console.error("Error marking story as viewed:", error);
        }
    },

    // --- Admin Stats ---

    async getMarketingStats(): Promise<{
        totalReferrals: number;
        totalBotUsers: number;
        activeStories: number;
        totalOrders: number;
        pushCampaigns: number;
        totalBadges: number;
        pendingModeration: number;
    }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Avtorizatsiya zarur");

        const [referrals, botUsers, stories, orders, push, badges, moderation] = await Promise.all([
            supabase.from("referrals").select("id", { count: "exact", head: true }),
            supabase.from("telegram_users").select("id", { count: "exact", head: true }),
            supabase.from("stories").select("id", { count: "exact", head: true }).eq("is_active", true),
            supabase.from("orders").select("id", { count: "exact", head: true }),
            supabase.from("push_campaigns").select("id", { count: "exact", head: true }),
            supabase.from("badges").select("id", { count: "exact", head: true }),
            supabase.from("content_reports").select("id", { count: "exact", head: true }).eq("status", "pending")
        ]);

        return {
            totalReferrals: referrals.count || 0,
            totalBotUsers: botUsers.count || 0,
            activeStories: stories.count || 0,
            totalOrders: orders.count || 0,
            pushCampaigns: push.count || 0,
            totalBadges: badges.count || 0,
            pendingModeration: moderation.count || 0
        };
    }
};
