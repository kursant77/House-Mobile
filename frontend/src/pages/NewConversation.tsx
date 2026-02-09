import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPickerDialog } from "@/components/chat/UserPickerDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, Users } from "lucide-react";
import { conversationService } from "@/services/api/conversations";
import { useChatStore } from "@/store/chatStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function NewConversation() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showUserPicker, setShowUserPicker] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { fetchConversations, setCurrentConversation } = useChatStore();

  const handleUserSelect = async (userId: string) => {
    setIsCreating(true);
    try {
      const conversation = await conversationService.createDirectConversation({
        userId,
      });

      // Refresh conversations list
      await fetchConversations();

      // Set as current conversation
      setCurrentConversation(conversation);

      // Navigate to the conversation
      navigate(`/messages/${conversation.id}`);
      toast.success("Suhbat yaratildi");
    } catch (error: any) {
      toast.error(error.message || "Suhbat yaratishda xatolik yuz berdi");
      setShowUserPicker(true); // Keep dialog open on error
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    navigate("/messages");
  };

  return (
    <div className="flex h-full bg-background">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="rounded-full"
            aria-label="Orqaga"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Yangi suhbat</h1>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Yangi suhbat yarating</h2>
            <p className="text-muted-foreground">
              Suhbat boshlash uchun foydalanuvchi tanlang
            </p>
            <Button
              onClick={() => setShowUserPicker(true)}
              className="mt-4"
              disabled={isCreating}
            >
              {isCreating ? "Yaratilmoqda..." : "Foydalanuvchi tanlash"}
            </Button>
          </div>
        </div>
      </div>

      {/* User Picker Dialog */}
      <UserPickerDialog
        open={showUserPicker}
        onOpenChange={(open) => {
          if (!open && !isCreating) {
            handleCancel();
          } else {
            setShowUserPicker(open);
          }
        }}
        onSelect={handleUserSelect}
        title="Suhbat boshlash uchun foydalanuvchi tanlang"
      />
    </div>
  );
}
