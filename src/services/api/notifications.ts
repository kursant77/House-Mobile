import { supabase } from "@/lib/supabase";

export interface Notification {
    id: string;
    created_at: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    target: 'all' | 'admin' | 'seller' | 'user';
    read_by: string[];
    user_id?: string;
    sender_id?: string;
}

export const notificationService = {
    getNotifications: async (): Promise<Notification[]> => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    sendNotification: async (notification: Omit<Notification, 'id' | 'created_at' | 'read_by'>) => {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                title: notification.title,
                message: notification.message,
                type: notification.type,
                target: notification.target,
                user_id: notification.user_id,
                sender_id: user?.id,
                read_by: []
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    markAsRead: async (notificationId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch current read_by
        const { data: current } = await supabase
            .from('notifications')
            .select('read_by')
            .eq('id', notificationId)
            .single();

        const readBy = current?.read_by || [];
        if (!readBy.includes(user.id)) {
            const { error } = await supabase
                .from('notifications')
                .update({ read_by: [...readBy, user.id] })
                .eq('id', notificationId);

            if (error) throw error;
        }
    },

    deleteNotification: async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /**
     * Mark all notifications as read for current user
     */
    markAllAsRead: async (): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get all unread notifications
        const { data: notifications, error: fetchError } = await supabase
            .from('notifications')
            .select('id, read_by');

        if (fetchError || !notifications) return;

        // Update each notification that hasn't been read by this user
        const updatePromises = notifications
            .filter(n => !n.read_by?.includes(user.id))
            .map(n => 
                supabase
                    .from('notifications')
                    .update({ read_by: [...(n.read_by || []), user.id] })
                    .eq('id', n.id)
            );

        await Promise.all(updatePromises);
    },

    /**
     * Get unread notification count for current user
     */
    getUnreadCount: async (): Promise<number> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const userRole = profile?.role || 'user';

        const { data, error } = await supabase
            .from('notifications')
            .select('id, read_by, target, user_id');

        if (error || !data) return 0;

        // Filter notifications for current user
        const unreadCount = data.filter(n => {
            // Check if user has already read this notification
            if (n.read_by?.includes(user.id)) return false;
            
            // Check if notification is targeted to this user
            if (n.user_id && n.user_id !== user.id) return false;
            
            // Check target role
            if (n.target === 'all') return true;
            if (n.target === 'admin' && userRole === 'super_admin') return true;
            if (n.target === 'user' && userRole === 'user') return true;
            if (n.target === 'seller') return true; // Assuming sellers are users with products
            
            return false;
        }).length;

        return unreadCount;
    },

    /**
     * Get notifications for current user (filtered by role and target)
     */
    getUserNotifications: async (): Promise<Notification[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const userRole = profile?.role || 'user';

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error || !data) return [];

        // Filter notifications for current user
        return data.filter(n => {
            // Direct message to this user
            if (n.user_id === user.id) return true;
            if (n.user_id && n.user_id !== user.id) return false;
            
            // Check target role
            if (n.target === 'all') return true;
            if (n.target === 'admin' && userRole === 'super_admin') return true;
            if (n.target === 'user' && userRole === 'user') return true;
            
            return false;
        });
    },

    /**
     * Get notification preferences for current user
     */
    getPreferences: async (): Promise<NotificationPreferences> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return defaultPreferences;

        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error || !data) return defaultPreferences;

        return {
            email: data.email ?? true,
            push: data.push ?? true,
            orders: data.orders ?? true,
            messages: data.messages ?? true,
            marketing: data.marketing ?? false,
            sound: data.sound ?? true,
        };
    },

    /**
     * Update notification preferences for current user
     */
    updatePreferences: async (preferences: Partial<NotificationPreferences>): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Avtorizatsiya zarur");

        const { error } = await supabase
            .from('notification_preferences')
            .upsert({
                user_id: user.id,
                ...preferences,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id'
            });

        if (error) throw error;
    },

    /**
     * Delete all notifications for current user
     */
    clearAll: async (): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // We don't actually delete, just mark all as read
        await notificationService.markAllAsRead();
    },
};

// Notification Preferences type
export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    orders: boolean;
    messages: boolean;
    marketing: boolean;
    sound: boolean;
}

const defaultPreferences: NotificationPreferences = {
    email: true,
    push: true,
    orders: true,
    messages: true,
    marketing: false,
    sound: true,
};
