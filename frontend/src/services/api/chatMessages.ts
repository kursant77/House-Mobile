import { supabase } from "@/lib/supabase";
import { handleError } from "@/lib/errorHandler";
import {
  Message,
  SendMessageData,
  SupabaseMessage,
  TypingIndicator,
  SupabaseTypingIndicator,
} from "@/types/chat";

function mapSupabaseMessageToMessage(
  msg: SupabaseMessage & {
    sender?: { id: string, full_name: string | null, username: string | null, avatar_url: string | null };
    reply_to?: Message
  },
  readBy?: string[]
): Message {
  return {
    id: msg.id,
    conversationId: msg.conversation_id,
    senderId: msg.sender_id,
    content: msg.content ?? null,
    messageType: msg.message_type,
    mediaUrl: msg.media_url ?? null,
    mediaThumbnailUrl: msg.media_thumbnail_url ?? null,
    fileName: msg.file_name ?? null,
    fileSize: msg.file_size ?? null,
    duration: msg.duration ?? null,
    replyToId: msg.reply_to_id ?? null,
    createdAt: msg.created_at,
    updatedAt: msg.updated_at,
    deletedAt: msg.deleted_at ?? null,
    sender: msg.sender
      ? {
        id: msg.sender.id,
        fullName: msg.sender.full_name ?? "",
        username: msg.sender.username ?? "",
        avatarUrl: msg.sender.avatar_url ?? null,
      }
      : undefined,
    replyTo: msg.reply_to,
    readBy,
    isRead: readBy ? readBy.length > 0 : false,
  };
}

