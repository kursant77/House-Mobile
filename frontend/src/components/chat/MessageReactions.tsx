import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatMessageService, MessageReaction } from "@/services/api/chatMessages";
import { ReactionPicker } from "./ReactionPicker";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageReactionsProps {
  messageId: string;
  className?: string;
}

export function MessageReactions({ messageId, className }: MessageReactionsProps) {
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);

  const { data: reactions = [] } = useQuery({
    queryKey: ["message-reactions", messageId],
    queryFn: () => chatMessageService.getReactions(messageId),
  });

  const addReactionMutation = useMutation({
    mutationFn: (emoji: string) => chatMessageService.addReaction(messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-reactions", messageId] });
    },
  });

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  const reactionEntries = Object.entries(groupedReactions);

  return (
    <div
      className={cn("flex items-center gap-1 mt-1 group/reactions", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Display reactions */}
      {reactionEntries.map(([emoji, emojiReactions]) => (
        <Popover key={emoji}>
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-1 px-2 py-0.5 bg-[#E4EDFD] dark:bg-[#2B2B2B] rounded-full text-xs hover:bg-[#D0DDF0] dark:hover:bg-[#3A3A3A] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                addReactionMutation.mutate(emoji);
              }}
            >
              <span>{emoji}</span>
              <span className="text-[10px] font-medium">
                {emojiReactions.length}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {emoji} {emojiReactions.length} ta
              </p>
              <div className="space-y-1">
                {emojiReactions.map((reaction) => (
                  <div
                    key={reaction.id}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={reaction.user?.avatarUrl} />
                      <AvatarFallback className="text-[10px]">
                        {reaction.user?.fullName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">
                      {reaction.user?.fullName || "Foydalanuvchi"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ))}

      {/* Add reaction button (shown on hover) */}
      {isHovered && (
        <ReactionPicker
          onSelect={(emoji) => addReactionMutation.mutate(emoji)}
        />
      )}
    </div>
  );
}
