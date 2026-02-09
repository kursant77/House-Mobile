import { supabase } from "@/lib/supabase";
import { Referral, ReferralSettings } from "@/types/marketing";

export const referralService = {
    /**
     * Get current user's referral code (creates one if doesn't exist)
     */
    async getMyReferralCode(): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Use the database function to get or create referral code
        const { data, error } = await supabase.rpc("get_or_create_referral_code", {
            p_user_id: user.id
        });

        if (error) {
            console.error("Error getting referral code:", error);
            throw error;
        }

        return data as string;
    },

    /**
     * Generate referral link
     */
    async getReferralLink(): Promise<string> {
        const code = await this.getMyReferralCode();
        return `${window.location.origin}/auth?ref=${code}`;
    },

    /**
     * Get user's referral statistics
     */
    async getMyReferralStats(): Promise<{
        total: number;
        pending: number;
        completed: number;
        earnings: number;
        referrals: Referral[];
    }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { total: 0, pending: 0, completed: 0, earnings: 0, referrals: [] };

        const { data, error } = await supabase
            .from("referrals")
            .select(`
                *,
                referred_user:referred_user_id(full_name, avatar_url)
            `)
            .eq("referrer_id", user.id)
            .not("referred_user_id", "is", null)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching referral stats:", error);
            return { total: 0, pending: 0, completed: 0, earnings: 0, referrals: [] };
        }

        const referrals = data as Referral[];
        const total = referrals.length;
        const pending = referrals.filter(r => r.status === 'registered').length;
        const completed = referrals.filter(r => r.status === 'completed').length;
        const earnings = referrals.reduce((sum, r) => sum + (r.status === 'completed' ? r.reward_amount : 0), 0);

        return { total, pending, completed, earnings, referrals };
    },

    /**
     * Register a referred user (called during signup)
     */
    async registerReferral(referralCode: string, newUserId: string): Promise<boolean> {
        // Find the referral entry by code
        const { data: referral, error: findError } = await supabase
            .from("referrals")
            .select("*")
            .eq("referral_code", referralCode)
            .is("referred_user_id", null)
            .single();

        if (findError || !referral) {
            console.error("Invalid referral code:", referralCode);
            return false;
        }

        // Update the referral with the new user
        const { error: updateError } = await supabase
            .from("referrals")
            .update({
                referred_user_id: newUserId,
                status: 'registered'
            })
            .eq("id", referral.id);

        if (updateError) {
            console.error("Error registering referral:", updateError);
            return false;
        }

        return true;
    },

    /**
     * Get referral settings (admin)
     */
    async getSettings(): Promise<ReferralSettings | null> {
        const { data, error } = await supabase
            .from("referral_settings")
            .select("*")
            .eq("is_active", true)
            .single();

        if (error) {
            console.error("Error fetching referral settings:", error);
            return null;
        }

        return data as ReferralSettings;
    },

    /**
     * Update referral settings (admin only)
     */
    async updateSettings(settings: Partial<ReferralSettings>): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from("referral_settings")
            .update({
                ...settings,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            })
            .eq("is_active", true);

        if (error) throw error;
    },

    /**
     * Get top referrers (admin dashboard)
     */
    async getTopReferrers(limit: number = 10): Promise<Array<{
        referrer_id: string;
        full_name: string;
        avatar_url: string;
        referral_count: number;
        total_earnings: number;
    }>> {
        const { data, error } = await supabase
            .from("referrals")
            .select(`
                referrer_id,
                reward_amount,
                profiles!referrer_id(full_name, avatar_url)
            `)
            .eq("status", "completed");

        if (error) {
            console.error("Error fetching top referrers:", error);
            return [];
        }

        // Aggregate by referrer
        const referrerMap = new Map<string, {
            referrer_id: string;
            full_name: string;
            avatar_url: string;
            referral_count: number;
            total_earnings: number;
        }>();

        interface ReferralWithProfile {
            referrer_id: string;
            reward_amount: number;
            profiles: {
                full_name: string;
                avatar_url: string;
            } | null;
        }

        (data as ReferralWithProfile[]).forEach(r => {
            const existing = referrerMap.get(r.referrer_id);
            if (existing) {
                existing.referral_count++;
                existing.total_earnings += r.reward_amount;
            } else {
                referrerMap.set(r.referrer_id, {
                    referrer_id: r.referrer_id,
                    full_name: r.profiles?.full_name || 'Unknown',
                    avatar_url: r.profiles?.avatar_url || '',
                    referral_count: 1,
                    total_earnings: r.reward_amount
                });
            }
        });

        // Sort by count and return top N
        return Array.from(referrerMap.values())
            .sort((a, b) => b.referral_count - a.referral_count)
            .slice(0, limit);
    },

    /**
     * Get all referrals (admin)
     */
    async getAllReferrals(page: number = 1, pageSize: number = 20): Promise<{
        referrals: Referral[];
        total: number;
    }> {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from("referrals")
            .select(`
                *,
                referrer:referrer_id(full_name, avatar_url),
                referred_user:referred_user_id(full_name, avatar_url)
            `, { count: 'exact' })
            .not("referred_user_id", "is", null)
            .order("created_at", { ascending: false })
            .range(from, to);

        if (error) {
            console.error("Error fetching all referrals:", error);
            return { referrals: [], total: 0 };
        }

        return {
            referrals: data as Referral[],
            total: count || 0
        };
    }
};
