import { useNavigate } from "react-router-dom";
import { ReelItem } from "@/types/product";
import { useState, useRef, useEffect } from "react";
import {
  Heart,
  ShoppingBag,
  Share2,
  Volume2,
  VolumeX,
  Check,
  MessageCircle,
  MoreVertical,
  Music2,
  Bookmark,
  Play,
  Clock,
  Download,
  Flag,
  UserX,
  User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPriceNumber, formatCurrencySymbol } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { socialService } from "@/services/api/social";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { CommentsDrawer } from "./CommentsDrawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { historyService } from "@/services/api/history";
import { useWatchLaterStore } from "@/store/watchLaterStore";
import { useUiStore } from "@/store/uiStore";
import { BioDisplay } from "@/components/shared/BioDisplay";

// Real-time comment count component
function CommentCount({ productId }: { productId: string }) {
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ["comment-count", productId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('product_comments')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)
        .is('parent_comment_id', null);
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 2000,
    enabled: !!productId,
  });

  useEffect(() => {
    if (!productId) return;

    const channel = supabase
      .channel(`comment-count:${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_comments',
          filter: `product_id=eq.${productId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["comment-count", productId] });
        }
      )
      .subscribe();

    return () => {
      const removeChannel = async () => {
        try {
          if (channel) {
            await supabase.removeChannel(channel);
          }
        } catch (err) {
          // Ignore removal errors
        }
      };
      removeChannel();
    };
  }, [productId, queryClient]);

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return <span className="text-[11px] font-bold text-white drop-shadow-md">{formatCount(count)}</span>;
}

interface ReelCardProps {
  reel: ReelItem;
  isActive: boolean;
  onLike: (id: string) => void;
}

