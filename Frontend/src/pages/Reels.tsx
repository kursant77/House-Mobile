import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ReelCard } from "@/components/reels/ReelCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/api/products";
import { Loader2, Clapperboard } from "lucide-react";

export default function Reels() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchParams] = useSearchParams();
  const reelId = searchParams.get("id");
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
      const newIndex = Math.round(scrollTop / itemHeight);
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex]);

  // Increment views for the active reel
  useEffect(() => {
    if (reels[activeIndex]?.id) {
      productService.incrementViews(reels[activeIndex].id).catch(console.error);
    }
  }, [activeIndex, reels.length]);

  const handleLike = (id: string) => {
    console.log("Liked:", id);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 z-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-zinc-500 font-medium animate-pulse">Reels yuklanmoqda...</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-center px-6 z-50">
        <div className="bg-zinc-900/50 p-8 rounded-full mb-6">
          <Clapperboard className="h-16 w-16 text-zinc-700" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Hali videolar yo'q</h3>
        <p className="text-zinc-500 max-w-xs mb-8">Ma'lumotlar topilmadi. Birinchilardan bo'lib video yuklang!</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-black overflow-hidden select-none",
      isMobile ? "fixed inset-0 z-[60]" : "relative h-[calc(100vh-64px)] w-full"
    )}>
      {/* Immersive Scroll Container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-none flex flex-col items-center"
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            className="h-screen w-full snap-start shrink-0 flex items-center justify-center relative border-b border-white/5 md:border-none"
          >
            <div className="h-full w-full md:h-[95vh] md:max-w-[450px] md:my-auto relative md:rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]">
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
