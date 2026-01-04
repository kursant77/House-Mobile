import { useState, useRef, useEffect } from "react";
import { ReelCard } from "@/components/reels/ReelCard";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar"; // Import Sidebar
import { Header } from "@/components/layout/Header"; // Import Header
import { mockReels } from "@/data/mockReels";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function Reels() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

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
    <div className="fixed inset-0 bg-background z-0">
      {/* Structural Components */}
      <Header />
      <Sidebar />
      <BottomNav isReelsPage />

      {/* Main Reels Container */}
      <div
        ref={containerRef}
        className={cn(
          "h-screen w-full overflow-y-scroll snap-mandatory scrollbar-none scroll-pt-16",
          "pt-16", // Header height
          !isMobile && "pl-64 flex flex-col items-center bg-black/95" // Centering for desktop
        )}
        style={{ scrollSnapType: "y mandatory" }}
      >
        {mockReels.map((reel, index) => (
          <div
            key={reel.id}
            className={cn(
              "snap-start shrink-0 relative flex items-center justify-center",
              isMobile
                ? "h-[calc(100vh-64px)] w-full border-b border-white/10"
                : "h-[calc(100vh-100px)] w-full max-w-4xl my-6 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
            )}
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
    </div>
  );
}
