import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ReelCard } from "@/components/reels/ReelCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/api/products";
import { Loader2, Clapperboard } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

export default function Reels() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const reelId = searchParams.get("id") || searchParams.get("productId");
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { data: reels = [], isLoading } = useQuery({
    queryKey: ["reels"],
    queryFn: productService.getReels,
  });

  // Handle deep linking from profile
  useEffect(() => {
    if (!isLoading && reels.length > 0 && reelId && containerRef.current) {
      const index = reels.findIndex(r => r.product.id === reelId || r.id === reelId);
      if (index !== -1 && index !== activeIndex) {
        setActiveIndex(index);
        const itemHeight = containerRef.current.clientHeight;
        containerRef.current.scrollTo({
          top: index * itemHeight,
          behavior: "instant"
        });
      }
    }
  }, [isLoading, reelId, reels.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = container.clientHeight;
      if (itemHeight === 0) return;

      // Calculate active index with 50% threshold
      const newIndex = Math.round(scrollTop / itemHeight);

      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < reels.length) {
        setActiveIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex, reels.length]);

  // Increment views for the active reel with a delay (Debounce)
  useEffect(() => {
    const activeReelId = reels[activeIndex]?.id;
    if (activeReelId) {
      const timer = setTimeout(() => {
        productService.incrementViews(activeReelId).catch(() => {
          // Silently ignore view increment errors
        });
      }, 2500); // Only count view if user watches for 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [activeIndex, reels]);



  if (isLoading) {
    return (
      <div className={cn(
        "bg-reels flex flex-col items-center justify-center gap-4 transition-colors duration-300",
        isMobile ? "fixed inset-0 z-50" : "relative h-[calc(100vh-64px)] w-full"
      )}>
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-reels-foreground/60 font-medium animate-pulse">Reels yuklanmoqda...</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className={cn(
        "bg-reels flex flex-col items-center justify-center text-center px-6 transition-colors duration-300",
        isMobile ? "fixed inset-0 z-50" : "relative h-[calc(100vh-64px)] w-full"
      )}>
        <div className="bg-reels-foreground/5 p-8 rounded-full mb-6">
          <Clapperboard className="h-16 w-16 text-reels-foreground/20" />
        </div>
        <h3 className="text-2xl font-bold text-reels-foreground mb-2">Hali videolar yo'q</h3>
        <p className="text-reels-foreground/50 max-w-xs mb-8">Ma'lumotlar topilmadi. Birinchilardan bo'lib video yuklang!</p>
      </div>
    );
  }

  const searchQuery = searchParams.get("search") || "";
  const filteredReels = reels.filter(reel =>
    !searchQuery || reel.product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (searchQuery) {
    return (
      <div className={cn(
        "bg-background min-h-screen p-4 pb-20 md:pb-4 transition-colors duration-300",
        isMobile ? "" : "w-full"
      )}>
        <h2 className="text-xl font-bold mb-4">Qidiruv natijalari: "{searchQuery}"</h2>
        {filteredReels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Clapperboard className="h-12 w-12 mb-4 opacity-50" />
            <p>Videolar topilmadi</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-5xl mx-auto">
            {filteredReels.map((reel) => (
              <div
                key={reel.id}
                onClick={() => {
                  const newParams = new URLSearchParams();
                  newParams.set('productId', reel.product.id);
                  setSearchParams(newParams);
                }}
                className="group flex flex-col md:flex-row gap-4 cursor-pointer hover:bg-muted/50 p-2 rounded-xl transition-colors"
              >
                <div className="relative aspect-video md:w-[360px] shrink-0 rounded-xl overflow-hidden bg-muted">
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.product.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded textxs text-white font-medium">Reels</div>
                </div>
                <div className="flex flex-col py-1 gap-1 flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">{reel.product.title}</h3>
                  <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                    <span>{reel.product.views || 0} views</span>
                    <span>•</span>
                    <span>{reel.likes} likes</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {reel.product.author?.avatarUrl ? (
                      <img src={reel.product.author.avatarUrl} className="h-6 w-6 rounded-full" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px]">
                        {reel.product.author?.fullName?.charAt(0)}
                      </div>
                    )}
                    <div className="flex items-center flex-nowrap gap-1">
                      <span className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors truncate">
                        {reel.product.author?.fullName || "House Mobile"}
                      </span>
                      {(reel.product.author?.role === 'super_admin' || reel.product.author?.role === 'admin' || reel.product.author?.role === 'blogger' || reel.product.author?.role === 'seller') && (
                        <VerifiedBadge size={12} className="shrink-0" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 mt-2 hidden md:block">{reel.product.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }


  return (
    <div className={cn(
      "bg-reels overflow-hidden select-none relative transition-colors duration-300",
      isMobile ? "" : "w-full"
    )}
      style={{ height: '100%', overscrollBehaviorX: 'none' }}
    >
      <div
        ref={containerRef}
        className={cn(
          "h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-none",
          isMobile ? "flex flex-col items-center" : "flex flex-col"
        )}
        style={{
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain'
        }}
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            className={cn(
              "w-full snap-start snap-always shrink-0 relative",
              isMobile ? "flex items-center justify-center" : "flex items-center justify-center"
            )}
            style={{
              height: '100%',
              minHeight: '100%',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always'
            }}
          >
            <div className={cn(
              "h-full relative bg-reels/5",
              isMobile
                ? "w-full md:h-full md:aspect-[9/16] md:w-auto md:my-auto md:rounded-[32px] md:shadow-[0_0_40px_rgba(0,0,0,0.8)] mx-auto overflow-hidden"
                : "w-full max-w-7xl mx-auto flex items-center"
            )}>
              <ReelCard
                reel={reel}
                isActive={index === activeIndex}
                onLike={() => {
                  if (reel.product.id) {
                    productService.incrementViews(reel.product.id).catch(() => { });
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
