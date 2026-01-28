import { memo, useMemo } from "react";
import { Conversation } from "@/types/chat";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Video, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { ConversationInfo } from "./ConversationInfo";
import { PinnedMessages } from "./PinnedMessages";
import { MessageSearch } from "./MessageSearch";
import { useUserPresence } from "@/hooks/useUserPresence";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";

interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
}

export const ChatHeader = memo(function ChatHeader({ conversation, onBack }: ChatHeaderProps) {
  const otherUserId = conversation.type === "direct" ? conversation.otherParticipant?.id : undefined;
  const presence = useUserPresence(otherUserId);

  const conversationName = useMemo(() => {
    if (conversation.type === "group") {
      return conversation.name || "Guruh";
    }
    return (
      conversation.otherParticipant?.fullName ||
      conversation.otherParticipant?.username ||
      "Foydalanuvchi"
    );
  }, [conversation.type, conversation.name, conversation.otherParticipant]);

  const conversationAvatar = useMemo(() => {
    if (conversation.type === "group") {
      return conversation.avatarUrl;
    }
    return conversation.otherParticipant?.avatarUrl;
  }, [conversation.type, conversation.avatarUrl, conversation.otherParticipant?.avatarUrl]);

  const avatarInitials = useMemo(() => {
    return conversationName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [conversationName]);

  return (
    <div className="h-14 border-b border-[#E4EDFD] dark:border-[#2B2B2B] bg-[#FFFFFF] dark:bg-[#17212B] flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden shrink-0 h-9 w-9"
            aria-label="Orqaga"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <Avatar 
          size="md" 
          showStatus={conversation.type === "direct"} 
          isOnline={presence?.isOnline || false} 
          className="shrink-0"
        >
          <AvatarImage src={conversationAvatar || undefined} />
          <AvatarFallback>
            {avatarInitials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-sm truncate">{conversationName}</h2>
            {conversation.type === "direct" &&
              conversation.otherParticipant?.username && (
                <VerifiedBadge size={12} />
              )}
          </div>
          {conversation.type === "direct" && (
            <p className="text-xs text-muted-foreground truncate">
              {presence?.isOnline
                ? "Online"
                : presence?.lastSeen
                ? `Oxirgi marta ${formatDistanceToNow(new Date(presence.lastSeen), {
                    addSuffix: true,
                    locale: uz,
                  })}`
                : conversation.otherParticipant?.username || "Foydalanuvchi"}
            </p>
          )}
          {conversation.type === "group" && conversation.participants && (
            <p className="text-xs text-muted-foreground">
              {conversation.participants.length} ta ishtirokchi
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <MessageSearch conversationId={conversation.id} />
        <PinnedMessages conversationId={conversation.id} />
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" aria-label="Qo'ng'iroq">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" aria-label="Video qo'ng'iroq">
          <Video className="h-5 w-5" />
        </Button>
        <ConversationInfo conversation={conversation} />
      </div>
    </div>
  );
});
