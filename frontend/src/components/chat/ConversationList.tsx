import { useState, useMemo, memo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Conversation } from "@/types/chat";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { Search, Loader2 } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { useUserPresence } from "@/hooks/useUserPresence";

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelect: (conversation: Conversation) => void;
  isLoading?: boolean;
}

const ConversationItem = memo(({ 
  conv, 
  isSelected, 
  onSelect 
}: { 
  conv: Conversation; 
  isSelected: boolean; 
  onSelect: (conv: Conversation) => void;
}) => {
  // Get presence for direct conversations only
  const otherUserId = conv.type === "direct" ? conv.otherParticipant?.id : undefined;
  const presence = useUserPresence(otherUserId);

  const getConversationName = (conv: Conversation) => {
    if (conv.type === "group") {
      return conv.name || "Guruh";
    }
    return (
      conv.otherParticipant?.fullName ||
      conv.otherParticipant?.username ||
      "Foydalanuvchi"
    );
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === "group") {
      return conv.avatarUrl;
    }
    return conv.otherParticipant?.avatarUrl;
  };

  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.lastMessage) return "Suhbat boshlandi";
    if (conv.lastMessage.deletedAt) return "Xabar o'chirildi";
    
    switch (conv.lastMessage.messageType) {
      case "image":
        return "📷 Rasm";
      case "video":
        return "🎥 Video";
      case "voice":
        return "🎤 Ovozli xabar";
      case "file":
        return `📎 ${conv.lastMessage.fileName || "Fayl"}`;
      default:
        return conv.lastMessage.content || "Xabar";
    }
  };

  const name = getConversationName(conv);
  const avatar = getConversationAvatar(conv);
  const preview = getLastMessagePreview(conv);

  return (
    <button
      onClick={() => onSelect(conv)}
      className={cn(
        "w-full px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-3 hover:bg-[#F0F2F5] dark:hover:bg-[#242F3D] transition-colors text-left active:bg-[#E4EDFD] dark:active:bg-[#2B2B2B]",
        isSelected && "bg-[#E4EDFD] dark:bg-[#2B2B2B]"
      )}
    >
      <Avatar 
        size="lg" 
        showStatus={conv.type === "direct"} 
        isOnline={presence?.isOnline || false} 
        className="shrink-0"
      >
        <AvatarImage src={avatar || undefined} />
        <AvatarFallback>
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-sm truncate">
            {name}
          </h3>
          {conv.type === "direct" &&
            conv.otherParticipant?.username && (
              <VerifiedBadge size={12} />
            )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground truncate">
            {preview}
          </p>
          {conv.lastMessageAt && (
            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
              {formatDistanceToNow(new Date(conv.lastMessageAt), {
                addSuffix: true,
                locale: uz,
              })}
            </span>
          )}
        </div>
      </div>

      {conv.unreadCount && conv.unreadCount > 0 && (
        <div className="shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-[#3390EC] text-white text-[11px] font-medium flex items-center justify-center">
          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
        </div>
      )}
    </button>
  );
});

ConversationItem.displayName = "ConversationItem";

export const ConversationList = memo(function ConversationList({
  conversations,
  currentConversationId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  const filteredConversations = useMemo(() => {
    if (!debouncedQuery) return conversations;
    const query = debouncedQuery.toLowerCase();
    return conversations.filter((conv) => {
      if (conv.name?.toLowerCase().includes(query)) return true;
      if (conv.otherParticipant?.fullName?.toLowerCase().includes(query)) return true;
      if (conv.otherParticipant?.username?.toLowerCase().includes(query)) return true;
      if (conv.lastMessage?.content?.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [conversations, debouncedQuery]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#FFFFFF] dark:bg-[#17212B]">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-[#F0F2F5] dark:bg-[#242F3D] border-0 rounded-lg"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ contain: "layout style paint" }}>
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">Suhbatlar topilmadi</p>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isSelected={currentConversationId === conv.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
