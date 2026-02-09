import { useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions {
  /** Callback when bottom is reached */
  onLoadMore: () => void;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Whether there's more data to load */
  hasMore: boolean;
  /** Root margin for intersection observer (default: "100px") */
  rootMargin?: string;
  /** Threshold for intersection observer (default: 0.1) */
  threshold?: number;
}

export function useInfiniteScroll({
  onLoadMore,
  isLoading,
  hasMore,
  rootMargin = "100px",
  threshold = 0.1,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(handleObserver, {
      rootMargin,
      threshold,
    });

    // Observe the sentinel element
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, rootMargin, threshold]);

  return { loadMoreRef };
}
