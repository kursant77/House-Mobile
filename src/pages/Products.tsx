import { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProductCard } from "@/components/products/ProductCard";
import { categories, getProductsByCategory } from "@/data/mockProducts";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Products() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const products = getProductsByCategory(activeCategory);

  const filteredProducts = searchQuery
    ? products.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
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

      {/* Product Grid */}
      <main className="px-4 py-4">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
