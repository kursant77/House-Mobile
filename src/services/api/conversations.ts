import { supabase } from "@/lib/supabase";
import { handleError } from "@/lib/errorHandler";
import {
  Conversation,
  ConversationParticipant,
  CreateDirectConversationData,
  CreateGroupConversationData,
  UpdateConversationData,
  SupabaseConversation,
  SupabaseConversationParticipant,
} from "@/types/chat";

function mapSupabaseConversationToConversation(
  conv: SupabaseConversation,
  participants?: ConversationParticipant[],
  lastMessage?: any,
  unreadCount?: number,
  otherParticipant?: any
): Conversation {
  return {
    id: conv.id,
    type: conv.type,
    name: conv.name ?? null,
    avatarUrl: conv.avatar_url ?? null,
    createdBy: conv.created_by,
    createdAt: conv.created_at,
    updatedAt: conv.updated_at,
    lastMessageAt: conv.last_message_at ?? null,
    participants,
    lastMessage,
    unreadCount,
    otherParticipant,
  };
}

function mapSupabaseParticipantToParticipant(
  p: SupabaseConversationParticipant & { user?: any }
): ConversationParticipant {
  return {
    id: p.id,
    conversationId: p.conversation_id,
    userId: p.user_id,
    joinedAt: p.joined_at,
    leftAt: p.left_at ?? null,
    role: p.role,
    mutedUntil: p.muted_until ?? null,
    user: p.user
      ? {
          id: p.user.id,
          fullName: p.user.full_name ?? null,
          username: p.user.username ?? null,
          avatarUrl: p.user.avatar_url ?? null,
        }
      : undefined,
  };
}

