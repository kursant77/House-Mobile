import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { chatMessageService } from "@/services/api/chatMessages";
import { useQueryClient } from "@tanstack/react-query";

interface EditMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  currentContent: string;
  conversationId: string;
}

export function EditMessageDialog({
  open,
  onOpenChange,
  messageId,
  currentContent,
  conversationId,
}: EditMessageDialogProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(currentContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Xabar bo'sh bo'lishi mumkin emas");
      return;
    }

    setIsSubmitting(true);
    try {
      await chatMessageService.editMessage(messageId, content.trim());
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      toast.success("Xabar tahrirlandi");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xabarni tahrirlash</DialogTitle>
          <DialogDescription>
            Xabar matnini o'zgartiring
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Xabar matni..."
            className="min-h-[100px] resize-none"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              "Saqlash"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
