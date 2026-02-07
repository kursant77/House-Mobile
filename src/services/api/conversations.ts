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
  Message,
  SupabaseMessage,
} from "@/types/chat";

function mapSupabaseConversationToConversation(
  conv: SupabaseConversation,
  participants?: ConversationParticipant[],
  lastMessage?: Message,
  unreadCount?: number,
  otherParticipant?: Conversation['otherParticipant']
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
  p: SupabaseConversationParticipant & { user?: { id: string, full_name: string | null, username: string | null, avatar_url: string | null } }
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

      // 1. Get all conversations where user is a participant
      const { data: participantsData, error: participantsError } = await supabase
        .from("conversation_participants")
        .select(`
          *,
          conversation:conversations(*)
        `)
        .eq("user_id", user.id)
        .is("left_at", null)
        .order("joined_at", { ascending: false });

      if (participantsError) throw participantsError;
      if (!participantsData || participantsData.length === 0) return [];

      const conversationIds = participantsData.map((p) => p.conversation_id);

      // 2. Fetch last messages for all conversations at once
      const { data: lastMessagesData } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      const lastMessagesMap = new Map<string, SupabaseMessage>();
      if (lastMessagesData) {
        for (const msg of lastMessagesData) {
          if (!lastMessagesMap.has(msg.conversation_id)) {
            lastMessagesMap.set(msg.conversation_id, msg as SupabaseMessage);
          }
        }
      }

      // 3. Optimized Unread Counts
      const unreadCountsMap = new Map<string, number>();
      const { data: allUnreadMessages } = await supabase
        .from("messages")
        .select("id, conversation_id")
        .in("conversation_id", conversationIds)
        .not("sender_id", "eq", user.id)
        .is("deleted_at", null);

      if (allUnreadMessages && allUnreadMessages.length > 0) {
        const messageIds = allUnreadMessages.map(m => m.id);
        const { data: readIds } = await supabase
          .from("message_reads")
          .select("message_id")
          .eq("user_id", user.id)
          .in("message_id", messageIds);

        const readSet = new Set(readIds?.map(r => r.message_id) || []);
        allUnreadMessages.forEach(msg => {
          if (!readSet.has(msg.id)) {
            const current = unreadCountsMap.get(msg.conversation_id) || 0;
            unreadCountsMap.set(msg.conversation_id, current + 1);
          }
        });
      }

      // 4. Batch fetch other participants for direct chats
      const directConvIds = participantsData
        .filter(p => (p.conversation as SupabaseConversation).type === "direct")
        .map(p => p.conversation_id);

      const otherParticipantsMap = new Map<string, any>();
      if (directConvIds.length > 0) {
        const { data: otherPartsData } = await supabase
          .from("conversation_participants")
          .select(`
            conversation_id,
            user:profiles(id, full_name, username, avatar_url)
          `)
          .in("conversation_id", directConvIds)
          .neq("user_id", user.id)
          .is("left_at", null) as unknown as { data: { conversation_id: string, user: { id: string; full_name: string | null; username: string | null; avatar_url: string | null } | { id: string; full_name: string | null; username: string | null; avatar_url: string | null }[] }[] | null };

        otherPartsData?.forEach(p => {
          const userObj = Array.isArray(p.user) ? p.user[0] : p.user;
          if (userObj) {
            otherParticipantsMap.set(p.conversation_id, {
              id: userObj.id,
              fullName: userObj.full_name ?? null,
              username: userObj.username ?? null,
              avatarUrl: userObj.avatar_url ?? null,
            });
          }
        });
      }

      // Build conversations array
      const conversations: Conversation[] = participantsData
        .map(pData => {
          const conv = pData.conversation as SupabaseConversation;
          if (!conv) return null;

          const lastMessage = lastMessagesMap.get(conv.id);
          const unreadCount = unreadCountsMap.get(conv.id) || 0;
          const otherParticipant = otherParticipantsMap.get(conv.id);

          return mapSupabaseConversationToConversation(
            conv,
            undefined,
            lastMessage ? {
              id: lastMessage.id,
              conversationId: lastMessage.conversation_id,
              senderId: lastMessage.sender_id,
              content: lastMessage.content,
              messageType: lastMessage.message_type,
              mediaUrl: lastMessage.media_url,
              mediaThumbnailUrl: lastMessage.media_thumbnail_url,
              fileName: lastMessage.file_name,
              fileSize: lastMessage.file_size,
              duration: lastMessage.duration,
              replyToId: lastMessage.reply_to_id,
              createdAt: lastMessage.created_at,
              updatedAt: lastMessage.updated_at,
              deletedAt: lastMessage.deleted_at,
            } : undefined,
            unreadCount,
            otherParticipant
          );
        })
        .filter((c): c is Conversation => c !== null);

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

      const userMap = new Map<string, { id: string, full_name: string | null, username: string | null, avatar_url: string | null }>();
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
          });
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
        otherParticipant ?? undefined,
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
            .maybeSingle();

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
      const updateData: Partial<SupabaseConversation> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

      const { error } = await supabase
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
