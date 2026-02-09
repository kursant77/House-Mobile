import { useLazyImage } from "@/hooks/useLazyImage";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  placeholderClassName?: string;
  aspectRatio?: "square" | "video" | "portrait" | "landscape" | "auto";
  objectFit?: "cover" | "contain" | "fill" | "none";
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

const aspectRatioClasses = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  auto: "",
};

export function LazyImage({
  src,
  alt,
  className,
  containerClassName,
  placeholderClassName,
  aspectRatio = "auto",
  objectFit = "cover",
  fallback,
  onLoad,
  onError,
}: LazyImageProps) {
  const { ref, src: imageSrc, isLoading, isLoaded, hasError } = useLazyImage(src);

  // Call callbacks
  if (isLoaded && onLoad) onLoad();
  if (hasError && onError) onError();

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden bg-muted",
        aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 animate-pulse bg-muted",
            placeholderClassName
          )}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          {fallback || (
            <div className="flex flex-col items-center text-muted-foreground">
              <ImageOff className="h-8 w-8 mb-1" />
              <span className="text-xs">Rasm yuklanmadi</span>
            </div>
          )}
        </div>
      )}

      {/* Image */}
      {!hasError && (
        <img
          src={imageSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            "w-full h-full transition-opacity duration-300",
            objectFit === "cover" && "object-cover",
            objectFit === "contain" && "object-contain",
            objectFit === "fill" && "object-fill",
            objectFit === "none" && "object-none",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
        />
      )}
    </div>
  );
}
