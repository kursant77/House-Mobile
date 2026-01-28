export type ConversationType = 'direct' | 'group';
export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'file';
export type ParticipantRole = 'admin' | 'member';

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatarUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  participants?: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount?: number;
  otherParticipant?: {
    id: string;
    fullName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: string;
  leftAt: string | null;
  role: ParticipantRole;
  mutedUntil: string | null;
  user?: {
    id: string;
    fullName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  messageType: MessageType;
  mediaUrl: string | null;
  mediaThumbnailUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  duration: number | null;
  replyToId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  sender?: {
    id: string;
    fullName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  replyTo?: Message;
  readBy?: string[];
  isRead?: boolean;
  isOptimistic?: boolean;
}

export interface MessageRead {
  id: string;
  messageId: string;
  userId: string;
  readAt: string;
}

export interface TypingIndicator {
  id: string;
  conversationId: string;
  userId: string;
  isTyping: boolean;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface CreateDirectConversationData {
  userId: string;
}

export interface CreateGroupConversationData {
  name: string;
  userIds: string[];
  avatarUrl?: string;
}

export interface SendMessageData {
  conversationId: string;
  content?: string;
  messageType: MessageType;
  mediaUrl?: string;
  mediaThumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  replyToId?: string;
}

export interface UpdateConversationData {
  name?: string;
  avatarUrl?: string;
}

// Supabase response types
export interface SupabaseConversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export interface SupabaseConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  role: ParticipantRole;
  muted_until: string | null;
}

export interface SupabaseMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: MessageType;
  media_url: string | null;
  media_thumbnail_url: string | null;
  file_name: string | null;
  file_size: number | null;
  duration: number | null;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SupabaseMessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface SupabaseTypingIndicator {
  id: string;
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
}
