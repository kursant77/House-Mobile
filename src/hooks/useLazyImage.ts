import { useState, useEffect, useRef } from "react";

interface UseLazyImageOptions {
  /** Threshold for intersection observer (0-1) */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Placeholder image URL */
  placeholder?: string;
}

interface UseLazyImageReturn {
  /** Ref to attach to the image container */
  ref: React.RefObject<HTMLDivElement>;
  /** The image source to use (placeholder or actual) */
  src: string;
  /** Whether the image is currently loading */
  isLoading: boolean;
  /** Whether the image has loaded */
  isLoaded: boolean;
  /** Whether there was an error loading */
  hasError: boolean;
}

/**
 * Hook for lazy loading images using Intersection Observer
 */
export function useLazyImage(
  imageSrc: string,
  options: UseLazyImageOptions = {}
): UseLazyImageReturn {
  const {
    threshold = 0.1,
    rootMargin = "100px",
    placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='%23e5e7eb' width='1' height='1'/%3E%3C/svg%3E",
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Intersection Observer for visibility detection
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  // Image loading
  useEffect(() => {
    if (!isInView || !imageSrc) return;

    const img = new Image();
    
    img.onload = () => {
      setIsLoading(false);
      setIsLoaded(true);
    };

    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
    };

    img.src = imageSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isInView, imageSrc]);

  const src = isLoaded && !hasError ? imageSrc : placeholder;

  return {
    ref,
    src,
    isLoading: isLoading && isInView,
    isLoaded,
    hasError,
  };
}

/**
 * Hook for preloading images
 */
export function useImagePreloader(urls: string[]): {
  isLoading: boolean;
  progress: number;
  loadedCount: number;
} {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!urls.length) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    let count = 0;

    urls.forEach((url) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        if (mounted) {
          count++;
          setLoadedCount(count);
          if (count === urls.length) {
            setIsLoading(false);
          }
        }
      };
      img.src = url;
    });

    return () => {
      mounted = false;
    };
  }, [urls]);

  return {
    isLoading,
    progress: urls.length ? (loadedCount / urls.length) * 100 : 100,
    loadedCount,
  };
}
