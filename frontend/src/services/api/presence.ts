import { supabase } from "@/lib/supabase";
import { handleError } from "@/lib/errorHandler";

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: string | null;
  status?: "online" | "offline" | "away";
}

export const presenceService = {
  /**
   * Update user's online status
   */
  updatePresence: async (isOnline: boolean): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update last_seen in profiles table
      const { error } = await supabase
        .from("profiles")
        .update({
          last_seen: isOnline ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Broadcast presence via Supabase Realtime
      const channel = supabase.channel(`presence:${user.id}`);
      channel.send({
        type: "broadcast",
        event: "presence",
        payload: {
          userId: user.id,
          isOnline,
          lastSeen: isOnline ? new Date().toISOString() : null,
        },
      });
    } catch (error) {
      handleError(error, "updatePresence");
    }
  },

  /**
   * Get user's online status and last seen
   */
  getUserPresence: async (userId: string): Promise<UserPresence | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, last_seen")
        .eq("id", userId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Check if user is online (last_seen within last 5 minutes)
      const lastSeen = data.last_seen ? new Date(data.last_seen) : null;
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const isOnline = lastSeen ? lastSeen > fiveMinutesAgo : false;

      return {
        userId: data.id,
        isOnline,
        lastSeen: data.last_seen,
        status: isOnline ? "online" : "offline",
      };
    } catch (error) {
      handleError(error, "getUserPresence");
      return null;
    }
  },

  /**
   * Subscribe to user presence changes
   */
  subscribeToPresence: (
    userId: string,
    callback: (presence: UserPresence) => void
  ) => {
    const channel = supabase.channel(`presence:${userId}`);

    channel.on("broadcast", { event: "presence" }, (payload) => {
      callback(payload.payload as UserPresence);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Get multiple users' presence
   */
  getUsersPresence: async (userIds: string[]): Promise<Map<string, UserPresence>> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, last_seen")
        .in("id", userIds);

      if (error) throw error;

      const presenceMap = new Map<string, UserPresence>();
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      data?.forEach((profile) => {
        const lastSeen = profile.last_seen ? new Date(profile.last_seen) : null;
        const isOnline = lastSeen ? lastSeen > fiveMinutesAgo : false;

        presenceMap.set(profile.id, {
          userId: profile.id,
          isOnline,
          lastSeen: profile.last_seen,
          status: isOnline ? "online" : "offline",
        });
      });

      return presenceMap;
    } catch (error) {
      handleError(error, "getUsersPresence");
      return new Map();
    }
  },
};
