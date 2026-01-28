import { memo, useMemo } from "react";
import { Message } from "@/types/chat";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { Check, CheckCheck } from "lucide-react";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { LazyMessageImage } from "./LazyMessageImage";
import { MessageReactions } from "./MessageReactions";
import { EditMessageDialog } from "./EditMessageDialog";
import { ForwardDialog } from "./ForwardDialog";
import { chatMessageService } from "@/services/api/chatMessages";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  isGroup?: boolean;
}

export const MessageBubble = memo(function MessageBubble({ 
  message, 
  showAvatar = false, 
  isGroup = false 
}: MessageBubbleProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isOwnMessage = message.senderId === user?.id;
  const [imageError, setImageError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showForwardDialog, setShowForwardDialog] = useState(false);

  const readReceiptIcon = useMemo(() => {
    if (!isOwnMessage) return null;

    if (message.isRead) {
      return <CheckCheck className="h-3.5 w-3.5 text-blue-500 read-receipt" />;
    }
    if (message.readBy && message.readBy.length > 0) {
      return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground read-receipt" />;
    }
    return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  }, [isOwnMessage, message.isRead, message.readBy]);

  const formattedTime = useMemo(
    () => format(new Date(message.createdAt), "HH:mm", { locale: uz }),
    [message.createdAt]
  );

  const senderInitials = useMemo(() => {
    return message.sender?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  }, [message.sender?.fullName]);

  const renderMessageContent = () => {
    if (message.deletedAt) {
      return (
        <p className="text-sm text-muted-foreground italic">
          Xabar o'chirildi
        </p>
      );
    }

    switch (message.messageType) {
      case "image":
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <LazyMessageImage
                src={message.mediaUrl}
                thumbnail={message.mediaThumbnailUrl || undefined}
                alt="Xabar rasmi"
                className="cursor-pointer"
                maxWidth={320}
              />
            )}
            {message.content && (
              <p className="text-sm leading-[1.4] whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        );

      case "video":
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <video
                src={message.mediaUrl}
                controls
                className="rounded-[12px] max-w-[280px] md:max-w-[320px]"
                poster={message.mediaThumbnailUrl || undefined}
              />
            )}
            {message.content && (
              <p className="text-sm leading-[1.4] whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        );

      case "voice":
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 dark:bg-primary/20 rounded-full">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium">
                {message.duration ? `${Math.floor(message.duration / 60)}:${String(message.duration % 60).padStart(2, "0")}` : "0:00"}
              </span>
            </div>
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        );

      case "file":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/30 rounded-lg min-w-[200px]">
              <div className="text-2xl">📎</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {message.fileName || "Fayl"}
                </p>
                {message.fileSize && (
                  <p className="text-xs text-muted-foreground">
                    {(message.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>
            {message.content && (
              <p className="text-sm leading-[1.4] whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        );

      default:
        return (
          <p className="text-sm leading-[1.4] whitespace-pre-wrap break-words">
            {message.content || ""}
          </p>
        );
    }
  };

  return (
    <>
      <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "flex gap-2.5 group px-4 py-1.5 hover:bg-transparent transition-colors relative",
            isOwnMessage && "flex-row-reverse"
          )}
        >
          {showAvatar && !isOwnMessage && (
            <Avatar size="sm" className="shrink-0 mt-0.5">
              <AvatarImage src={message.sender?.avatarUrl || undefined} />
              <AvatarFallback>
                {senderInitials}
              </AvatarFallback>
            </Avatar>
          )}

          <div
            className={cn(
              "flex flex-col gap-0.5 max-w-[70%] md:max-w-[65%]",
              isOwnMessage && "items-end"
            )}
          >
            {isGroup && !isOwnMessage && message.sender && (
              <span className="text-[12.5px] font-medium text-muted-foreground px-2 mb-0.5">
                {message.sender.fullName || message.sender.username || "Foydalanuvchi"}
              </span>
            )}

            {message.replyTo && (
              <div
                className={cn(
                  "px-3 py-2 border-l-2 border-primary/50 bg-muted/50 dark:bg-muted/30 rounded-l-[8px] text-xs mb-1.5 max-w-full",
                  isOwnMessage && "border-r-2 border-l-0 rounded-l-0 rounded-r-[8px]"
                )}
              >
                <p className="font-medium truncate text-[12px]">
                  {message.replyTo.sender?.fullName || "Foydalanuvchi"}
                </p>
                <p className="text-muted-foreground truncate text-[11px] mt-0.5">
                  {message.replyTo.content || "Xabar"}
                </p>
              </div>
            )}

            <div
              className={cn(
                "rounded-[12px] px-3 py-2 shadow-sm message-bubble chat-transition inline-block max-w-full",
                isOwnMessage
                  ? "bg-[#3390EC] dark:bg-[#3390EC] text-white rounded-br-[4px]"
                  : "bg-[#E4EDFD] dark:bg-[#2B2B2B] text-foreground rounded-bl-[4px]"
              )}
            >
              {renderMessageContent()}
            </div>

            <div
              className={cn(
                "flex items-center gap-1 text-[11px] text-muted-foreground px-2 mt-0.5",
                isOwnMessage && "flex-row-reverse"
              )}
            >
              <span className="opacity-70">
                {formattedTime}
              </span>
              {readReceiptIcon}
            </div>

            {/* Message Reactions */}
            <MessageReactions messageId={message.id} />
          </div>

          {showAvatar && isOwnMessage && (
            <div className="w-8 shrink-0" />
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Javob berish</ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            if (message.content) {
              navigator.clipboard.writeText(message.content);
              toast.success("Nusxalandi");
            }
          }}
        >
          Nusxa olish
        </ContextMenuItem>
        {isOwnMessage && (
          <>
            <ContextMenuItem onClick={() => setIsEditing(true)}>
              Tahrirlash
            </ContextMenuItem>
            <ContextMenuItem
              className="text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              O'chirish
            </ContextMenuItem>
          </>
        )}
        <ContextMenuItem onClick={() => setShowForwardDialog(true)}>
          Yuborish
        </ContextMenuItem>
        <ContextMenuItem
          onClick={async () => {
            try {
              await chatMessageService.pinMessage(message.id);
              toast.success("Xabar pin qilindi");
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Xatolik yuz berdi"
              );
            }
          }}
        >
          Pin qilish
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>

    {/* Edit Dialog */}
    {isEditing && (
      <EditMessageDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        messageId={message.id}
        currentContent={message.content || ""}
        conversationId={message.conversationId}
      />
    )}

    {/* Delete Confirmation */}
    {showDeleteDialog && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 className="font-semibold mb-2">Xabarni o'chirish?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Bu xabar butunlay o'chiriladi. Bu amalni bekor qilib bo'lmaydi.
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(false)}
            >
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                try {
                  await chatMessageService.deleteMessage(message.id);
                  queryClient.invalidateQueries({
                    queryKey: ["messages", message.conversationId],
                  });
                  toast.success("Xabar o'chirildi");
                  setShowDeleteDialog(false);
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Xatolik yuz berdi"
                  );
                }
              }}
            >
              O'chirish
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Forward Dialog */}
    {showForwardDialog && (
      <ForwardDialog
        open={showForwardDialog}
        onOpenChange={setShowForwardDialog}
        messageId={message.id}
      />
    )}
  </>);
});
