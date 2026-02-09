import { supabase } from "@/lib/supabase";
import { Badge, UserBadge, BadgeCriteria } from "@/types/marketing";

export const badgesService = {
    /**
     * Get all available badges
     */
    async getAllBadges(): Promise<Badge[]> {
        const { data, error } = await supabase
            .from("badges")
            .select("*")
            .order("created_at");

        if (error) {
            console.error("Error fetching badges:", error);
            return [];
        }

        return data as Badge[];
    },

    /**
     * Get active badges only
     */
    async getActiveBadges(): Promise<Badge[]> {
        const { data, error } = await supabase
            .from("badges")
            .select("*")
            .eq("is_active", true)
            .order("name");

        if (error) {
            console.error("Error fetching active badges:", error);
            return [];
        }

        return data as Badge[];
    },

    /**
     * Get current user's badges
     */
    async getMyBadges(): Promise<UserBadge[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from("user_badges")
            .select(`
                *,
                badge:badges(*)
            `)
            .eq("user_id", user.id)
            .order("awarded_at", { ascending: false });

        if (error) {
            console.error("Error fetching my badges:", error);
            return [];
        }

        return data as UserBadge[];
    },

    /**
     * Get badges for a specific user
     */
    async getUserBadges(userId: string): Promise<UserBadge[]> {
        const { data, error } = await supabase
            .from("user_badges")
            .select(`
                *,
                badge:badges(*)
            `)
            .eq("user_id", userId)
            .order("awarded_at", { ascending: false });

        if (error) {
            console.error("Error fetching user badges:", error);
            return [];
        }

        return data as UserBadge[];
    },

    /**
     * Check and auto-assign badges for current user
     */
    async checkAndAssignBadges(): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.rpc("check_and_assign_badges", {
            p_user_id: user.id
        });

        if (error) {
            console.error("Error checking badges:", error);
        }
    },

    /**
     * Create a new badge (admin only)
     */
    async createBadge(badge: {
        name: string;
        name_uz?: string;
        description?: string;
        description_uz?: string;
        icon_url?: string;
        color?: string;
        criteria?: BadgeCriteria;
    }): Promise<Badge | null> {
        const { data, error } = await supabase
            .from("badges")
            .insert({
                ...badge,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating badge:", error);
            throw error;
        }

        return data as Badge;
    },

    /**
     * Update a badge (admin only)
     */
    async updateBadge(id: string, updates: Partial<Badge>): Promise<void> {
        const { error } = await supabase
            .from("badges")
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq("id", id);

        if (error) {
            console.error("Error updating badge:", error);
            throw error;
        }
    },

    /**
     * Toggle badge active status (admin only)
     */
    async toggleBadge(id: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from("badges")
            .update({
                is_active: isActive,
                updated_at: new Date().toISOString()
            })
            .eq("id", id);

        if (error) throw error;
    },

    /**
     * Manually award a badge to a user (admin only)
     */
    async awardBadge(userId: string, badgeId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from("user_badges")
            .insert({
                user_id: userId,
                badge_id: badgeId,
                awarded_by: user.id
            });

        if (error) {
            if (error.code === '23505') {
                throw new Error("User already has this badge");
            }
            throw error;
        }
    },

    /**
     * Revoke a badge from a user (admin only)
     */
    async revokeBadge(userId: string, badgeId: string): Promise<void> {
        const { error } = await supabase
            .from("user_badges")
            .delete()
            .eq("user_id", userId)
            .eq("badge_id", badgeId);

        if (error) throw error;
    },

    /**
     * Get badge statistics (admin)
     */
    async getBadgeStats(): Promise<Array<{
        badge_id: string;
        badge_name: string;
        count: number;
    }>> {
        const { data, error } = await supabase
            .from("user_badges")
            .select(`
                badge_id,
                badges(name)
            `);

        if (error) {
            console.error("Error fetching badge stats:", error);
            return [];
        }

        // Aggregate by badge
        const statsMap = new Map<string, { badge_id: string; badge_name: string; count: number }>();

        interface UserBadgeWithName {
            badge_id: string;
            badges: { name: string } | null;
        }

        (data as UserBadgeWithName[]).forEach(ub => {
            const existing = statsMap.get(ub.badge_id);
            if (existing) {
                existing.count++;
            } else {
                statsMap.set(ub.badge_id, {
                    badge_id: ub.badge_id,
                    badge_name: ub.badges?.name || 'Unknown',
                    count: 1
                });
            }
        });

        return Array.from(statsMap.values())
            .sort((a, b) => b.count - a.count);
    }
};
