import { supabase } from "@/lib/supabase";

export interface AdminMessage {
    id: string;
    from_user_id: string;
    to_user_id: string;
    message: string;
    status: 'unread' | 'read' | 'replied' | 'pending';
    source?: 'web' | 'telegram' | 'app';
    created_at: string;
    updated_at: string;
    from_user?: {
        full_name: string;
        avatar_url?: string;
    };
    to_user?: {
        full_name: string;
        avatar_url?: string;
    };
}

export const messagesApi = {
    // Get all messages
    async getMessages() {
        const { data, error } = await supabase
            .from('admin_messages')
            .select(`
        *,
        from_user:from_user_id(full_name, avatar_url),
        to_user:to_user_id(full_name, avatar_url)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as AdminMessage[];
    },

    // Send a message
    async sendMessage(toUserId: string, message: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('admin_messages')
            .insert({
                from_user_id: user.id,
                to_user_id: toUserId,
                message,
                status: 'unread'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update message status
    async updateStatus(messageId: string, status: AdminMessage['status']) {
        const { data, error } = await supabase
            .from('admin_messages')
            .update({ status })
            .eq('id', messageId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete message
    async deleteMessage(messageId: string) {
        const { error } = await supabase
            .from('admin_messages')
            .delete()
            .eq('id', messageId);

        if (error) throw error;
    },

    // Search messages
    async searchMessages(query: string) {
        const { data, error } = await supabase
            .from('admin_messages')
            .select(`
        *,
        from_user:from_user_id(full_name, avatar_url),
        to_user:to_user_id(full_name, avatar_url)
      `)
            .ilike('message', `%${query}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as AdminMessage[];
    },

    // Get message stats
    async getStats() {
        const { count: total } = await supabase
            .from('admin_messages')
            .select('*', { count: 'exact', head: true });

        const { count: pending } = await supabase
            .from('admin_messages')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        const { count: replied } = await supabase
            .from('admin_messages')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'replied');

        return {
            total: total || 0,
            pending: pending || 0,
            replied: replied || 0
        };
    }
};
