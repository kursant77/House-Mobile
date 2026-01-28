import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatMessageService } from "@/services/api/chatMessages";
import { MessageBubble } from "./MessageBubble";
import { Button } from "@/components/ui/button";
import { Pin, X, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface PinnedMessagesProps {
  conversationId: string;
  trigger?: React.ReactNode;
}

export function PinnedMessages({
  conversationId,
  trigger,
}: PinnedMessagesProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: pinnedMessages = [], isLoading } = useQuery({
    queryKey: ["pinned-messages", conversationId],
    queryFn: () => chatMessageService.getPinnedMessages(conversationId),
    enabled: isOpen,
  });

  const unpinMutation = useMutation({
    mutationFn: (messageId: string) =>
      chatMessageService.unpinMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pinned-messages", conversationId],
      });
      toast.success("Xabar pin'dan olindi");
    },
  });

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
      <Pin className="h-5 w-5" />
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Pin qilingan xabarlar</SheetTitle>
          <SheetDescription>
            {pinnedMessages.length} ta pin qilingan xabar
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : pinnedMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Pin className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Pin qilingan xabarlar yo'q</p>
            </div>
          ) : (
            pinnedMessages.map((message) => (
              <div
                key={message.id}
                className="p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Pin className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {message.sender?.fullName || "Foydalanuvchi"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => unpinMutation.mutate(message.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <MessageBubble message={message} />
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
