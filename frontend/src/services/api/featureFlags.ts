import { supabase } from "@/lib/supabase";
import { FeatureFlag, FeatureFlagKey } from "@/types/marketing";

// Cache for feature flags to reduce database calls
let flagsCache: Map<string, boolean> = new Map();
let lastFetch: number = 0;
const CACHE_TTL = 60000; // 1 minute

export const featureFlagsService = {
    /**
     * Get all feature flags
     */
    async getAllFlags(): Promise<FeatureFlag[]> {
        const { data, error } = await supabase
            .from("feature_flags")
            .select("*")
            .order("name");

        if (error) {
            console.error("Error fetching feature flags:", error);
            return [];
        }

        // Update cache
        data?.forEach(flag => {
            flagsCache.set(flag.key, flag.is_enabled);
        });
        lastFetch = Date.now();

        return data as FeatureFlag[];
    },

    /**
     * Check if a specific feature is enabled
     */
    async isEnabled(key: FeatureFlagKey): Promise<boolean> {
        // Check cache first
        if (Date.now() - lastFetch < CACHE_TTL && flagsCache.has(key)) {
            return flagsCache.get(key) ?? true;
        }

        const { data, error } = await supabase
            .from("feature_flags")
            .select("is_enabled")
            .eq("key", key)
            .single();

        if (error) {
            console.error(`Error checking feature flag ${key}:`, error);
            return true; // Default to enabled if error
        }

        flagsCache.set(key, data.is_enabled);
        return data.is_enabled;
    },

    /**
     * Toggle a feature flag (admin only)
     */
    async toggleFlag(key: FeatureFlagKey, enabled: boolean): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from("feature_flags")
            .update({
                is_enabled: enabled,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            })
            .eq("key", key);

        if (error) {
            console.error(`Error toggling feature flag ${key}:`, error);
            throw error;
        }

        // Update cache
        flagsCache.set(key, enabled);
        return enabled;
    },

    /**
     * Update feature flag config (admin only)
     */
    async updateConfig(key: FeatureFlagKey, config: Record<string, unknown>): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from("feature_flags")
            .update({
                config,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            })
            .eq("key", key);

        if (error) throw error;
    },

    /**
     * Clear the flags cache
     */
    clearCache() {
        flagsCache.clear();
        lastFetch = 0;
    },

    /**
     * Get cached flag value synchronously (for use in render functions)
     * Returns true if not in cache
     */
    getCached(key: FeatureFlagKey): boolean {
        return flagsCache.get(key) ?? true;
    }
};
