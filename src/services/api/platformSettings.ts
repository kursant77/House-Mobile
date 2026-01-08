import { supabase } from "@/lib/supabase";

export interface PlatformSetting {
    id: string;
    setting_key: string;
    setting_value: {
        enabled: boolean;
        [key: string]: any;
    };
    category: string;
    description?: string;
    is_enabled: boolean;
    updated_at: string;
    updated_by?: string;
}

export const platformSettingsApi = {
    // Get all settings
    async getSettings() {
        const { data, error } = await supabase
            .from('platform_settings')
            .select('*')
            .order('category', { ascending: true })
            .order('setting_key', { ascending: true });

        if (error) throw error;
        return data as PlatformSetting[];
    },

    // Get settings by category
    async getSettingsByCategory(category: string) {
        const { data, error } = await supabase
            .from('platform_settings')
            .select('*')
            .eq('category', category)
            .order('setting_key', { ascending: true });

        if (error) throw error;
        return data as PlatformSetting[];
    },

    // Get specific setting
    async getSetting(settingKey: string) {
        const { data, error } = await supabase
            .from('platform_settings')
            .select('*')
            .eq('setting_key', settingKey)
            .single();

        if (error) throw error;
        return data as PlatformSetting;
    },

    // Update setting
    async updateSetting(settingKey: string, enabled: boolean, additionalValues?: Record<string, any>) {
        const { data: { user } } = await supabase.auth.getUser();

        const settingValue = {
            enabled,
            ...additionalValues
        };

        const { data, error } = await supabase
            .from('platform_settings')
            .update({
                setting_value: settingValue,
                is_enabled: enabled,
                updated_by: user?.id
            })
            .eq('setting_key', settingKey)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Toggle setting
    async toggleSetting(settingKey: string) {
        // First get current value
        const { data: current, error: fetchError } = await supabase
            .from('platform_settings')
            .select('setting_value, is_enabled')
            .eq('setting_key', settingKey)
            .single();

        if (fetchError) throw fetchError;

        const newEnabled = !current.is_enabled;

        return platformSettingsApi.updateSetting(settingKey, newEnabled);
    },

    // Create new setting
    async createSetting(setting: {
        setting_key: string;
        category: string;
        description?: string;
        default_enabled?: boolean;
    }) {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('platform_settings')
            .insert({
                setting_key: setting.setting_key,
                setting_value: { enabled: setting.default_enabled ?? true },
                category: setting.category,
                description: setting.description,
                is_enabled: setting.default_enabled ?? true,
                updated_by: user?.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get settings grouped by category
    async getSettingsGrouped() {
        const settings = await this.getSettings();

        const grouped: Record<string, PlatformSetting[]> = {};

        settings.forEach(setting => {
            if (!grouped[setting.category]) {
                grouped[setting.category] = [];
            }
            grouped[setting.category].push(setting);
        });

        return grouped;
    }
};
