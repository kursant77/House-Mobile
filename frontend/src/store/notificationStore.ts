import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { notificationService, Notification } from '@/services/api/notifications';
import { supabase } from '@/lib/supabase';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    fetchNotifications: () => Promise<void>;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    subscribe: () => () => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,
            isLoading: false,

            fetchNotifications: async () => {
                set({ isLoading: true });
                try {
                    const notifications = await notificationService.getNotifications();
                    const { data: { user } } = await supabase.auth.getUser();

                    // Get user role from profiles
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user?.id)
                        .maybeSingle();

                    const userRole = profile?.role;

                    // Filter by target
                    const filtered = notifications.filter(n => {
                        if (n.user_id === user?.id) return true; // Targeted to specific user
                        if (n.target === 'all') return true;
                        if (n.target === 'admin' && userRole === 'super_admin') return true;
                        if (n.target === 'seller' && userRole === 'seller') return true;
                        return false;
                    });

                    const unreadCount = filtered.filter(n => !n.read_by.includes(user?.id || '')).length;
                    set({ notifications: filtered, unreadCount, isLoading: false });
                } catch (_error) {
                    // Return empty array on error
                    set({ notifications: [], unreadCount: 0, isLoading: false });
                }
            },

            addNotification: (notification) => {
                const { notifications } = get();
                if (notifications.some(n => n.id === notification.id)) return;

                const newNotifications = [notification, ...notifications];
                set({ notifications: newNotifications, unreadCount: get().unreadCount + 1 });
            },

            markAsRead: async (id) => {
                try {
                    await notificationService.markAsRead(id);
                    const { notifications } = get();
                    const { data: { user } } = await supabase.auth.getUser();

                    const newNotifications = notifications.map(n =>
                        n.id === id ? { ...n, read_by: [...(n.read_by || []), user?.id || ''] } : n
                    );

                    const unreadCount = newNotifications.filter(n => !n.read_by.includes(user?.id || '')).length;
                    set({ notifications: newNotifications, unreadCount });
                } catch (_error) {
                    // Silently ignore mark as read errors
                }
            },

            markAllAsRead: async () => {
                try {
                    await notificationService.markAllAsRead();
                    const { notifications } = get();
                    const { data: { user } } = await supabase.auth.getUser();

                    const newNotifications = notifications.map(n => ({
                        ...n,
                        read_by: n.read_by?.includes(user?.id || '') ? n.read_by : [...(n.read_by || []), user?.id || '']
                    }));

                    set({ notifications: newNotifications, unreadCount: 0 });
                } catch (_error) {
                    // Silently ignore mark all as read errors
                }
            },

            subscribe: () => {
                const channel = supabase
                    .channel('notifications_realtime')
                    .on(
                        'postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'notifications' },
                        async (payload) => {
                            const notification = payload.new as Notification;
                            const { data: { user } } = await supabase.auth.getUser();
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('role')
                                .eq('id', user?.id)
                                .maybeSingle();

                            const userRole = profile?.role;
                            const shouldShow =
                                notification.user_id === user?.id ||
                                notification.target === 'all' ||
                                (notification.target === 'admin' && userRole === 'super_admin') ||
                                (notification.target === 'seller' && userRole === 'seller');

                            if (shouldShow) {
                                get().addNotification(notification);
                            }
                        }
                    )
                    .subscribe();

                return () => {
                    const removeChannel = async () => {
                        try {
                            // Check if the channel is even initialized
                            if (channel) {
                                await supabase.removeChannel(channel);
                            }
                        } catch (err) {
                            // Silently ignore websocket/channel removal errors
                            // which often happen if removing a channel that hasn't finished connecting
                        }
                    };
                    removeChannel();
                };
            },
        }),
        {
            name: 'notification-storage',
            partialize: (state) => ({ notifications: state.notifications, unreadCount: state.unreadCount }),
        }
    )
);
