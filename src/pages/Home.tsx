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

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();



  const { data: followingProfiles = [], isLoading: followingLoading } = useQuery({
    queryKey: ["following-profiles"],
    queryFn: socialService.getFollowedProfiles,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const { data: publicPosts = [], isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: ["public-posts"],
    queryFn: () => postService.getPosts(1, 40),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });

  if (postsError) {
    console.error("Posts fetch error:", postsError);
  }

  const unifiedFeed = useMemo(() => {
    // Only include posts (news/videos) as per user request
    const combined = [
      ...publicPosts.map(post => ({ ...post, type: 'post' as const })),
    ];

    // Sort by created_at descending
    return combined.sort((a, b) => {
      const timeA = new Date((a as any).created_at || (a as any).createdAt || 0).getTime();
      const timeB = new Date((b as any).created_at || (b as any).createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [publicPosts]);

  const stories = useMemo(() => {
    if (!isAuthenticated || followingProfiles.length === 0) return [];
    return followingProfiles;
  }, [followingProfiles, isAuthenticated]);

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
            postsLoading || followingLoading ? (
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
      </div>

      {/* Categories / Chips (Both Desktop & Mobile) */}
      {/* Feed Area */}
      <div className="px-4 md:px-6 lg:px-10 pb-20 w-full text-foreground">
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
        ) : unifiedFeed.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-y-10 gap-x-4 md:gap-x-6">
            {unifiedFeed.map((item: any) => (
              <PostCard key={item.id} post={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
              <PackageSearch className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black mb-3 uppercase tracking-tighter">Hozircha kontent yo'q</h2>
            <p className="text-muted-foreground max-w-md mx-auto px-6">
              Tez orada yangi obzorlar va yangiliklar joylanadi.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