export const chatMessageService = {
  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    conversationId: string,
    limit: number = 50,
    before?: string
  ): Promise<Message[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("messages")
        .select(
          `
          *,
          sender:profiles!sender_id(id, full_name, username, avatar_url),
          reply_to:messages!reply_to_id(*)
        `
        )
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt("created_at", before);
      }

      const { data: messagesData, error } = await query;

      if (error) throw error;
      if (!messagesData) return [];

      // Get sender profiles
      const senderIds = [...new Set(messagesData.map((m) => m.sender_id))];
      const { data: senderProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", senderIds);

      const senderMap = new Map<string, { id: string, full_name: string | null, username: string | null, avatar_url: string | null }>();
      if (senderProfiles) {
        senderProfiles.forEach((profile) => {
          senderMap.set(profile.id, profile);
        });
      }

      // Get reply messages if any
      const replyIds = messagesData
        .map((m) => m.reply_to_id)
        .filter((id): id is string => id !== null);

      const replyMap = new Map<string, Message>();
      if (replyIds.length > 0) {
        const { data: replyMessages } = await supabase
          .from("messages")
          .select("*")
          .in("id", replyIds);

        if (replyMessages) {
          replyMessages.forEach((msg) => {
            const sender = senderMap.get(msg.sender_id);
            replyMap.set(msg.id, mapSupabaseMessageToMessage({
              ...msg,
              sender: sender ? {
                id: sender.id,
                full_name: sender.full_name ?? null,
                username: sender.username ?? null,
                avatar_url: sender.avatar_url ?? null,
              } : undefined,
            }));
          });
        }
      }

      // Get read receipts for these messages
      const messageIds = messagesData.map((m) => m.id);
      const { data: readsData } = await supabase
        .from("message_reads")
        .select("message_id, user_id")
        .in("message_id", messageIds);

      // Group reads by message_id
      const readsMap = new Map<string, string[]>();
      if (readsData) {
        for (const read of readsData) {
          const existing = readsMap.get(read.message_id) || [];
          existing.push(read.user_id);
          readsMap.set(read.message_id, existing);
        }
      }

      // Map messages with sender and reply data
      const messages = messagesData.map((msg) => {
        const readBy = readsMap.get(msg.id) || [];
        const sender = senderMap.get(msg.sender_id);
        const replyTo = msg.reply_to_id ? replyMap.get(msg.reply_to_id) : undefined;

        return mapSupabaseMessageToMessage(
          {
            ...msg,
            sender: sender ? {
              id: sender.id,
              full_name: sender.full_name ?? null,
              username: sender.username ?? null,
              avatar_url: sender.avatar_url ?? null,
            } : undefined,
            reply_to: replyTo,
          },
          readBy
        );
      });

      // Reverse to show oldest first
      return messages.reverse();
    } catch (error) {
      handleError(error, "getMessages");
      return [];
    }
  },

  /**
   * Send a message
   */
  async sendMessage(data: SendMessageData): Promise<Message> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: messageData, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: data.conversationId,
          sender_id: user.id,
          content: data.content || null,
          message_type: data.messageType,
          media_url: data.mediaUrl || null,
          media_thumbnail_url: data.mediaThumbnailUrl || null,
          file_name: data.fileName || null,
          file_size: data.fileSize || null,
          duration: data.duration || null,
          reply_to_id: data.replyToId || null,
        })
        .select(
          `
          *,
          profiles!messages_sender_id_fkey(id, full_name, username, avatar_url)
        `
        )
        .single();

      if (error) throw error;
      if (!messageData) throw new Error("Failed to create message");

      return mapSupabaseMessageToMessage(messageData);
    } catch (error) {
      handleError(error, "sendMessage");
      throw error;
    }
  },

  /**
   * Edit a message
   */
  async editMessage(messageId: string, content: string): Promise<Message> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: messageData, error } = await supabase
        .from("messages")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", messageId)
        .eq("sender_id", user.id)
        .select(
          `
          *,
          profiles!messages_sender_id_fkey(id, full_name, username, avatar_url)
        `
        )
        .single();

      if (error) throw error;
      if (!messageData) throw new Error("Message not found");

      return mapSupabaseMessageToMessage(messageData);
    } catch (error) {
      handleError(error, "editMessage");
      throw error;
    }
  },

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", messageId)
        .eq("sender_id", user.id);

      if (error) throw error;
    } catch (error) {
      handleError(error, "deleteMessage");
      throw error;
    }
  },

  /**
   * Mark all messages in a conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all unread messages in this conversation
      const { data: unreadMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .not("sender_id", "eq", user.id)
        .is("deleted_at", null);

      if (!unreadMessages || unreadMessages.length === 0) return;

      // Get already read message IDs
      const messageIds = unreadMessages.map((m) => m.id);
      const { data: existingReads } = await supabase
        .from("message_reads")
        .select("message_id")
        .in("message_id", messageIds)
        .eq("user_id", user.id);

      const existingReadIds = new Set(
        existingReads?.map((r) => r.message_id) || []
      );

      // Insert reads for messages that aren't already read
      const readsToInsert = messageIds
        .filter((id) => !existingReadIds.has(id))
        .map((message_id) => ({
          message_id,
          user_id: user.id,
        }));

      if (readsToInsert.length > 0) {
        const { error } = await supabase
          .from("message_reads")
          .insert(readsToInsert);

        if (error) throw error;
      }
    } catch (error) {
      handleError(error, "markAsRead");
    }
  },

  /**
   * Get unread message count for a conversation
   */
  async getUnreadCount(conversationId: string): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Get all messages not sent by current user
      const { data: messages } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .not("sender_id", "eq", user.id)
        .is("deleted_at", null);

      if (!messages || messages.length === 0) return 0;

      const messageIds = messages.map((m) => m.id);

      // Count messages that haven't been read
      const { count } = await supabase
        .from("message_reads")
        .select("*", { count: "exact", head: true })
        .in("message_id", messageIds)
        .eq("user_id", user.id);

      return messages.length - (count || 0);
    } catch (error) {
      handleError(error, "getUnreadCount");
      return 0;
    }
  },

  /**
   * Set typing indicator
   */
  async setTyping(conversationId: string, isTyping: boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isTyping) {
        // Upsert typing indicator
        const { error } = await supabase
          .from("typing_indicators")
          .upsert(
            {
              conversation_id: conversationId,
              user_id: user.id,
              is_typing: true,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "conversation_id,user_id",
            }
          );

        if (error) throw error;
      } else {
        // Remove typing indicator
        const { error } = await supabase
          .from("typing_indicators")
          .update({ is_typing: false })
          .eq("conversation_id", conversationId)
          .eq("user_id", user.id);

        if (error) throw error;
      }
    } catch (error) {
      handleError(error, "setTyping");
    }
  },

  /**
   * Get users currently typing in a conversation
   */
  async getTypingUsers(conversationId: string): Promise<TypingIndicator[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get typing indicators from last 3 seconds
      const threeSecondsAgo = new Date(
        Date.now() - 3000
      ).toISOString();

      const { data: typingData, error } = await supabase
        .from("typing_indicators")
        .select(
          `
          *,
          profiles!typing_indicators_user_id_fkey(id, full_name, username, avatar_url)
        `
        )
        .eq("conversation_id", conversationId)
        .eq("is_typing", true)
        .neq("user_id", user.id)
        .gte("updated_at", threeSecondsAgo);

      if (error) throw error;
      if (!typingData) return [];

      return typingData.map((t: SupabaseTypingIndicator & { profiles?: { id: string, full_name: string | null, username: string | null, avatar_url: string | null } }) => ({
        id: t.id,
        conversationId: t.conversation_id,
        userId: t.user_id,
        isTyping: t.is_typing,
        updatedAt: t.updated_at,
        user: t.profiles
          ? {
            id: t.profiles.id,
            fullName: t.profiles.full_name ?? null,
            username: t.profiles.username ?? null,
            avatarUrl: t.profiles.avatar_url ?? null,
          }
          : undefined,
      }));
    } catch (error) {
      handleError(error, "getTypingUsers");
      return [];
    }
  },

  // ==================== MESSAGE REACTIONS ====================

  /**
   * Add or toggle a reaction to a message
   */
  async addReaction(
    messageId: string,
    emoji: string
  ): Promise<MessageReaction | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Avtorizatsiya zarur");

      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from("message_reactions")
        .select("id")
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        await supabase
          .from("message_reactions")
          .delete()
          .eq("id", existing.id);
        return null;
      }

      // Add new reaction
      const { data, error } = await supabase
        .from("message_reactions")
        .insert([{
          message_id: messageId,
          user_id: user.id,
          emoji,
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        messageId: data.message_id,
        userId: data.user_id,
        emoji: data.emoji,
        createdAt: data.created_at,
      };
    } catch (error) {
      handleError(error, "addReaction");
      return null;
    }
  },

  /**
   * Get reactions for a message
   */
  async getReactions(messageId: string): Promise<MessageReaction[]> {
    try {
      const { data, error } = await supabase
        .from("message_reactions")
        .select(`
          *,
          profiles!user_id(id, full_name, avatar_url)
        `)
        .eq("message_id", messageId);

      if (error) throw error;

      return (data || []).map(r => ({
        id: r.id,
        messageId: r.message_id,
        userId: r.user_id,
        emoji: r.emoji,
        createdAt: r.created_at,
        user: r.profiles ? {
          id: r.profiles.id,
          fullName: r.profiles.full_name,
          avatarUrl: r.profiles.avatar_url,
        } : undefined,
      }));
    } catch (error) {
      handleError(error, "getReactions");
      return [];
    }
  },

  /**
   * Forward a message to another conversation
   */
  async forwardMessage(
    messageId: string,
    targetConversationId: string
  ): Promise<Message | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Avtorizatsiya zarur");

      // Get original message
      const { data: originalMessage, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .single();

      if (fetchError || !originalMessage) {
        throw new Error("Xabar topilmadi");
      }

      // Create forwarded message
      const { data, error } = await supabase
        .from("messages")
        .insert([{
          conversation_id: targetConversationId,
          sender_id: user.id,
          content: originalMessage.content,
          message_type: originalMessage.message_type,
          media_url: originalMessage.media_url,
          media_thumbnail_url: originalMessage.media_thumbnail_url,
          file_name: originalMessage.file_name,
          file_size: originalMessage.file_size,
          duration: originalMessage.duration,
          forwarded_from_id: messageId,
        }])
        .select(`
          *,
          sender:profiles!sender_id(id, full_name, username, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", targetConversationId);

      return mapSupabaseMessageToMessage(data);
    } catch (error) {
      handleError(error, "forwardMessage");
      return null;
    }
  },

  /**
   * Pin a message
   */
  async pinMessage(messageId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Avtorizatsiya zarur");

      const { error } = await supabase
        .from("messages")
        .update({ is_pinned: true })
        .eq("id", messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error, "pinMessage");
      return false;
    }
  },

  /**
   * Unpin a message
   */
  async unpinMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_pinned: false })
        .eq("id", messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error, "unpinMessage");
      return false;
    }
  },

  /**
   * Get pinned messages in a conversation
   */
  async getPinnedMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!sender_id(id, full_name, username, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .eq("is_pinned", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map(msg => mapSupabaseMessageToMessage(msg));
    } catch (error) {
      handleError(error, "getPinnedMessages");
      return [];
    }
  },

  /**
   * Search messages in a conversation
   */
  async searchMessages(
    conversationId: string,
    query: string
  ): Promise<Message[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!sender_id(id, full_name, username, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map(msg => mapSupabaseMessageToMessage(msg));
    } catch (error) {
      handleError(error, "searchMessages");
      return [];
    }
  },
};

// Message Reaction type
export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}
