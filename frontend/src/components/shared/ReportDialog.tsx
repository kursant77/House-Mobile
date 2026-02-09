import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { moderationService, ReportType, ReportReason } from "@/services/api/moderation";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportType;
  targetId: string;
  targetName?: string;
}

const reportReasons: { value: ReportReason; label: string; description: string }[] = [
  { value: "spam", label: "Spam", description: "Reklama yoki takroriy kontent" },
  { value: "inappropriate", label: "Nomunosib kontent", description: "Yoshi kichiklarga mos emas" },
  { value: "harassment", label: "Ta'qib", description: "Tahdid yoki haqorat" },
  { value: "violence", label: "Zo'ravonlik", description: "Shafqatsizlik yoki qo'rqinch" },
  { value: "fake", label: "Soxta", description: "Yolg'on ma'lumot yoki firibgarlik" },
  { value: "copyright", label: "Mualliflik huquqi", description: "Boshqa birovning kontenti" },
  { value: "other", label: "Boshqa", description: "Yuqoridagilarga mos kelmaydi" },
];

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetName,
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Iltimos, sababni tanlang");
      return;
    }

    setIsSubmitting(true);

    try {
      await moderationService.submitReport({
        targetType,
        targetId,
        reason,
        description: description.trim() || undefined,
      });

      toast.success("Shikoyat yuborildi. Rahmat!");
      onOpenChange(false);
      setReason("inappropriate");
      setDescription("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTargetLabel = () => {
    switch (targetType) {
      case "product": return "mahsulot";
      case "post": return "post";
      case "user": return "foydalanuvchi";
      case "comment": return "izoh";
      case "message": return "xabar";
      default: return "kontent";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Shikoyat qilish
          </DialogTitle>
          <DialogDescription>
            {targetName
              ? `"${targetName}" ${getTargetLabel()}ini shikoyat qilish`
              : `Bu ${getTargetLabel()}ni nima uchun shikoyat qilmoqchisiz?`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Sabab</Label>
            <RadioGroup
              value={reason}
              onValueChange={(v) => setReason(v as ReportReason)}
              className="space-y-2"
            >
              {reportReasons.map((r) => (
                <div
                  key={r.value}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                  onClick={() => setReason(r.value)}
                >
                  <RadioGroupItem value={r.value} id={r.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={r.value} className="font-medium cursor-pointer">
                      {r.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Qo'shimcha ma'lumot (ixtiyoriy)</Label>
            <Textarea
              id="description"
              placeholder="Batafsil yozing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Bekor qilish
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Yuborilmoqda...
              </>
            ) : (
              "Shikoyat yuborish"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
