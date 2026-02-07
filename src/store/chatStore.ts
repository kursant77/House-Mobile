import { create } from "zustand";
import { Conversation, Message, TypingIndicator, SendMessageData, SupabaseMessage } from "@/types/chat";
import { conversationService } from "@/services/api/conversations";
import { chatMessageService } from "@/services/api/chatMessages";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

interface ChatState {
  // Conversations
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoadingConversations: boolean;

  // Messages
  messages: Map<string, Message[]>; // conversationId -> messages
  isLoadingMessages: boolean;
  hasMoreMessages: Map<string, boolean>; // conversationId -> hasMore

  // Typing indicators
  typingUsers: Map<string, TypingIndicator[]>; // conversationId -> typing users

  // Real-time subscriptions
  subscriptions: Map<string, RealtimeChannel>; // conversationId -> subscription

  // Message batching for real-time updates
  messageBatchQueue: Map<string, Message[]>; // conversationId -> queued messages

  // Actions
  fetchConversations: () => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  fetchMessages: (conversationId: string, before?: string) => Promise<void>;
  sendMessage: (conversationId: string, data: Omit<SendMessageData, 'conversationId'>) => Promise<Message | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  setTyping: (conversationId: string, isTyping: boolean) => Promise<void>;
  subscribeToConversation: (conversationId: string) => () => void;
  unsubscribeFromConversation: (conversationId: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  clearMessages: (conversationId: string) => void;
  updateTypingUsers: (conversationId: string, users: TypingIndicator[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoadingConversations: false,
  messages: new Map(),
  isLoadingMessages: false,
  hasMoreMessages: new Map(),
  typingUsers: new Map(),
  subscriptions: new Map(),
  messageBatchQueue: new Map(),

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const conversations = await conversationService.getConversations();
      set({ conversations, isLoadingConversations: false });
    } catch (_error) {
      set({ isLoadingConversations: false });
    }
  },

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
    if (conversation) {
      // Fetch messages if not already loaded
      const currentMessages = get().messages.get(conversation.id);
      if (!currentMessages || currentMessages.length === 0) {
        get().fetchMessages(conversation.id);
      }
      // Subscribe to real-time updates
      get().subscribeToConversation(conversation.id);
      // Mark as read
      get().markAsRead(conversation.id);
    }
  },

  fetchMessages: async (conversationId, before) => {
    set({ isLoadingMessages: true });
    try {
      const messages = await chatMessageService.getMessages(
        conversationId,
        50,
        before
      );

      const currentMessages = get().messages.get(conversationId) || [];
      const newMessages = before
        ? [...currentMessages, ...messages]
        : messages;

      const updatedMessages = new Map(get().messages);
      updatedMessages.set(conversationId, newMessages);

      // Check if there are more messages
      const hasMore = messages.length === 50;
      const updatedHasMore = new Map(get().hasMoreMessages);
      updatedHasMore.set(conversationId, hasMore);

      set({
        messages: updatedMessages,
        hasMoreMessages: updatedHasMore,
        isLoadingMessages: false,
      });
    } catch (_error) {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (conversationId, data) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Optimistic update - show message immediately
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId,
      senderId: user.id,
      content: data.content || null,
      messageType: data.messageType || "text",
      mediaUrl: data.mediaUrl || null,
      mediaThumbnailUrl: data.mediaThumbnailUrl || null,
      fileName: data.fileName || null,
      fileSize: data.fileSize || null,
      duration: data.duration || null,
      replyToId: data.replyToId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      sender: {
        id: user.id,
        fullName: user.user_metadata?.name || user.email?.split("@")[0] || "You",
        username: null,
        avatarUrl: null,
      },
      isOptimistic: true,
    };

    // Add optimistic message immediately
    get().addMessage(conversationId, optimisticMessage);

    // Update conversation's last message optimistically
    const conversations = get().conversations;
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversationId
        ? { ...conv, lastMessage: optimisticMessage, lastMessageAt: optimisticMessage.createdAt }
        : conv
    );
    set({ conversations: updatedConversations });

