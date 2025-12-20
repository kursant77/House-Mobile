import { useState, useRef, useEffect } from "react";
import { ReelCard } from "@/components/reels/ReelCard";
import { BottomNav } from "@/components/layout/BottomNav";
import { mockReels } from "@/data/mockReels";

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
    console.log("Liked:", id);
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
            />
          </div>
        ))}
      </div>
      <BottomNav isReelsPage />
    </div>
  );
}
