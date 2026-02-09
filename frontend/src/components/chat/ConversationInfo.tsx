import { Conversation } from "@/types/chat";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserPlus, UserMinus, Settings, Image as ImageIcon, X } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { conversationService } from "@/services/api/conversations";
import { toast } from "sonner";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { cn } from "@/lib/utils";
import { UserPickerDialog } from "./UserPickerDialog";

interface ConversationInfoProps {
  conversation: Conversation;
  onUpdate?: () => void;
}

export function ConversationInfo({ conversation, onUpdate }: ConversationInfoProps) {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState(conversation.name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);

  const isAdmin = conversation.participants?.some(
    (p) => p.userId === user?.id && p.role === "admin"
  ) || conversation.createdBy === user?.id;

  const handleUpdateGroup = async () => {
    if (!isAdmin) {
      toast.error("Sizda ruxsat yo'q");
      return;
    }

    setIsUpdating(true);
    try {
      await conversationService.updateConversation(conversation.id, {
        name: groupName,
      });
      toast.success("Guruh yangilandi");
      onUpdate?.();
      setIsOpen(false);
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddParticipant = async (userId: string) => {
    if (!isAdmin) {
      toast.error("Sizda ruxsat yo'q");
      return;
    }

    try {
      await conversationService.addParticipant(conversation.id, userId);
      toast.success("Foydalanuvchi qo'shildi");
      onUpdate?.();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!isAdmin) {
      toast.error("Sizda ruxsat yo'q");
      return;
    }

    try {
      await conversationService.removeParticipant(conversation.id, userId);
      toast.success("Foydalanuvchi olib tashlandi");
      onUpdate?.();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Suhbat haqida">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {conversation.type === "group" ? "Guruh ma'lumotlari" : "Suhbat ma'lumotlari"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar and name */}
          <div className="flex flex-col items-center gap-4">
            <Avatar size="xl" borderColor="white">
              <AvatarImage src={conversation.avatarUrl || undefined} />
              <AvatarFallback>
                {conversation.type === "group"
                  ? (conversation.name || "G").charAt(0).toUpperCase()
                  : (conversation.otherParticipant?.fullName || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            {conversation.type === "group" && isAdmin ? (
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Guruh nomi"
                className="text-center"
              />
            ) : (
              <h3 className="text-lg font-semibold">
                {conversation.type === "group"
                  ? conversation.name || "Guruh"
                  : conversation.otherParticipant?.fullName || "Foydalanuvchi"}
              </h3>
            )}

            {conversation.type === "group" && isAdmin && (
              <Button onClick={handleUpdateGroup} disabled={isUpdating}>
                {isUpdating ? "Yangilanmoqda..." : "Saqlash"}
              </Button>
            )}
          </div>

          {/* Participants list */}
          {conversation.type === "group" && conversation.participants && (
            <div className="space-y-2">
              <h4 className="font-semibold">Ishtirokchilar ({conversation.participants.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {conversation.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage src={participant.user?.avatarUrl || undefined} />
                        <AvatarFallback>
                          {participant.user?.fullName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {participant.user?.fullName || "Foydalanuvchi"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {participant.role === "admin" ? "Admin" : "A'zo"}
                        </p>
                      </div>
                    </div>
                    {isAdmin && participant.userId !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveParticipant(participant.userId)}
                        className="h-8 w-8"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowUserPicker(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Foydalanuvchi qo'shish
                  </Button>
                  <UserPickerDialog
                    open={showUserPicker}
                    onOpenChange={setShowUserPicker}
                    onSelect={handleAddParticipant}
                    excludeUserIds={conversation.participants?.map((p) => p.userId) || []}
                    title="Guruhga foydalanuvchi qo'shish"
                  />
                </>
              )}
            </div>
          )}

          {/* Direct conversation info */}
          {conversation.type === "direct" && conversation.otherParticipant && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Avatar size="lg" showStatus={true} isOnline={true}>
                  <AvatarImage src={conversation.otherParticipant.avatarUrl || undefined} />
                  <AvatarFallback>
                    {conversation.otherParticipant.fullName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-semibold">
                      {conversation.otherParticipant.fullName || "Foydalanuvchi"}
                    </p>
                    {conversation.otherParticipant.username && <VerifiedBadge size={12} />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    @{conversation.otherParticipant.username || "foydalanuvchi"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t space-y-2">
            <Button
              variant="destructive"
              className="w-full"
              onClick={async () => {
                if (confirm("Suhbatni o'chirishni xohlaysizmi?")) {
                  try {
                    await conversationService.deleteConversation(conversation.id);
                    toast.success("Suhbat o'chirildi");
                    setIsOpen(false);
                  } catch (error) {
                    toast.error("Xatolik yuz berdi");
                  }
                }
              }}
            >
              Suhbatni o'chirish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