export const conversationService = {
  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all conversations where user is a participant
      const { data: participantsData, error: participantsError } = await supabase
        .from("conversation_participants")
        .select(
          `
          *,
          conversation:conversations(*)
        `
        )
        .eq("user_id", user.id)
        .is("left_at", null)
        .order("joined_at", { ascending: false });

      if (participantsError) throw participantsError;
      if (!participantsData) return [];

      // Get conversation IDs
      const conversationIds = participantsData.map((p) => p.conversation_id);

      // Get last messages for each conversation
      const { data: lastMessagesData } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      // Group last messages by conversation_id
      const lastMessagesMap = new Map<string, any>();
      if (lastMessagesData) {
        for (const msg of lastMessagesData) {
          if (!lastMessagesMap.has(msg.conversation_id)) {
            lastMessagesMap.set(msg.conversation_id, msg);
          }
        }
      }

      // Get unread counts
      const { data: unreadCountsData } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .is("deleted_at", null)
        .not("sender_id", "eq", user.id);

      const unreadCountsMap = new Map<string, number>();
      if (unreadCountsData) {
        // Get messages that haven't been read by current user
        for (const msg of unreadCountsData) {
          const { count } = await supabase
            .from("message_reads")
            .select("*", { count: "exact", head: true })
            .eq("message_id", msg.id)
            .eq("user_id", user.id)
            .single();

          if (!count || count === 0) {
            const current = unreadCountsMap.get(msg.conversation_id) || 0;
            unreadCountsMap.set(msg.conversation_id, current + 1);
          }
        }
      }

      // Build conversations array
      const conversations: Conversation[] = [];

      for (const participantData of participantsData) {
        const conv = participantData.conversation as SupabaseConversation;
        if (!conv) continue;

        const lastMessage = lastMessagesMap.get(conv.id);
        const unreadCount = unreadCountsMap.get(conv.id) || 0;

        // For direct conversations, get the other participant
        let otherParticipant = null;
        if (conv.type === "direct") {
          const { data: otherParticipantsData } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.id)
            .neq("user_id", user.id)
            .is("left_at", null)
            .limit(1)
            .single();

          if (otherParticipantsData?.user_id) {
            const { data: otherProfile } = await supabase
              .from("profiles")
              .select("id, full_name, username, avatar_url")
              .eq("id", otherParticipantsData.user_id)
              .single();

            if (otherProfile) {
              otherParticipant = {
                id: otherProfile.id,
                fullName: otherProfile.full_name ?? null,
                username: otherProfile.username ?? null,
                avatarUrl: otherProfile.avatar_url ?? null,
              };
            }
          }
        }

        conversations.push(
          mapSupabaseConversationToConversation(
            conv,
            undefined,
            lastMessage,
            unreadCount,
            otherParticipant
          )
        );
      }

      // Sort by last_message_at
      return conversations.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });
    } catch (error) {
      handleError(error, "getConversations");
      return [];
    }
  },

  /**
   * Get a single conversation with all details
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get conversation
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (convError) throw convError;
      if (!convData) return null;

      // Get participants
      const { data: participantsData, error: participantsError } = await supabase
        .from("conversation_participants")
        .select("*")
        .eq("conversation_id", conversationId)
        .is("left_at", null);

      if (participantsError) throw participantsError;

      // Get user profiles for participants
      const userIds = participantsData?.map((p) => p.user_id) || [];
      const { data: userProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);

      const userMap = new Map<string, any>();
      if (userProfiles) {
        userProfiles.forEach((profile) => {
          userMap.set(profile.id, profile);
        });
      }

      const participants = participantsData
        ? participantsData.map((p) => {
            const user = userMap.get(p.user_id);
            return mapSupabaseParticipantToParticipant({
              ...p,
              user: user ? {
                id: user.id,
                full_name: user.full_name ?? null,
                username: user.username ?? null,
                avatar_url: user.avatar_url ?? null,
              } : undefined,
            } as any);
          })
        : [];

      // Get last message
      const { data: lastMessageData } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Get unread count
      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .not("sender_id", "eq", user.id);

      // For direct conversations, get other participant
      let otherParticipant = null;
      if (convData.type === "direct") {
        const otherParticipantData = participants.find((p) => p.userId !== user.id);
        if (otherParticipantData?.user) {
          otherParticipant = {
            id: otherParticipantData.user.id,
            fullName: otherParticipantData.user.fullName ?? null,
            username: otherParticipantData.user.username ?? null,
            avatarUrl: otherParticipantData.user.avatarUrl ?? null,
          };
        }
      }

      return mapSupabaseConversationToConversation(
        convData as SupabaseConversation,
        participants,
        lastMessageData || undefined,
        unreadCount || 0,
        otherParticipant
      );
    } catch (error) {
      handleError(error, "getConversation");
      return null;
    }
  },

  /**
   * Create a direct (1-on-1) conversation
   */
  async createDirectConversation(
    data: CreateDirectConversationData
  ): Promise<Conversation> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id)
        .is("left_at", null);

      if (existing) {
        for (const p of existing) {
          const { data: otherParticipant } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("conversation_id", p.conversation_id)
            .eq("user_id", data.userId)
            .is("left_at", null)
            .single();

          if (otherParticipant) {
            // Conversation exists, return it
            const conv = await this.getConversation(p.conversation_id);
            if (conv) return conv;
          }
        }
      }

      // Create new conversation (without select to avoid RLS issues)
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .insert({
          type: "direct",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (convError) throw convError;
      if (!convData?.id) throw new Error("Failed to create conversation");

      // Add both participants
      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: convData.id, user_id: user.id },
          { conversation_id: convData.id, user_id: data.userId },
        ]);

      if (participantsError) {
        // Clean up conversation if participants insert fails
        await supabase.from("conversations").delete().eq("id", convData.id);
        throw participantsError;
      }

      // Now fetch the full conversation (participants are added, so RLS should work)
      const conv = await this.getConversation(convData.id);
      if (!conv) throw new Error("Failed to retrieve created conversation");
      return conv;
    } catch (error) {
      handleError(error, "createDirectConversation");
      throw error;
    }
  },

  /**
   * Create a group conversation
   */
  async createGroupConversation(
    data: CreateGroupConversationData
  ): Promise<Conversation> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create conversation (only select ID to avoid RLS issues)
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .insert({
          type: "group",
          name: data.name,
          avatar_url: data.avatarUrl,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (convError) throw convError;
      if (!convData?.id) throw new Error("Failed to create conversation");

      // Add participants (creator is admin, others are members)
      const participants = [
        { conversation_id: convData.id, user_id: user.id, role: "admin" },
        ...data.userIds.map((userId) => ({
          conversation_id: convData.id,
          user_id: userId,
          role: "member" as const,
        })),
      ];

      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .insert(participants);

      if (participantsError) {
        // Clean up conversation if participants insert fails
        await supabase.from("conversations").delete().eq("id", convData.id);
        throw participantsError;
      }

      // Now fetch the full conversation (participants are added, so RLS should work)
      const conv = await this.getConversation(convData.id);
      if (!conv) throw new Error("Failed to retrieve created conversation");
      return conv;
    } catch (error) {
      handleError(error, "createGroupConversation");
      throw error;
    }
  },

  /**
   * Add a participant to a group conversation
   */
  async addParticipant(
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("conversation_participants")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role: "member",
        });

      if (error) throw error;
    } catch (error) {
      handleError(error, "addParticipant");
      throw error;
    }
  },

  /**
   * Remove a participant from a conversation
   */
  async removeParticipant(
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("conversation_participants")
        .update({ left_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      handleError(error, "removeParticipant");
      throw error;
    }
  },

  /**
   * Update conversation (name, avatar)
   */
  async updateConversation(
    conversationId: string,
    updates: UpdateConversationData
  ): Promise<Conversation> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

      const { data, error } = await supabase
        .from("conversations")
        .update(updateData)
        .eq("id", conversationId)
        .select()
        .single();

      if (error) throw error;

      const conv = await this.getConversation(conversationId);
      if (!conv) throw new Error("Failed to retrieve updated conversation");
      return conv;
    } catch (error) {
      handleError(error, "updateConversation");
      throw error;
    }
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
    } catch (error) {
      handleError(error, "deleteConversation");
      throw error;
    }
  },

  /**
   * Mute a conversation
   */
  async muteConversation(
    conversationId: string,
    until: string | null
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("conversation_participants")
        .update({ muted_until: until })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (error) {
      handleError(error, "muteConversation");
      throw error;
    }
  },

  /**
   * Search conversations
   */
  async searchConversations(query: string): Promise<Conversation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get user's conversations
      const conversations = await this.getConversations();

      // Filter by query (search in name or participant names)
      const lowerQuery = query.toLowerCase();
      return conversations.filter((conv) => {
        if (conv.name?.toLowerCase().includes(lowerQuery)) return true;
        if (conv.otherParticipant?.fullName?.toLowerCase().includes(lowerQuery)) return true;
        if (conv.otherParticipant?.username?.toLowerCase().includes(lowerQuery)) return true;
        if (conv.participants?.some((p) => 
          p.user?.fullName?.toLowerCase().includes(lowerQuery) ||
          p.user?.username?.toLowerCase().includes(lowerQuery)
        )) return true;
        return false;
      });
    } catch (error) {
      handleError(error, "searchConversations");
      return [];
    }
  },
};
