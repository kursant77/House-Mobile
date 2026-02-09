import { useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  isFollowing: boolean;
  onToggle: () => void | Promise<void>;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
  className?: string;
}

export function FollowButton({
  isFollowing,
  onToggle,
  size = "md",
  variant = "default",
  className,
}: FollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await onToggle();
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "h-7 text-xs px-2",
    md: "h-8 text-sm px-3",
    lg: "h-10 text-base px-4",
  };

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        isFollowing && "text-muted-foreground",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className={cn("mr-1 animate-spin", iconSize[size])} />
      ) : isFollowing ? (
        <UserCheck className={cn("mr-1", iconSize[size])} />
      ) : (
        <UserPlus className={cn("mr-1", iconSize[size])} />
      )}
      {isFollowing ? "Obuna bo'lgansiz" : "Obuna bo'lish"}
    </Button>
  );
}
