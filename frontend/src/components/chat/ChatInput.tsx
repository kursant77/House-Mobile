import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChatStore } from "@/store/chatStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Smile, Mic, X, Video, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { sanitizeFilename } from "@/lib/sanitize";
import { VoiceRecorder } from "./VoiceRecorder";

interface ChatInputProps {
  conversationId: string;
}

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video" | "file";
}

export function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { sendMessage, setTyping } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      setTyping(conversationId, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTyping(conversationId, false);
    }, 1000);
  }, [conversationId, isTyping, setTyping]);

  const handleSend = useCallback(async () => {
    if (!message.trim() && selectedMedia.length === 0) return;

    setUploading(true);

    try {
      if (selectedMedia.length > 0) {
        for (const media of selectedMedia) {
          try {
            const mediaUrl = await uploadMediaToStorage(media.file, media.type);
            
            let thumbnailUrl: string | undefined;
            if (media.type === "video") {
              thumbnailUrl = media.preview;
            }

            await sendMessage(conversationId, {
              content: message.trim() || undefined,
              messageType: media.type,
              mediaUrl,
              mediaThumbnailUrl: thumbnailUrl,
              fileName: media.file.name,
              fileSize: media.file.size,
            });
          } catch (error) {
            toast.error(`${media.file.name} yuklashda xatolik`);
          }
        }
      } else {
        await sendMessage(conversationId, {
          content: message.trim(),
          messageType: "text",
        });
      }

      setMessage("");
      setSelectedMedia([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      if (isTyping) {
        setIsTyping(false);
        setTyping(conversationId, false);
      }
    } catch (error) {
      toast.error("Xabar yuborishda xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  }, [message, selectedMedia, conversationId, sendMessage, isTyping, setTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const uploadMediaToStorage = useCallback(async (file: File, type: "image" | "video" | "file"): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const fileName = `${user.id}/${Date.now()}_${sanitizeFilename(file.name)}`;
    const filePath = `chat-media/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("chat-media").getPublicUrl(filePath);
    return data.publicUrl;
  }, []);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMedia: MediaFile[] = [];

    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file);
        newMedia.push({ file, preview, type: "image" });
      } else if (file.type.startsWith("video/")) {
        const preview = URL.createObjectURL(file);
        newMedia.push({ file, preview, type: "video" });
      } else {
        newMedia.push({ file, preview: "", type: "file" });
      }
    }

    setSelectedMedia((prev) => [...prev, ...newMedia]);
    e.target.value = "";
  }, []);

  const removeMedia = useCallback((index: number) => {
    setSelectedMedia((prev) => {
      const newMedia = [...prev];
      if (newMedia[index].preview) {
        URL.revokeObjectURL(newMedia[index].preview);
      }
      newMedia.splice(index, 1);
      return newMedia;
    });
  }, []);

  useEffect(() => {
    return () => {
      selectedMedia.forEach((media) => {
        if (media.preview) {
          URL.revokeObjectURL(media.preview);
        }
      });
    };
  }, [selectedMedia]);

  const handleVoiceRecord = useCallback(() => {
    setShowVoiceRecorder(true);
  }, []);

  const handleVoiceComplete = useCallback(async (audioBlob: Blob, duration: number) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileName = `${user.id}/${Date.now()}_voice.webm`;
      const filePath = `chat-media/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-media")
        .upload(filePath, audioBlob, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("chat-media").getPublicUrl(filePath);

      await sendMessage(conversationId, {
        messageType: "voice",
        mediaUrl: data.publicUrl,
        duration,
      });

      setShowVoiceRecorder(false);
    } catch (error) {
      toast.error("Ovozli xabar yuborishda xatolik");
    } finally {
      setUploading(false);
    }
  }, [conversationId, sendMessage]);

  const canSend = useMemo(
    () => message.trim().length > 0 || selectedMedia.length > 0,
    [message, selectedMedia.length]
  );

  if (showVoiceRecorder) {
    return (
      <div className="border-t border-border bg-background shrink-0">
        <VoiceRecorder
          onRecordComplete={handleVoiceComplete}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-[#FFFFFF] dark:bg-[#17212B] shrink-0">
      {selectedMedia.length > 0 && (
        <div className="px-4 py-2 border-b border-border">
          <div className="flex gap-2 overflow-x-auto">
            {selectedMedia.map((media, index) => (
              <div key={index} className="relative shrink-0">
                {media.type === "image" && media.preview && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                    <img
                      src={media.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {media.type === "video" && media.preview && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                    <Video className="h-6 w-6 text-muted-foreground" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {media.type === "file" && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted flex flex-col items-center justify-center p-2">
                    <File className="h-6 w-6 text-muted-foreground mb-1" />
                    <p className="text-[8px] text-muted-foreground truncate w-full text-center">
                      {media.file.name}
                    </p>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-3 md:px-4 py-2.5 md:py-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFileSelect}
            className="shrink-0 rounded-full h-9 w-9"
            aria-label="Fayl yuborish"
            disabled={uploading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Xabar yozing..."
              className={cn(
                "min-h-[44px] max-h-[120px] resize-none pr-10 rounded-[22px]",
                "bg-[#F0F2F5] dark:bg-[#242F3D] border-0",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "text-sm leading-[20px] py-3 px-4"
              )}
              rows={1}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
              aria-label="Emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          {canSend ? (
            <Button
              onClick={handleSend}
              size="icon"
              className="shrink-0 rounded-full bg-[#3390EC] hover:bg-[#2B7FD1] h-9 w-9"
              aria-label="Yuborish"
              disabled={uploading}
            >
              {uploading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5 text-white" />
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVoiceRecord}
              className="shrink-0 rounded-full h-9 w-9"
              aria-label="Ovozli xabar"
              disabled={uploading}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
