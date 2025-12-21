import { ProductCard } from "@/components/products/ProductCard";
import { mockProducts, categories } from "@/data/mockProducts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredProducts = activeCategory === "all"
    ? mockProducts
    : mockProducts.filter(p => p.category === activeCategory);

  return (
    <>
      {/* Mobile Banners / Stories (Uzum Style) - Hidden on Desktop */}
      <div className="md:hidden space-y-4 pt-2">
        {/* Stories / Highlights */}
        <div className="flex overflow-x-auto gap-3 px-4 pb-2 no-scrollbar">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-yellow-400 to-red-500 p-[2px]">
                <div className="h-full w-full rounded-full bg-background border-2 border-background overflow-hidden relative">
                  <img src={`https://picsum.photos/seed/${i}/200`} className="h-full w-full object-cover" alt="story" />
                </div>
              </div>
              <span className="text-[10px] text-center w-16 truncate">Special {i}</span>
            </div>
          ))}
        </div>

        {/* Hero Banner */}
        <div className="px-4">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 h-40 flex items-center px-6 relative overflow-hidden">
            <div className="relative z-10 text-white">
              <h2 className="text-xl font-bold mb-1">Super Sale</h2>
              <p className="text-sm opacity-90 mb-3">Up to 50% off on Smartphones</p>
              <Button size="sm" variant="secondary" className="h-8 text-xs">Buy Now</Button>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] h-32 w-32 bg-white/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>

      {/* Categories / Chips (Both Desktop & Mobile) */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-xl border-b border-white/5 py-3 px-4 md:px-8 mb-4 overflow-x-auto no-scrollbar -mx-4 md:mx-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-max px-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap active:scale-95",
                activeCategory === cat.id
                  ? "bg-white text-black shadow-sm"
                  : "bg-zinc-100 dark:bg-white/10 text-muted-foreground hover:bg-zinc-200 dark:hover:bg-white/20"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Title (YouTube Style) */}
      <div className="hidden md:flex items-center justify-between px-8 mb-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold">Recommended for You</h2>
        <Button variant="ghost" className="gap-2">View all <ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Main Grid */}
      <div className="px-3 md:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} variant="wide" />
          ))}
          {/* Duplicating products to fill grid for demo */}
          {filteredProducts.map((product) => (
            <ProductCard key={`${product.id}-copy`} product={{ ...product, id: `${product.id}-copy` }} variant="wide" />
          ))}
        </div>
      </div>
    </>
  );
}
