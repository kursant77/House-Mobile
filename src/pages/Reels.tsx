import { useState, useRef, useEffect } from "react";
import { ReelCard } from "@/components/reels/ReelCard";
import { BottomNav } from "@/components/layout/BottomNav";
import { mockReels } from "@/data/mockReels";
import { toast } from "sonner";

export default function Reels() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleLike = (id: string) => {
    // Will connect to API later
    console.log("Liked:", id);
  };

  const handleFavorite = (id: string) => {
    toast.success("Added to favorites");
    console.log("Favorited:", id);
  };

  const handleAddToCart = (id: string) => {
    toast.success("Added to cart");
    console.log("Added to cart:", id);
  };

  return (
    <div className="fixed inset-0 bg-reels">
      <div
        ref={containerRef}
        className="h-full w-full snap-mandatory overflow-y-scroll scrollbar-none"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {mockReels.map((reel, index) => (
          <div
            key={reel.id}
            className="h-full w-full snap-start"
            style={{ scrollSnapAlign: "start" }}
          >
            <ReelCard
              reel={reel}
              isActive={index === activeIndex}
              onLike={handleLike}
              onFavorite={handleFavorite}
              onAddToCart={handleAddToCart}
            />
          </div>
        ))}
      </div>
      <BottomNav isReelsPage />
    </div>
  );
}
