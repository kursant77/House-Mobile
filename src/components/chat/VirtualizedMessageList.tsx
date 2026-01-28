import { useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useChatStore } from "@/store/chatStore";
import { MessageBubble } from "./MessageBubble";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { uz } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";

interface MessageItem {
  message: Message;
  showDateSeparator: boolean;
  showAvatar: boolean;
  isGroup: boolean;
}

interface VirtualizedMessageListProps {
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
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
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

const MessageItem = memo(({ item }: { item: MessageItem }) => {
  return (
    <div>
      {item.showDateSeparator && (
        <DateSeparator date={new Date(item.message.createdAt)} />
      )}
      <MessageBubble
        message={item.message}
        showAvatar={item.showAvatar}
        isGroup={item.isGroup}
      />
    </div>
  );
});

MessageItem.displayName = "MessageItem";

export const VirtualizedMessageList = memo(function VirtualizedMessageList({ 
  conversationId 
}: VirtualizedMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
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

  // Prepare message items with metadata
  const messageItems = useMemo(() => {
    const items: MessageItem[] = [];
    
    conversationMessages.forEach((message, index) => {
      const previousMessage = index > 0 ? conversationMessages[index - 1] : null;
      const nextMessage = index < conversationMessages.length - 1 ? conversationMessages[index + 1] : null;
      
      const showDateSeparator = !previousMessage || !isSameDay(
        new Date(message.createdAt),
        new Date(previousMessage.createdAt)
      );
      
      const showAvatar = isGroup && (
        !message.senderId || 
        nextMessage?.senderId !== message.senderId || 
        !nextMessage || 
        new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() > 300000
      );
      
      items.push({
        message,
        showDateSeparator,
        showAvatar,
        isGroup,
      });
    });
    
    return items;
  }, [conversationMessages, isGroup]);

  // Virtual scrolling
  const virtualizer = useVirtualizer({
    count: messageItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = messageItems[index];
      // Estimate size based on message type
      if (item.message.messageType === "image" || item.message.messageType === "video") {
        return 300; // Media messages are taller
      }
      if (item.message.messageType === "file") {
        return 100;
      }
      if (item.showDateSeparator) {
        return 80; // Date separator adds height
      }
      // Text message - estimate based on content length
      const contentLength = item.message.content?.length || 0;
      const lines = Math.ceil(contentLength / 50);
      return Math.max(60, lines * 24 + 40);
    },
    overscan: 5, // Render 5 extra items outside viewport
    horizontal: false,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messageItems.length > 0 && !isLoadingMessages) {
      const lastIndex = messageItems.length - 1;
      virtualizer.scrollToIndex(lastIndex, {
        align: "end",
        behavior: "smooth",
      });
    }
  }, [messageItems.length, isLoadingMessages, virtualizer]);

  // Load more messages when scrolling to top
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;

    const container = parentRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // If scrolled near top and has more messages
    if (scrollTop < 200 && hasMore && !isLoadingMessages) {
      const oldestMessage = conversationMessages[0];
      if (oldestMessage) {
        fetchMessages(conversationId, oldestMessage.createdAt);
      }
    }
  }, [hasMore, isLoadingMessages, conversationMessages, fetchMessages, conversationId]);

  useEffect(() => {
    const container = parentRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Initial load
  useEffect(() => {
    if (conversationId) {
      const currentMessages = messages.get(conversationId);
      if (!currentMessages || currentMessages.length === 0) {
        fetchMessages(conversationId);
      }
    }
  }, [conversationId, fetchMessages, messages]);

  if (isLoadingMessages && conversationMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (conversationMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Xabarlar yo'q</p>
          <p className="text-xs mt-1">Suhbatni boshlash uchun xabar yuboring</p>
        </div>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start ?? 0 : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0;

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto bg-[#F0F2F5] dark:bg-[#0E1621] custom-scrollbar"
      style={{ contain: "layout style paint" }}
    >
      <div className="px-2 md:px-4 py-1 relative" style={{ height: totalSize }}>
        {hasMore && (
          <div className="flex justify-center py-2 absolute top-0 left-0 right-0 z-10">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {paddingTop > 0 && <div style={{ height: paddingTop }} />}

        {virtualItems.map((virtualItem) => {
          const item = messageItems[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                minHeight: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageItem item={item} />
            </div>
          );
        })}

        {paddingBottom > 0 && <div style={{ height: paddingBottom }} />}

        <div className="absolute bottom-0 left-0 right-0">
          <TypingIndicator typing={typing} />
        </div>
      </div>
    </div>
  );
});