    try {
      // Real API call
      const message = await chatMessageService.sendMessage({
        conversationId,
        ...data,
      });

      // Replace optimistic message with real one
      get().updateMessage(conversationId, tempId, {
        ...message,
        isOptimistic: false,
      });

      // Update conversation's last message with real message
      const finalConversations = get().conversations;
      const finalUpdatedConversations = finalConversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, lastMessage: message, lastMessageAt: message.createdAt }
          : conv
      );
      set({ conversations: finalUpdatedConversations });

      return message;
    } catch (_error) {
      // Remove optimistic message on error
      get().deleteMessage(conversationId, tempId);

      // Revert conversation update
      set({ conversations });

      return null;
    }
  },

  markAsRead: async (conversationId) => {
    try {
      await chatMessageService.markAsRead(conversationId);

      // Update local state - mark messages as read
      const messages = get().messages.get(conversationId) || [];
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const updatedMessages = messages.map((msg) => ({
          ...msg,
          isRead: msg.senderId !== user.id ? true : msg.isRead,
          readBy: msg.senderId !== user.id
            ? [...(msg.readBy || []), user.id]
            : msg.readBy,
        }));

        const updatedMessagesMap = new Map(get().messages);
        updatedMessagesMap.set(conversationId, updatedMessages);
        set({ messages: updatedMessagesMap });

        // Update unread count in conversations
        const conversations = get().conversations;
        const updatedConversations = conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        );
        set({ conversations: updatedConversations });
      }
    } catch (error) {
      // Silently fail
    }
  },

  setTyping: async (conversationId, isTyping) => {
    try {
      await chatMessageService.setTyping(conversationId, isTyping);
    } catch (error) {
      // Silently fail
    }
  },

  subscribeToConversation: (conversationId) => {
    // Unsubscribe from existing subscription if any
    get().unsubscribeFromConversation(conversationId);

    // Only subscribe if conversation is current or in recent list
    const { currentConversation, conversations } = get();
    const isCurrent = currentConversation?.id === conversationId;
    const isRecent = conversations.some((c) => c.id === conversationId);

    if (!isCurrent && !isRecent) {
      // Don't subscribe to conversations that are not active
      return () => { };
    }

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as SupabaseMessage;
          // Fetch full message with sender info
          const { data: messageData } = await supabase
            .from("messages")
            .select(
              `
              *,
              profiles!messages_sender_id_fkey(id, full_name, username, avatar_url)
            `
            )
            .eq("id", newMessage.id)
            .single();

          if (messageData && !messageData.deleted_at) {
            const message: Message = {
              id: messageData.id,
              conversationId: messageData.conversation_id,
              senderId: messageData.sender_id,
              content: messageData.content,
              messageType: messageData.message_type,
              mediaUrl: messageData.media_url,
              mediaThumbnailUrl: messageData.media_thumbnail_url,
              fileName: messageData.file_name,
              fileSize: messageData.file_size,
              duration: messageData.duration,
              replyToId: messageData.reply_to_id,
              createdAt: messageData.created_at,
              updatedAt: messageData.updated_at,
              deletedAt: messageData.deleted_at,
              sender: messageData.profiles
                ? {
                  id: messageData.profiles.id,
                  fullName: messageData.profiles.full_name,
                  username: messageData.profiles.username,
                  avatarUrl: messageData.profiles.avatar_url,
                }
                : undefined,
            };

            // Batch message updates (process every 100ms)
            const queue = get().messageBatchQueue;
            const currentQueue = queue.get(conversationId) || [];
            const updatedQueue = new Map(queue);
            updatedQueue.set(conversationId, [...currentQueue, message]);
            set({ messageBatchQueue: updatedQueue });

            // Process batch after short delay
            setTimeout(() => {
              const batch = get().messageBatchQueue.get(conversationId) || [];
              if (batch.length === 0) return;

              // Add all batched messages at once
              batch.forEach((msg: Message) => {
                get().addMessage(conversationId, msg);
              });

              // Clear queue
              const clearedQueue = new Map(get().messageBatchQueue);
              clearedQueue.delete(conversationId);
              set({ messageBatchQueue: clearedQueue });

              // Update conversation's last message (use most recent)
              const lastMessage = batch[batch.length - 1];
              const conversations = get().conversations;
              const updatedConversations = conversations.map((conv) =>
                conv.id === conversationId
                  ? {
                    ...conv,
                    lastMessage,
                    lastMessageAt: lastMessage.createdAt,
                    unreadCount: (conv.unreadCount || 0) + batch.length,
                  }
                  : conv
              );
              set({ conversations: updatedConversations });

              // Mark as read if it's the current conversation
              if (get().currentConversation?.id === conversationId) {
                get().markAsRead(conversationId);
              }
            }, 100);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as SupabaseMessage;
          get().updateMessage(
            conversationId,
            updatedMessage.id,
            updatedMessage.deleted_at
              ? { deletedAt: updatedMessage.deleted_at }
              : { content: updatedMessage.content }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          // Refresh typing users
          const typingUsers = await chatMessageService.getTypingUsers(
            conversationId
          );
          get().updateTypingUsers(conversationId, typingUsers);
        }
      )
      .subscribe();

    const subscriptions = new Map(get().subscriptions);
    subscriptions.set(conversationId, channel);

    set({ subscriptions });

    // Return unsubscribe function
    return () => {
      get().unsubscribeFromConversation(conversationId);
    };
  },

  unsubscribeFromConversation: (conversationId) => {
    const subscriptions = get().subscriptions;
    const channel = subscriptions.get(conversationId);
    if (channel) {
      supabase.removeChannel(channel);
      const updated = new Map(subscriptions);
      updated.delete(conversationId);
      set({ subscriptions: updated });
    }
  },

  addMessage: (conversationId, message) => {
    const messages = get().messages;
    const currentMessages = messages.get(conversationId) || [];
    const updated = new Map(messages);
    updated.set(conversationId, [...currentMessages, message]);
    set({ messages: updated });
  },

  updateMessage: (conversationId, messageId, updates) => {
    const messages = get().messages;
    const currentMessages = messages.get(conversationId) || [];
    const updatedMessages = currentMessages.map((msg) =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    );
    const updated = new Map(messages);
    updated.set(conversationId, updatedMessages);
    set({ messages: updated });
  },

  deleteMessage: (conversationId, messageId) => {
    get().updateMessage(conversationId, messageId, {
      deletedAt: new Date().toISOString(),
    });
  },

  clearMessages: (conversationId) => {
    const messages = new Map(get().messages);
    messages.delete(conversationId);
    set({ messages });
  },

  updateTypingUsers: (conversationId, users) => {
    const typingUsers = new Map(get().typingUsers);
    typingUsers.set(conversationId, users);
    set({ typingUsers });
  },
}));
