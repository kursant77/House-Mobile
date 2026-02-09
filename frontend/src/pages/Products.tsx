import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/products/ProductCard";
import { PRODUCT_CATEGORIES as categories } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/api/products";
import { SkeletonProductCard } from "@/components/products/SkeletonProductCard";
import { supabase } from "@/lib/supabase";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamQuery = searchParams.get("search") || "";
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState(searchParamQuery);
  const isMobile = useIsMobile();

  // URL'dan search o'zgarganda state'ni yangilash
  useEffect(() => {
    if (searchParamQuery !== searchQuery) {
      setSearchQuery(searchParamQuery);
    }
  }, [searchParamQuery, searchQuery]);

  // State o'zgarganda URL'ni yangilash
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set("search", val);
    } else {
      params.delete("search");
    }
    setSearchParams(params, { replace: true });
  };

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => productService.getProducts({ limit: 100 }),
    staleTime: 1000 * 60 * 1, // 1 minute cache (aligned with global config)
  });

  const allProducts = data?.products || [];

  // Real-time subscription for products
  useEffect(() => {
    if (!isLoading) {
      const channel = supabase
        .channel('products-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products'
          },
          () => {
            // Invalidate and refetch products when changes occur
            queryClient.invalidateQueries({ queryKey: ['products'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isLoading, queryClient]);

  const dynamicCategories = useMemo(() => categories.map(cat => ({
    ...cat,
    count: cat.id === "all"
      ? allProducts.length
      : allProducts.filter(p => p.category === cat.id).length
  })), [allProducts]);

  const filteredProductsBySearch = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    const query = searchQuery.toLowerCase();
    return allProducts.filter((p) =>
      p.title.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
    );
  }, [allProducts, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return filteredProductsBySearch;
    return filteredProductsBySearch.filter(p => p.category === activeCategory);
  }, [filteredProductsBySearch, activeCategory]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">

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
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-10 pl-9 rounded-xl bg-muted border-0"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
            {dynamicCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 flex items-center gap-1.5",
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {category.name}
                <span className="text-[10px] opacity-60">({category.count})</span>
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

          {/* Categories */}
          <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-none pb-2">
            {dynamicCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "shrink-0 rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2",
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {category.name}
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  activeCategory === category.id ? "bg-white/20" : "bg-zinc-200 dark:bg-zinc-800"
                )}>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product Grid */}
      <main className="px-4 py-4 md:mx-auto max-w-[2000px]">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonProductCard key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
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
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
            <div className="mb-4 rounded-full bg-muted p-6">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No products found</h2>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </main>
    </div>
  );
}
