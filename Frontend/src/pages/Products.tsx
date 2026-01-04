import { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProductCard } from "@/components/products/ProductCard";
import { categories, getProductsByCategory } from "@/data/mockProducts";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function Products() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const products = getProductsByCategory(activeCategory);

  const filteredProducts = searchQuery
    ? products.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : products;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">

        <BottomNav />
        {/* Header - faqat mobile uchun */}
        {isMobile && (
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
            <div className="px-4 py-3 space-y-3">
              <h1 className="text-xl font-bold tracking-tight">Products</h1>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-9 rounded-xl bg-muted border-0"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95",
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </header>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="mx-auto px-4 py-6 max-w-[2000px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Products</h1>
                <p className="text-muted-foreground">Discover our amazing collection</p>
              </div>

            </div>

            {/* Search */}
            {/* <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 rounded-xl bg-muted border-0 text-lg"
            />
          </div> */}

            {/* Categories */}
            <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-none pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "shrink-0 rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:scale-105 active:scale-95",
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product Grid */}
        <main className="px-4 py-4 md:mx-auto max-w-[2000px]">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="mb-4 rounded-full bg-muted p-6">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No products found</h2>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
