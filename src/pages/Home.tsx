import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/api/products";
import { socialService } from "@/services/api/social";
import { PackageSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { postService, PublicPost } from "@/services/api/posts";
import { PostCard } from "@/components/social/PostCard";
import { User as UserIcon, ShoppingBag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProductCard } from "@/components/products/ProductCard";
import { StoriesSection } from "@/components/home/StoriesSection";
import { SearchSection } from "@/components/home/SearchSection";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { supabase } from "@/lib/supabase";

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

  const queryClient = useQueryClient();
  
  const { data: publicPosts = [], isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: ["public-posts"],
    queryFn: () => postService.getPosts(1, 40),
    staleTime: 1000 * 60 * 1, // 1 minute cache (aligned with global config)
  });

  // Real-time subscription for posts
  useEffect(() => {
    if (!postsLoading) {
      const channel = supabase
        .channel('posts-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts'
          },
          () => {
            // Invalidate and refetch posts when changes occur
            queryClient.invalidateQueries({ queryKey: ['public-posts'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [postsLoading, queryClient]);

  const { data: searchUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["search-users", searchQuery],
    queryFn: () => socialService.searchUsers(searchQuery),
    enabled: activeTab === "users" && searchQuery.length > 0,
  });

  const { data: searchProducts = [], isLoading: searchProductsLoading } = useQuery({
    queryKey: ["search-products", searchQuery],
    queryFn: productService.getProducts,
    enabled: activeTab === "products" && searchQuery.length > 0,
    select: (data) => {
      if (!Array.isArray(data)) return [];
      return data.filter(p =>
        p?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  });

  const unifiedFeed = useMemo(() => {
    if (!Array.isArray(publicPosts)) {
      return [];
    }
    const combined = [
      ...publicPosts.map(post => ({ ...post, type: 'post' as const })),
    ];
    return combined.sort((a, b) => {
      const timeA = new Date('created_at' in a ? a.created_at : 'createdAt' in a ? (a as { createdAt: string }).createdAt : 0).getTime();
      const timeB = new Date('created_at' in b ? b.created_at : 'createdAt' in b ? (b as { createdAt: string }).createdAt : 0).getTime();
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
    // Error is handled by React Query's error state
    // User will see error message in UI if needed
  }

  return (
    <>
      <div className="md:hidden space-y-4 pt-2">
        <div className="flex overflow-x-auto gap-3 px-4 pb-2 no-scrollbar">
          {stories.length > 0 ? (
            stories.map((author) => (
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

      <SearchSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchFocused={isSearchFocused}
        setIsSearchFocused={setIsSearchFocused}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

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
                {filteredFeed.map((item) => (
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