export function ReelCard({
  reel,
  isActive,
  onLike,
}: ReelCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { addToCart, isInCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { addItem: addToWatchLater } = useWatchLaterStore();
  const { isMuted, toggleMuted } = useUiStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartTime = useRef<number>(0);
  const isMobile = useIsMobile();

  const [isLiked, setIsLiked] = useState(reel.isLiked);
  const [likesCount, setLikesCount] = useState(reel.likes);
  const [showHeart, setShowHeart] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    progress: number;
    speed: string;
    eta: string;
    isActive: boolean;
    isComplete: boolean;
  }>({
    progress: 0,
    speed: "0 MB/s",
    eta: "0s",
    isActive: false,
    isComplete: false
  });

  const isProductFavorite = isFavorite(reel.product.id);
  const isProductInCart = isInCart(reel.product.id);

  useEffect(() => {
    const checkFollow = async () => {
      if (isAuthenticated && reel.author?.id) {
        try {
          const status = await socialService.isFollowing(reel.author.id);
          setIsFollowing(status);
        } catch (error) {
          // Silently ignore follow status check errors
        }
      }
    };
    checkFollow();
  }, [reel.author?.id, isAuthenticated]);

  useEffect(() => {
    if (isActive && isAuthenticated) {
      const timer = setTimeout(() => {
        historyService.addToHistory('reel', reel.product.id);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isActive, isAuthenticated, reel.product.id]);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive && !isPaused) {
        videoRef.current.muted = isMuted;
        videoRef.current.play().catch(() => { });
      } else {
        videoRef.current.pause();
        if (!isActive) {
          videoRef.current.currentTime = 0;
        }
      }
    }
  }, [isActive, isPaused, isMuted]);

  const onTimeUpdate = () => {
    // Progress is currently unused in UI
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error("Iltimos, avval tizimga kiring");
      navigate("/auth");
      return;
    }

    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));

      await socialService.toggleLike(reel.product.id);
      onLike(reel.id);
    } catch (error) {
      setIsLiked(!isLiked);
      setLikesCount(prev => !isLiked ? prev - 1 : prev + 1);
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (isMobile && e.type === 'touchstart') {
      return;
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      if (!isLiked) {
        handleLike();
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      clickTimerRef.current = setTimeout(() => {
        toggleMuted();
        clickTimerRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
  };

  const handleVideoTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;

    e.stopPropagation();
    touchStartTime.current = Date.now();

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    longPressTimer.current = setTimeout(() => {
      if (videoRef.current && !isPaused) {
        setIsPaused(true);
        setIsLongPressing(true);
        videoRef.current.pause();
      }
    }, 500);
  };

  const handleVideoTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return;

    e.stopPropagation();

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isLongPressing && isPaused && videoRef.current) {
      setIsPaused(false);
      setIsLongPressing(false);
      videoRef.current.play().catch(() => { });
    }
  };

  const handleVideoTouchMove = () => {
    if (!isMobile) return;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Iltimos, avval tizimga kiring");
      navigate("/auth");
      return;
    }

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await socialService.unfollow(reel.author?.id || reel.product.sellerId);
        setIsFollowing(false);
        toast.success("Obuna bekor qilindi");
      } else {
        await socialService.follow(reel.author?.id || reel.product.sellerId);
        setIsFollowing(true);
        toast.success("Obuna bo'lindi");
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast.error("Iltimos, avval tizimga kiring");
      navigate("/auth");
      return;
    }
    toggleFavorite(reel.product);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error("Iltimos, avval tizimga kiring");
      navigate("/auth");
      return;
    }
    addToCart(reel.product);
    toast.success("Savatchaga qo'shildi");
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleShare = async () => {
    const shareData = {
      title: reel.product.title,
      text: reel.product.description,
      url: `${window.location.origin}/reels?id=${reel.product.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Havola nusxalandi!");
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  const handleWatchLater = async () => {
    if (!isAuthenticated) {
      toast.error("Iltimos, avval tizimga kiring");
      navigate("/auth");
      return;
    }
    await addToWatchLater(reel.product);
    toast.success("Keyinroq ko'rish ro'yxatiga qo'shildi");
  };

  const handleDownload = async () => {
    if (downloadProgress.isActive) return;

    try {
      setDownloadProgress({
        progress: 0,
        speed: "0 MB/s",
        eta: "...",
        isActive: true,
        isComplete: false
      });

      const xhr = new XMLHttpRequest();
      xhr.open("GET", reel.videoUrl, true);
      xhr.responseType = "blob";

      let startTime = Date.now();

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          const elapsedTime = (Date.now() - startTime) / 1000; // seconds
          const speedBps = event.loaded / elapsedTime; // bytes per second
          const speedMbps = (speedBps / (1024 * 1024)).toFixed(1);

          const remainingBytes = event.total - event.loaded;
          const remainingSeconds = Math.round(remainingBytes / speedBps);

          let eta = "0s";
          if (remainingSeconds > 60) {
            eta = `${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s`;
          } else {
            eta = `${remainingSeconds}s`;
          }

          setDownloadProgress(prev => ({
            ...prev,
            progress,
            speed: `${speedMbps} MB/s`,
            eta: progress === 100 ? "Tayyorlanmoqda..." : eta
          }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const blob = xhr.response;
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${reel.product.title.replace(/\s+/g, '_')}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          setDownloadProgress(prev => ({ ...prev, isComplete: true, progress: 100 }));
          toast.success("Video muvaffaqiyatli yuklab olindi");

          setTimeout(() => {
            setDownloadProgress({
              progress: 0,
              speed: "0 MB/s",
              eta: "0s",
              isActive: false,
              isComplete: false
            });
          }, 2000);
        } else {
          throw new Error("Download failed");
        }
      };

      xhr.onerror = () => {
        setDownloadProgress(prev => ({ ...prev, isActive: false }));
        toast.error("Yuklab olishda xatolik yuz berdi");
      };

      xhr.send();

      // Also track in "Watch Later" as per previous logic
      await addToWatchLater(reel.product);
    } catch (err) {
      setDownloadProgress(prev => ({ ...prev, isActive: false }));
      toast.error("Yuklab olishda xatolik");
    }
  };

  const handleReport = () => {
    toast.info("Shikoyat yuborish tizimi tez orada ishga tushadi");
  };

  return (
    <div className={cn(
      "h-full w-full bg-reels relative",
      isMobile ? "flex items-center justify-center" : "flex flex-row"
    )}>
      {/* Download Progress Overlay */}
      {downloadProgress.isActive && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 pointer-events-auto bg-black/40 backdrop-blur-md">
          <div className="w-full max-w-xs bg-zinc-900/90 border border-white/20 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center gap-6">
              <div className="relative h-24 w-24 flex items-center justify-center">
                {/* Circular Progress (Simplified) */}
                <svg className="h-full w-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-white/10"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 44}
                    strokeDashoffset={2 * Math.PI * 44 * (1 - downloadProgress.progress / 100)}
                    className="text-primary transition-all duration-300 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {downloadProgress.isComplete ? (
                    <div className="bg-primary rounded-full p-3 animate-in zoom-in duration-300">
                      <Check className="h-8 w-8 text-black" />
                    </div>
                  ) : (
                    <span className="text-xl font-black text-white">{downloadProgress.progress}%</span>
                  )}
                </div>
              </div>

              <div className="text-center space-y-1">
                <h4 className="text-white font-bold">
                  {downloadProgress.isComplete ? "Yuklab olindi" : "Video yuklanmoqda"}
                </h4>
                {!downloadProgress.isComplete && (
                  <div className="flex items-center justify-center gap-3 text-white/50 text-[10px] font-bold uppercase tracking-widest pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {downloadProgress.eta}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{downloadProgress.speed}</span>
                  </div>
                )}
              </div>

              {!downloadProgress.isComplete && (
                <button
                  onClick={() => window.location.reload()} // Simple cancel for now
                  className="mt-2 text-white/40 hover:text-white text-xs font-bold transition-colors"
                >
                  Bekor qilish
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Video Section - Left on Desktop, Center on Mobile */}
      <div
        className={cn(
          "relative overflow-hidden transition-colors duration-300",
          isMobile ? "h-full w-full flex items-center justify-center" : "h-full flex-shrink-0"
        )}
        style={!isMobile ? { width: 'min(50%, 500px)' } : {}}
      >
        <video
          ref={videoRef}
          src={`${reel.videoUrl}${reel.videoUrl.includes('?') ? '&' : '?'}t=${reel.product.id}`}
          poster={reel.thumbnailUrl}
          loop
          muted={isMuted || !isActive}
          playsInline
          crossOrigin="anonymous"
          preload="metadata"
          onTimeUpdate={onTimeUpdate}
          onTouchStart={handleVideoTouchStart}
          onTouchEnd={handleVideoTouchEnd}
          onTouchMove={handleVideoTouchMove}
          onClick={handleTap}
          className="h-full w-full object-cover"
        />

        {isMobile && isPaused && !isLongPressing && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40" onClick={() => setIsPaused(false)}>
            <div className="h-20 w-20 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border-4 border-white/20">
              <Play className="h-10 w-10 text-white fill-white" />
            </div>
          </div>
        )}

        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="animate-reel-heart">
              <Heart className="h-32 w-32 text-white fill-white shadow-2xl" />
            </div>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); toggleMuted(); }}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-20 focus:opacity-100"
        >
          {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
        </button>

        {/* Right Side Actions - Mobile Only (Instagram Style) */}
        {isMobile && (
          <div className="absolute right-2 bottom-[84px] flex flex-col items-center gap-5 z-20">
            <div className="flex flex-col items-center">
              <button
                onClick={(e) => { e.stopPropagation(); handleLike(); }}
                className="group/btn flex flex-col items-center gap-1 transition-transform active:scale-125"
              >
                <div className="p-2.5 rounded-full hover:bg-white/10 transition-colors">
                  <Heart className={cn("h-7 w-7 transition-colors", isLiked ? "text-[#FF3040] fill-[#FF3040]" : "text-white fill-none")} strokeWidth={2.5} />
                </div>
              </button>
              <span className="text-[11px] font-bold text-white drop-shadow-md -mt-1">{formatCount(likesCount)}</span>
            </div>

            <div className="flex flex-col items-center">
              <button
                onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(true); }}
                className="group/btn flex flex-col items-center gap-1 transition-transform active:scale-125"
              >
                <div className="p-2.5 rounded-full hover:bg-white/10 transition-colors">
                  <MessageCircle className="h-7 w-7 text-white" strokeWidth={2.5} />
                </div>
              </button>
              <CommentCount productId={reel.product.id} />
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsSheetOpen(true); }}
                  className="p-2.5 rounded-full hover:bg-white/10 transition-all active:scale-125"
                >
                  <MoreVertical className="h-7 w-7 text-white" strokeWidth={2.5} />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-[32px] px-6 pb-12 border-none bg-background/80 dark:bg-black/60 backdrop-blur-3xl shadow-2xl text-foreground dark:text-white">
                <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-8 mt-2" />

                <SheetHeader className="sr-only">
                  <SheetTitle>Reels amallari</SheetTitle>
                  <SheetDescription>Ushbu Reels uchun mavjud harakatlar ro'yxati</SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="ghost"
                    className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl bg-muted/50 hover:bg-muted border border-border transition-all text-foreground dark:text-white active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSheetOpen(false);
                      handleShare();
                    }}
                  >
                    <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                      <Share2 className="h-7 w-7" />
                    </div>
                    <span className="text-xs font-bold">Ulashish</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSheetOpen(false);
                      handleFavorite();
                    }}
                  >
                    <div className={cn("p-3 rounded-xl bg-pink-500/20", isProductFavorite ? "text-pink-500" : "text-pink-400")}>
                      <Bookmark className={cn("h-7 w-7", isProductFavorite && "fill-current")} />
                    </div>
                    <span className="text-xs font-bold">{isProductFavorite ? "Saqlandi" : "Saqlash"}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSheetOpen(false);
                      handleWatchLater();
                    }}
                  >
                    <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
                      <Clock className="h-7 w-7" />
                    </div>
                    <span className="text-xs font-bold">Keyinroq</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSheetOpen(false);
                      handleDownload();
                    }}
                  >
                    <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Download className="h-7 w-7" />
                    </div>
                    <span className="text-xs font-bold">Yuklab olish</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex flex-col items-center justify-center gap-2 h-24 rounded-2xl bg-muted/50 hover:bg-muted border border-border transition-all text-foreground dark:text-white active:scale-95 col-span-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSheetOpen(false);
                      handleReport();
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Flag className="h-5 w-5 text-zinc-400" />
                      <span className="text-sm font-bold">Shikoyat qilish</span>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex items-center justify-between px-6 h-16 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all active:scale-[0.98] shadow-sm col-span-2 mt-2 border border-red-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSheetOpen(false);
                      toast.info("Bloklash funksiyasi");
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-red-500/10">
                        <UserX className="h-5 w-5" />
                      </div>
                      <span className="text-[15px] font-black">Bloklash</span>
                    </div>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/product/${reel.product.id}`); }}
              className="h-10 w-10 rounded-lg border-2 border-white/80 overflow-hidden shadow-xl mt-4 transition-transform hover:scale-110 active:scale-90 bg-zinc-800 flex items-center justify-center p-0"
            >
              {reel.product.images[0] || reel.thumbnailUrl || reel.product.author?.avatarUrl ? (
                <img
                  src={reel.product.images[0] || reel.thumbnailUrl || reel.product.author?.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <ShoppingBag className="h-5 w-5 text-white/50" />
              )}
            </button>
          </div>
        )}

        {/* Bottom Info Section - Mobile Only (Instagram Style) */}
        {isMobile && (
          <div className="absolute bottom-[72px] left-0 right-0 px-4 pt-16 pb-4 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none">
            <div className="flex flex-col gap-3 pointer-events-auto max-w-[80%]">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
                  onClick={(e) => { e.stopPropagation(); navigate(`/profile/${reel.author?.id || reel.product.sellerId}`); }}
                >
                  <Avatar size="md" borderColor="white">
                    <AvatarImage src={reel.author?.avatarUrl} />
                    <AvatarFallback>
                      <UserIcon className="h-5 w-5 text-white/50" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center flex-nowrap gap-1 text-shadow-sm">
                    <span className="text-white font-bold text-sm tracking-tight">
                      {reel.author?.fullName || "House Mobile"}
                    </span>
                    {(reel.author?.role === 'super_admin' || reel.author?.role === 'admin' || reel.author?.role === 'blogger' || reel.author?.role === 'seller') && (
                      <VerifiedBadge size={14} />
                    )}
                  </div>
                </div>

                {user?.id !== (reel.author?.id || reel.product.sellerId) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isFollowLoading}
                    onClick={handleFollow}
                    className={cn(
                      "h-7 px-3 text-[11px] font-bold border rounded-lg transition-all active:scale-95",
                      isFollowing
                        ? "bg-white/10 text-white border-white/20"
                        : "bg-transparent text-white border-white hover:bg-white/20"
                    )}
                  >
                    {isFollowLoading ? "..." : isFollowing ? "Obuna bo'lindi" : "Follow"}
                  </Button>
                )}
              </div>

              <div className="space-y-1.5 drop-shadow-md">
                <h3 className="text-white font-bold text-sm leading-tight line-clamp-1">{reel.product.title}</h3>
                <p className="text-white/95 text-xs line-clamp-2 leading-relaxed font-medium">
                  {reel.product.description}
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] shadow-lg pointer-events-auto hover:shadow-xl",
                    isProductInCart
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-white text-black hover:bg-zinc-100"
                  )}
                >
                  {isProductInCart ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                  <span className="text-[13px] font-bold">
                    {isProductInCart ? "Savatchada" : "Savatchaga qo'shish"}
                  </span>
                </button>

                {/* Narx (alohida qator, mukammal dizayn) */}
                <div className="animate-fade-in">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-white/10">
                      <div className="flex items-baseline gap-2">
                        <span className="text-white/70 text-xs font-medium">Narxi:</span>
                        <span className="text-white font-black text-xl tracking-tight">
                          {formatPriceNumber(reel.product.price)}
                        </span>
                        <span className="text-white/90 font-bold text-base">
                          {formatCurrencySymbol(reel.product.currency || "UZS")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-hidden bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full w-fit max-w-full">
                <Music2 className="h-3 w-3 text-white flex-shrink-0" />
                <div className="text-[11px] text-white font-semibold whitespace-nowrap overflow-hidden relative">
                  <div className="animate-reel-music inline-block">
                    {reel.author?.fullName || "House Mobile"} • Original Audio
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Content Section - Right Side */}
      {!isMobile && (
        <div className="flex-1 h-full flex flex-col justify-center px-6 py-8 bg-reels text-reels-foreground overflow-y-auto">
          <div className="max-w-md mx-auto w-full flex flex-col gap-6">
            {/* 1. Avatar + Username + Follow */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80"
                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${reel.author?.id || reel.product.sellerId}`); }}
              >
                <Avatar size="lg" borderColor="white">
                  <AvatarImage src={reel.author?.avatarUrl} />
                  <AvatarFallback>
                    <UserIcon className="h-8 w-8 text-white/50" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center flex-nowrap gap-2">
                  <span className="text-reels-foreground font-bold text-base tracking-tight">
                    {reel.author?.fullName || "House Mobile"}
                  </span>
                  {(reel.author?.role === 'super_admin' || reel.author?.role === 'admin' || reel.author?.role === 'blogger' || reel.author?.role === 'seller') && (
                    <VerifiedBadge size={16} />
                  )}
                </div>
              </div>

              {user?.id !== (reel.author?.id || reel.product.sellerId) && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isFollowLoading}
                  onClick={handleFollow}
                  className={cn(
                    "h-8 px-4 text-xs font-bold border rounded-lg transition-all",
                    isFollowing
                      ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                      : "bg-transparent text-white border-white hover:bg-white/20"
                  )}
                >
                  {isFollowLoading ? "..." : isFollowing ? "Obuna bo'lindi" : "Follow"}
                </Button>
              )}
            </div>

            {/* 2. Title */}
            <div>
              <h3 className="text-reels-foreground font-bold text-xl leading-tight">{reel.product.title}</h3>
            </div>

            {/* 3. Description */}
            <div>
              <BioDisplay
                bio={reel.product.description || ""}
                maxLines={4}
                className="text-reels-foreground/90 text-sm leading-relaxed [&_a]:text-reels-foreground/80 [&_a]:hover:text-reels-foreground [&_button]:text-reels-foreground/70 [&_button]:hover:text-reels-foreground"
              />
            </div>

            {/* 4. Savatga qo'shish tugmasi */}
            <div>
              <button
                onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
                className={cn(
                  "w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]",
                  isProductInCart
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                )}
              >
                {isProductInCart ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                <span className="text-sm font-bold">
                  {isProductInCart ? "Savatchada" : "Savatchaga qo'shish"}
                </span>
              </button>
            </div>

            {/* 5. Narx (alohida qator, mukammal dizayn) */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-muted/30 dark:bg-white/5 backdrop-blur-sm border border-border dark:border-white/10 rounded-2xl px-6 py-4 hover:bg-muted/50 dark:hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-reels-foreground/60 text-sm font-medium">Narxi:</span>
                    <span className="text-reels-foreground font-black text-2xl tracking-tight">
                      {formatPriceNumber(reel.product.price)}
                    </span>
                    <span className="text-reels-foreground/90 font-bold text-lg">
                      {formatCurrencySymbol(reel.product.currency || "UZS")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Like/Comment/Share iconlar (gorizontal qator) */}
            <div className="flex items-center gap-6">
              <button
                onClick={(e) => { e.stopPropagation(); handleLike(); }}
                className="flex items-center gap-2 transition-transform active:scale-95"
              >
                <Heart className={cn("h-6 w-6 transition-colors", isLiked ? "text-[#FF3040] fill-[#FF3040]" : "text-reels-foreground dark:text-white fill-none")} strokeWidth={2.5} />
                <span className="text-reels-foreground dark:text-white font-bold text-sm">{formatCount(likesCount)}</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(true); }}
                className="flex items-center gap-2 transition-transform active:scale-95"
              >
                <MessageCircle className="h-6 w-6 text-reels-foreground dark:text-white" strokeWidth={2.5} />
                <CommentCount productId={reel.product.id} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                className="flex items-center gap-2 transition-transform active:scale-95"
              >
                <Share2 className="h-6 w-6 text-reels-foreground dark:text-white" strokeWidth={2.5} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleFavorite(); }}
                className="flex items-center gap-2 transition-transform active:scale-95"
              >
                <Bookmark className={cn("h-6 w-6 transition-colors", isProductFavorite ? "text-yellow-400 fill-yellow-400" : "text-reels-foreground dark:text-white fill-none")} strokeWidth={2.5} />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-full hover:bg-white/10 transition-all"
                  >
                    <MoreVertical className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border-border text-popover-foreground">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWatchLater(); }} className="focus:bg-accent cursor-pointer transition-colors">
                    <Clock className="h-4 w-4 mr-2" />
                    Keyinroq ko'rish
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="focus:bg-accent cursor-pointer transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Yuklab olish
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReport(); }} className="focus:bg-accent cursor-pointer transition-colors">
                    <Flag className="h-4 w-4 mr-2" />
                    Shikoyat qilish
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); toast.info("Bloklash funksiyasi"); }}
                    className="text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer transition-colors"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Foydalanuvchini bloklash
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 6. Audio info */}
            <div className="flex items-center gap-2 overflow-hidden bg-muted/50 dark:bg-black/20 backdrop-blur-sm px-3 py-2 rounded-full w-fit">
              <Music2 className="h-4 w-4 text-reels-foreground dark:text-white flex-shrink-0" />
              <div className="text-xs text-reels-foreground dark:text-white font-semibold whitespace-nowrap overflow-hidden relative">
                <div className="animate-reel-music inline-block">
                  {reel.author?.fullName || "House Mobile"} • Original Audio
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CommentsDrawer
        isOpen={isCommentsOpen}
        onOpenChange={setIsCommentsOpen}
        productId={reel.product.id}
      />
    </div>
  );
}
