import { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { socialService } from "@/services/api/social";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  fullName?: string;
  username?: string;
  avatarUrl?: string;
  role?: string;
}

interface UserPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (userId: string) => void;
  excludeUserIds?: string[];
  title?: string;
}

export function UserPickerDialog({
  open,
  onOpenChange,
  onSelect,
  excludeUserIds = [],
  title = "Foydalanuvchi tanlash",
}: UserPickerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  // Memoize excludeUserIds to prevent unnecessary re-renders
  const excludeUserIdsSet = useMemo(() => {
    return new Set(excludeUserIds);
  }, [excludeUserIds.length, excludeUserIds.join(",")]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setUsers([]);
      setSelectedUserId(null);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      isProcessingRef.current = false;
    }
  }, [open]);

  // Search users with debounce
  useEffect(() => {
    if (!open) return;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If search query is empty, clear results
    if (!searchQuery.trim()) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    // Set loading state
    setIsLoading(true);

    // Debounce the search
    debounceTimerRef.current = setTimeout(async () => {
      if (isProcessingRef.current) return;
      
      isProcessingRef.current = true;
      try {
        const results = await socialService.searchUsers(searchQuery);
        // Filter out excluded users using Set for O(1) lookup
        const filtered = results.filter(
          (user) => !excludeUserIdsSet.has(user.id)
        );
        setUsers(filtered);
      } catch (error) {
        console.error("Error searching users:", error);
        setUsers([]);
      } finally {
        setIsLoading(false);
        isProcessingRef.current = false;
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [searchQuery, open, excludeUserIdsSet]);

  const handleSelect = (user: User) => {
    // Prevent multiple rapid clicks
    if (isProcessingRef.current) return;
    
    setSelectedUserId(user.id);
    // Close dialog first to prevent re-renders
    onOpenChange(false);
    // Then call onSelect
    onSelect(user.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Foydalanuvchi tanlash dialogi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ism, username yoki email bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Users List */}
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery.trim() && users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Foydalanuvchi topilmadi
                </p>
              </div>
            ) : !searchQuery.trim() ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Qidirish uchun yozing...
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelect(user)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left",
                      selectedUserId === user.id && "bg-muted"
                    )}
                  >
                    <Avatar size="md" showStatus={true} isOnline={true}>
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>
                        {user.fullName
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || user.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-medium truncate">
                          {user.fullName || user.username || "Foydalanuvchi"}
                        </p>
                        {(user.role === "super_admin" || user.role === "blogger") && (
                          <VerifiedBadge size={12} />
                        )}
                      </div>
                      {user.username && (
                        <p className="text-sm text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
