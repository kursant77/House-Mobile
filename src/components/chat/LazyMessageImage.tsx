import { useState, useEffect, useRef } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LazyMessageImageProps {
  src: string;
  thumbnail?: string;
  alt: string;
  className?: string;
  maxWidth?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyMessageImage({
  src,
  thumbnail,
  alt,
  className,
  maxWidth = 320,
  onLoad,
  onError,
}: LazyMessageImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "200px", // Start loading 200px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load image when in view
  useEffect(() => {
    if (!isInView || isLoaded || hasError) return;

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      setHasError(true);
      onError?.();
    };

    img.src = src;
  }, [isInView, src, isLoaded, hasError, onLoad, onError]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-[12px]", className)}
      style={{ maxWidth: `${maxWidth}px` }}
    >
      {/* Thumbnail/Blur placeholder */}
      {!isLoaded && !hasError && thumbnail && (
        <img
          src={thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
          aria-hidden="true"
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && !hasError && !thumbnail && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
        </div>
      )}

      {/* Main image */}
      {!hasError && (
        <img
          ref={imgRef}
          src={isLoaded ? src : thumbnail || src}
          alt={alt}
          className={cn(
            "w-full h-auto object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="flex flex-col items-center justify-center p-8 bg-muted text-muted-foreground">
          <ImageOff className="h-8 w-8 mb-2" />
          <span className="text-xs">Rasm yuklanmadi</span>
        </div>
      )}
    </div>
  );
}
