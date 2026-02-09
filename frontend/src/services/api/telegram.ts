import { supabase } from "@/lib/supabase";
import { TelegramUser } from "@/types/marketing";

export const telegramService = {
    /**
     * Get the current user's Telegram connection details
     */
    async getTelegramConnection(): Promise<TelegramUser | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from("telegram_users")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error("Error fetching telegram connection:", error);
            return null;
        }

        return data as TelegramUser;
    },

    /**
     * Generate a deep link to the Telegram bot for connection
     * The bot should handle the /start <token> command to link the user
     */
    async getConnectLink(): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // In a real app, we would generate a short-lived token here
        // For now, we'll use the user ID as a simple token (secure enough for MVP if user ID is UUID)
        const botUsername = "HouseMobileBot"; // Replace with actual bot username
        return `https://t.me/${botUsername}?start=${user.id}`;
    },

    /**
     * Update notification settings
     */
    async updateSettings(settings: TelegramUser['notification_settings']): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase
            .from("telegram_users")
            .update({ notification_settings: settings })
            .eq("user_id", user.id);

        if (error) throw error;
    },

    /**
     * Disconnect Telegram account
     */
    async disconnect(): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase
            .from("telegram_users")
            .delete()
            .eq("user_id", user.id);

        if (error) throw error;
    }
};
