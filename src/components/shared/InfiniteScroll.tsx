import { ReactNode } from "react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfiniteScrollProps {
  /** Child elements to render */
  children: ReactNode;
  /** Callback when bottom is reached */
  onLoadMore: () => void;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Whether there's more data to load */
  hasMore: boolean;
  /** Custom loading indicator */
  loadingComponent?: ReactNode;
  /** Custom end of list message */
  endMessage?: ReactNode;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Additional class names */
  className?: string;
  /** Container class names */
  containerClassName?: string;
}

export function InfiniteScroll({
  children,
  onLoadMore,
  isLoading,
  hasMore,
  loadingComponent,
  endMessage,
  rootMargin = "200px",
  className,
  containerClassName,
}: InfiniteScrollProps) {
  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore,
    isLoading,
    hasMore,
    rootMargin,
  });

  return (
    <div className={cn("w-full", containerClassName)}>
      <div className={className}>{children}</div>

      {/* Sentinel element for intersection observer */}
      <div ref={loadMoreRef} className="w-full h-1" aria-hidden="true" />

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-6">
          {loadingComponent || (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Yuklanmoqda...</span>
            </div>
          )}
        </div>
      )}

      {/* End of list message */}
      {!hasMore && !isLoading && endMessage && (
        <div className="flex justify-center py-6 text-muted-foreground text-sm">
          {endMessage}
        </div>
      )}
    </div>
  );
}
