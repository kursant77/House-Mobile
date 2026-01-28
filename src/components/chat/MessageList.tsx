import { useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useChatStore } from "@/store/chatStore";
import { MessageBubble } from "./MessageBubble";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { uz } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageListProps {
  conversationId: string;
}

const DateSeparator = memo(({ date }: { date: Date }) => {
  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) {
      return "Bugun";
    }
    if (isYesterday(date)) {
      return "Kecha";
    }
    return format(date, "d MMMM yyyy", { locale: uz });
  };

  return (
    <div className="flex justify-center my-4">
      <div className="px-3 py-1.5 bg-[#E4EDFD] dark:bg-[#2B2B2B] rounded-full text-[12px] text-muted-foreground font-medium">
        {formatDateSeparator(date)}
      </div>
    </div>
  );
});

DateSeparator.displayName = "DateSeparator";

const TypingIndicator = memo(({ typing }: { typing: any[] }) => {
  if (typing.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1 px-3 py-2 bg-[#E4EDFD] dark:bg-[#2B2B2B] rounded-[12px] rounded-bl-[4px]">
        <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
      </div>
      <span className="text-[11px] text-muted-foreground">
        {typing.length === 1
          ? `${typing[0].user?.fullName || "Foydalanuvchi"} yozmoqda...`
          : `${typing.length} ta foydalanuvchi yozmoqda...`}
      </span>
    </div>
  );
});

TypingIndicator.displayName = "TypingIndicator";

export const MessageList = memo(function MessageList({ conversationId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    isLoadingMessages,
    hasMoreMessages,
    fetchMessages,
    typingUsers,
    currentConversation,
  } = useChatStore();

  const conversationMessages = useMemo(
    () => messages.get(conversationId) || [],
    [messages, conversationId]
  );
  
  const hasMore = useMemo(
    () => hasMoreMessages.get(conversationId) || false,
    [hasMoreMessages, conversationId]
  );
  
  const typing = useMemo(
    () => typingUsers.get(conversationId) || [],
    [typingUsers, conversationId]
  );
  
  const isGroup = useMemo(
    () => currentConversation?.type === "group",
    [currentConversation?.type]
  );

  useEffect(() => {
    if (conversationId) {
      const currentMessages = messages.get(conversationId);
      if (!currentMessages || currentMessages.length === 0) {
        fetchMessages(conversationId);
      }
    }
  }, [conversationId, fetchMessages, messages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationMessages.length]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const isNearTop = container.scrollTop < 100;

    if (isNearTop && hasMore && !isLoadingMessages) {
      const oldestMessage = conversationMessages[0];
      if (oldestMessage) {
        fetchMessages(conversationId, oldestMessage.createdAt);
      }
    }
  }, [hasMore, isLoadingMessages, conversationMessages, fetchMessages, conversationId]);

  const shouldShowDateSeparator = useCallback((currentMessage: any, previousMessage: any) => {
    if (!previousMessage) return true;
    return !isSameDay(
      new Date(currentMessage.createdAt),
      new Date(previousMessage.createdAt)
    );
  }, []);

  const shouldShowAvatar = useCallback((
    message: any,
    nextMessage: any,
    isGroup: boolean
  ) => {
    if (!isGroup) return false;
    return !message.senderId || 
      (nextMessage?.senderId !== message.senderId || 
       !nextMessage || 
       new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() > 300000);
  }, []);

  if (isLoadingMessages && conversationMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-[#F0F2F5] dark:bg-[#0E1621] custom-scrollbar"
      style={{ contain: "layout style paint" }}
    >
      <div className="px-2 md:px-4 py-1">
        {hasMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {conversationMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Xabarlar yo'q</p>
              <p className="text-xs mt-1">Suhbatni boshlash uchun xabar yuboring</p>
            </div>
          </div>
        ) : (
          <>
            {conversationMessages.map((message, index) => {
              const previousMessage = index > 0 ? conversationMessages[index - 1] : null;
              const nextMessage = index < conversationMessages.length - 1 ? conversationMessages[index + 1] : null;
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
              const showAvatar = shouldShowAvatar(message, nextMessage, isGroup);

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <DateSeparator date={new Date(message.createdAt)} />
                  )}
                  <MessageBubble
                    message={message}
                    showAvatar={showAvatar}
                    isGroup={isGroup}
                  />
                </div>
              );
            })}
          </>
        )}

        <TypingIndicator typing={typing} />

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});
