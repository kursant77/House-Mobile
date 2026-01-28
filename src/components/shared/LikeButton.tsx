import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  liked: boolean;
  count?: number;
  onToggle: () => void | Promise<void>;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LikeButton({
  liked,
  count,
  onToggle,
  showCount = true,
  size = "md",
  className,
}: LikeButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;

    setIsAnimating(true);
    setIsLoading(true);

    try {
      await onToggle();
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const sizeClasses = {
    sm: { button: "h-8 gap-1 px-2", icon: "h-4 w-4", text: "text-xs" },
    md: { button: "h-9 gap-1.5 px-3", icon: "h-5 w-5", text: "text-sm" },
    lg: { button: "h-10 gap-2 px-4", icon: "h-6 w-6", text: "text-base" },
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "transition-all",
        sizeClasses[size].button,
        liked && "text-red-500 hover:text-red-600",
        className
      )}
    >
      <Heart
        className={cn(
          sizeClasses[size].icon,
          "transition-all",
          liked && "fill-current",
          isAnimating && "animate-ping"
        )}
      />
      {showCount && count !== undefined && (
        <span className={sizeClasses[size].text}>{count}</span>
      )}
    </Button>
  );
}
