import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { conversationService } from "@/services/api/conversations";
import { chatMessageService } from "@/services/api/chatMessages";
import { Conversation } from "@/types/chat";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ForwardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
}

export function ForwardDialog({ open, onOpenChange, messageId }: ForwardDialogProps) {
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isForwarding, setIsForwarding] = useState(false);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => conversationService.getConversations(),
  });

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (conv.name?.toLowerCase().includes(query)) return true;
    if (conv.otherParticipant?.fullName?.toLowerCase().includes(query)) return true;
    if (conv.otherParticipant?.username?.toLowerCase().includes(query)) return true;
    return false;
  });

  const toggleConversation = (conversationId: string) => {
    setSelectedConversations((prev) =>
      prev.includes(conversationId)
        ? prev.filter((id) => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleForward = async () => {
    if (selectedConversations.length === 0) {
      toast.error("Kamida bitta suhbat tanlang");
      return;
    }

    setIsForwarding(true);
    try {
      await Promise.all(
        selectedConversations.map((convId) =>
          chatMessageService.forwardMessage(messageId, convId)
        )
      );
      toast.success(
        `Xabar ${selectedConversations.length} ta suhbatga yuborildi`
      );
      onOpenChange(false);
      setSelectedConversations([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xabarni yuborish</DialogTitle>
          <DialogDescription>
            Xabarni yubormoqchi bo'lgan suhbatlarni tanlang
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Conversations list */}
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Suhbatlar topilmadi
              </p>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversations.includes(conv.id);
                const name =
                  conv.type === "group"
                    ? conv.name || "Guruh"
                    : conv.otherParticipant?.fullName ||
                      conv.otherParticipant?.username ||
                      "Foydalanuvchi";
                const avatar =
                  conv.type === "group"
                    ? conv.avatarUrl
                    : conv.otherParticipant?.avatarUrl;

                return (
                  <button
                    key={conv.id}
                    onClick={() => toggleConversation(conv.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    <Avatar className="h-10 w-10">
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
                      <p className="font-medium text-sm truncate">{name}</p>
                      {conv.type === "group" && (
                        <p className="text-xs text-muted-foreground">
                          {conv.participants?.length || 0} ta ishtirokchi
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleForward}
            disabled={isForwarding || selectedConversations.length === 0}
          >
            {isForwarding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Yuborilmoqda...
              </>
            ) : (
              `Yuborish (${selectedConversations.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
