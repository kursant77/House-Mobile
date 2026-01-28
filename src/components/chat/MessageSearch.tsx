import { useState } from "react";
import { Search, X, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { chatMessageService } from "@/services/api/chatMessages";
import { Message } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface MessageSearchProps {
  conversationId: string;
}

export function MessageSearch({ conversationId }: MessageSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["message-search", conversationId, debouncedQuery],
    queryFn: () => {
      if (!debouncedQuery.trim()) return [];
      return chatMessageService.searchMessages(conversationId, debouncedQuery);
    },
    enabled: isOpen && debouncedQuery.trim().length > 0,
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" aria-label="Qidirish">
          <Search className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Xabarlarni qidirish</SheetTitle>
          <SheetDescription>
            Suhbatdagi xabarlarni qidiring
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search results */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !debouncedQuery.trim() ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Qidiruv so'zini kiriting</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Xabarlar topilmadi</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground px-2">
                  {searchResults.length} ta natija topildi
                </p>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {searchResults.map((message) => (
                    <div
                      key={message.id}
                      className="p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">
                          {message.sender?.fullName || "Foydalanuvchi"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), "dd MMM yyyy HH:mm", {
                            locale: uz,
                          })}
                        </span>
                      </div>
                      <MessageBubble message={message} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
