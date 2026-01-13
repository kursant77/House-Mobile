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
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { postService, PublicPost } from "@/services/api/posts";
import { PostCard } from "@/components/social/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, X, User as UserIcon, ShoppingBag, Newspaper } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProductCard } from "@/components/products/ProductCard";

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { data: followingProfiles = [], isLoading: followingLoading } = useQuery({
    queryKey: ["following-profiles"],
    queryFn: socialService.getFollowedProfiles,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const { data: publicPosts = [], isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: ["public-posts"],
    queryFn: () => postService.getPosts(1, 40),
    staleTime: 1000 * 60 * 2,
  });

  const { data: searchUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["search-users", searchQuery],
    queryFn: () => socialService.searchUsers(searchQuery),
    enabled: activeTab === "users" && searchQuery.length > 0,
  });

  const { data: searchProducts = [], isLoading: searchProductsLoading } = useQuery({
    queryKey: ["search-products", searchQuery],
    queryFn: productService.getProducts,
    enabled: activeTab === "products" && searchQuery.length > 0,
    select: (data) => data.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  });

  const unifiedFeed = useMemo(() => {
    const combined = [
      ...publicPosts.map(post => ({ ...post, type: 'post' as const })),
    ];
    return combined.sort((a, b) => {
      const timeA = new Date((a as any).created_at || (a as any).createdAt || 0).getTime();
      const timeB = new Date((b as any).created_at || (b as any).createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [publicPosts]);

  const filteredFeed = useMemo(() => {
    if (!searchQuery) return unifiedFeed;
    return unifiedFeed.filter(item =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unifiedFeed, searchQuery]);

  const stories = useMemo(() => {
    if (!isAuthenticated || followingProfiles.length === 0) return [];
    return followingProfiles;
  }, [followingProfiles, isAuthenticated]);

  if (postsError) {
    console.error("Posts fetch error:", postsError);
  }

  return (
    <>
      <div className="md:hidden space-y-4 pt-2">
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
            postsLoading || followingLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 w-16 rounded-full bg-muted animate-pulse shrink-0" />
              ))
            ) : null
          )}
        </div>
      </div>

      <div className="px-4 py-4 md:px-6 lg:px-10 sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b mb-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Qidirish... (Foydalanuvchilar, Mahsulotlar, Postlar)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => {
                if (!searchQuery) setIsSearchFocused(false);
              }, 200)}
              className="pl-12 pr-12 h-12 rounded-full bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-muted"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchFocused(false);
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {(isSearchFocused || searchQuery) && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
              <TabsList className="w-full h-10 bg-transparent p-0 gap-2 overflow-x-auto no-scrollbar justify-start">
                <TabsTrigger
                  value="posts"
                  className="h-8 px-4 rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary transition-all whitespace-nowrap"
                >
                  Postlar
                </TabsTrigger>
                <TabsTrigger
                  value="products"
                  className="h-8 px-4 rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary transition-all whitespace-nowrap"
                >
                  Mahsulotlar
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="h-8 px-4 rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary transition-all whitespace-nowrap"
                >
                  Foydalanuvchilar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-10 pb-20 w-full text-foreground">
        {activeTab === "posts" && (
          <>
            {postsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-y-8 gap-x-4 md:gap-x-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="flex flex-col gap-3">
                    <div className="aspect-video w-full rounded-xl bg-muted animate-pulse" />
                    <div className="flex gap-3 px-1">
                      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-full bg-muted animate-pulse rounded" />
                        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredFeed.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-y-10 gap-x-4 md:gap-x-6">
                {filteredFeed.map((item: any) => (
                  <PostCard key={item.id} post={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                  <PackageSearch className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-black mb-3 uppercase tracking-tighter">Hech narsa topilmadi</h2>
                <p className="text-muted-foreground max-w-md mx-auto px-6">
                  Boshqa qidiruv so'zini sinab ko'ring yoki keyinroq qayting.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "products" && (
          <>
            {searchProductsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : searchProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground">Mahsulotlar topilmadi</p>
              </div>
            )}
          </>
        )}

        {activeTab === "users" && (
          <div className="max-w-xl mx-auto space-y-4">
            {usersLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-48 bg-muted rounded" />
                  </div>
                </div>
              ))
            ) : searchUsers.length > 0 ? (
              searchUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Avatar className="h-14 w-14 border-2 border-background">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.username?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-lg">{user.username}</h3>
                      {(user.role === 'super_admin' || user.role === 'blogger') && (
                        <VerifiedBadge size={16} />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.fullName}</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full px-6">Ko'rish</Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <UserIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground">Foydalanuvchilar topilmadi</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
