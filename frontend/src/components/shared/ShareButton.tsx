import { useState } from "react";
import { Share2, Link, Copy, Check, Twitter, Facebook, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  url: string;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function ShareButton({
  url,
  title = "",
  description = "",
  size = "md",
  variant = "ghost",
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Havola nusxalandi!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nusxalashda xatolik");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch {
        // User cancelled
      }
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${title} ${description}`);
    const shareUrl = encodeURIComponent(url);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
      "_blank"
    );
  };

  const shareToFacebook = () => {
    const shareUrl = encodeURIComponent(url);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      "_blank"
    );
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(`${title} ${url}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, "_blank");
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-10 w-10",
  };

  const iconSize = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  // Check if native share is available
  const canShare = typeof navigator !== "undefined" && navigator.share;

  if (canShare) {
    return (
      <Button
        variant={variant}
        size="icon"
        onClick={handleNativeShare}
        className={cn(sizeClasses[size], className)}
      >
        <Share2 className={iconSize[size]} />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={cn(sizeClasses[size], className)}
        >
          <Share2 className={iconSize[size]} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Link className="h-4 w-4 mr-2" />
          )}
          {copied ? "Nusxalandi!" : "Havolani nusxalash"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTelegram}>
          <Send className="h-4 w-4 mr-2" />
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTwitter}>
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToFacebook}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
