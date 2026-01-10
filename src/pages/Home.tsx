import { ProductCard } from "@/components/products/ProductCard";
import { categories } from "@/data/mockProducts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/api/products";
import { socialService } from "@/services/api/social";
import { Loader2, PackageSearch, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateHomePost from "@/components/admin/CreateHomePost";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { postService, PublicPost } from "@/services/api/posts";
import { PostCard } from "@/components/social/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: productService.getAdminProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const { data: followingIds = [] } = useQuery({
    queryKey: ["following"],
    queryFn: socialService.getFollowing,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const { data: publicPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["public-posts"],
    queryFn: postService.getPosts,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });

  const dynamicCategories = useMemo(() => categories.map(cat => ({
    ...cat,
    count: cat.id === "all"
      ? products.length
      : products.filter(p => p.category === cat.id).length
  })), [products]);

  const filteredProducts = useMemo(() => activeCategory === "all"
    ? products
    : products.filter(p => p.category === activeCategory), [products, activeCategory]);

  const stories = useMemo(() => {
    if (!isAuthenticated || followingIds.length === 0) return [];

    const followedAuthors = Array.from(new Set(products
      .filter(p => p.author?.id && followingIds.includes(p.author.id))
      .map(p => p.author?.id)))
      .map(id => products.find(p => p.author?.id === id)?.author)
      .filter(Boolean)
      .slice(0, 10);

    return followedAuthors;
  }, [products, followingIds, isAuthenticated]);

  return (
    <>
      {/* Mobile Banners / Stories (Uzum Style) - Hidden on Desktop */}
      <div className="md:hidden space-y-4 pt-2">
        {/* Stories / Highlights */}
        <div className="flex overflow-x-auto gap-3 px-4 pb-2 no-scrollbar">
          {stories.length > 0 ? (
            stories.map((author: any) => (
              <div
                key={author.id}
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                onClick={() => navigate(`/profile/${author.id}`)}
              >
                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-yellow-400 to-red-500 p-[2px]">
                  <div className="h-full w-full rounded-full bg-background border-2 border-background overflow-hidden relative">
                    <img
                      src={author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.fullName}`}
                      className="h-full w-full object-cover"
                      alt={author.fullName}
                      loading="lazy"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-center w-16 truncate">{author.fullName?.split(' ')[0]}</span>
              </div>
            ))
          ) : (
            isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 w-16 rounded-full bg-muted animate-pulse shrink-0" />
              ))
            ) : (
              <div className="px-4 py-2 text-xs text-muted-foreground italic">
                {isAuthenticated ? "Hozircha obuna bo'lgan akkauntlar yo'q" : "Obuna bo'ling"}
              </div>
            )
          )}
        </div>

        {/* Hero Banner / Create Post for Bloggers */}
        <div className="px-4 space-y-4">
          {(user?.role === 'super_admin' || user?.role === 'blogger') && (
            <div className="mb-2">
              <CreateHomePost />
            </div>
          )}

          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 h-40 flex items-center px-6 relative overflow-hidden">
            <div className="relative z-10 text-white">
              <h2 className="text-xl font-bold mb-1">Texno Obzorlar</h2>
              <p className="text-sm opacity-90 mb-3">Eng so'nggi gadjetlar va qurilmalar</p>
              <Button size="sm" variant="secondary" className="h-8 text-xs">Buy Now</Button>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] h-32 w-32 bg-white/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>

      {/* Categories / Chips (Both Desktop & Mobile) */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-xl border-b border-white/5 py-3 px-4 md:px-8 mb-4 overflow-x-auto no-scrollbar -mx-4 md:mx-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-max px-1">
          {dynamicCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5",
                activeCategory === cat.id
                  ? "bg-white text-black shadow-sm"
                  : "bg-zinc-100 dark:bg-white/10 text-muted-foreground hover:bg-zinc-200 dark:hover:bg-white/20"
              )}
            >
              {cat.name}
              <span className={cn(
                "text-[10px] opacity-60",
                activeCategory === cat.id ? "text-black" : "text-muted-foreground"
              )}>
                ({cat.count})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Title (YouTube Style) */}
      <div className="hidden md:flex items-center justify-between px-8 mb-6 mx-auto max-w-[2000px]">
        <h2 className="text-3xl font-bold">So'nggi Maqolalar</h2>
        <Button variant="ghost" className="gap-2">Barchasini ko'rish <ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Main Content Area with Tabs */}
      <div className="px-3 md:px-8 pb-20 max-w-[2000px] mx-auto mt-4">
        <Tabs defaultValue="products" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 h-11 rounded-full w-full max-w-[400px]">
              <TabsTrigger
                value="products"
                className="rounded-full px-8 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm font-black text-xs uppercase tracking-widest"
              >
                Mahsulotlar
              </TabsTrigger>
              <TabsTrigger
                value="posts"
                className="rounded-full px-8 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm font-black text-xs uppercase tracking-widest flex items-center gap-2"
              >
                Yangiliklar <span className="h-2 w-2 rounded-full bg-primary" />
              </TabsTrigger>
            </TabsList>

            <div className="hidden md:block">
              {activeCategory !== "all" && (
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  {categories.find(c => c.id === activeCategory)?.name} — {filteredProducts.length} ta
                </p>
              )}
            </div>
          </div>

          <TabsContent value="products" className="mt-0 outline-none">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Mahsulotlar yuklanmoqda...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8 mx-auto">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} variant="review" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <div className="bg-muted p-6 rounded-full mb-4">
                  <PackageSearch className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-black mb-2 uppercase tracking-tighter">Hozircha mahsulotlar yo'q</h3>
                <p className="text-muted-foreground max-w-sm">
                  Tez orada yangi obzorlar qo'shiladi!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-0 outline-none">
            {postsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Yangiliklar yuklanmoqda...</p>
              </div>
            ) : publicPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicPosts.map((post: PublicPost) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                  <Send className="h-10 w-10 text-primary rotate-12" />
                </div>
                <h2 className="text-2xl font-black mb-3 uppercase tracking-tighter">Hozircha yangiliklar yo'q</h2>
                <p className="text-muted-foreground max-w-md mx-auto px-6">
                  Bloggerlarimiz va adminlarimiz tomonidan tez orada qiziqarli yangiliklar joylanadi.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
