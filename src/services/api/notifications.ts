import { supabase } from "@/lib/supabase";

export interface Notification {
    id: string;
    created_at: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    target: 'all' | 'admin' | 'seller';
    read_by: string[];
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
                ...notification,
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
    }
};
