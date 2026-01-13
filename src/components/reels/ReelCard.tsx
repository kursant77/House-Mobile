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
  Pause,
  Clock,
  Download,
  Flag,
  UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      supabase.removeChannel(channel);
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
  const [progress, setProgress] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const isProductFavorite = isFavorite(reel.product.id);
  const isProductInCart = isInCart(reel.product.id);

  useEffect(() => {
    const checkFollow = async () => {
      if (isAuthenticated && reel.author?.id) {
        try {
          const status = await socialService.isFollowing(reel.author.id);
          setIsFollowing(status);
        } catch (error) {
          console.error("Check follow status error:", error);
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
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
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

  const handleVideoTouchMove = (e: React.TouchEvent) => {
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
    try {
      await addToWatchLater(reel.product);

      const link = document.createElement('a');
      link.href = reel.videoUrl;
      link.download = `${reel.product.title}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Video yuklanmoqda...");
    } catch (err) {
      toast.error("Yuklab olishda xatolik");
      console.error("Download error:", err);
    }
  };

  const handleReport = () => {
    toast.info("Shikoyat yuborish tizimi tez orada ishga tushadi");
  };

  return (
    <div
      className="relative h-full w-full bg-reels flex items-center justify-center overflow-hidden transition-colors duration-300"
    >
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnailUrl}
        loop
        muted={isMuted || !isActive}
        playsInline
        onTimeUpdate={onTimeUpdate}
        onTouchStart={handleVideoTouchStart}
        onTouchEnd={handleVideoTouchEnd}
        onTouchMove={handleVideoTouchMove}
        onClick={handleTap}
        className="h-full w-full object-cover md:max-w-[450px] md:rounded-lg"
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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-full bg-black/20 backdrop-blur-md opacity-0 hover:opacity-100 transition-opacity z-10 focus:opacity-100"
      >
        {isMuted ? <VolumeX className="h-10 w-10 text-white" /> : <Volume2 className="h-10 w-10 text-white" />}
      </button>

      <div className="absolute right-2 bottom-20 md:right-4 md:bottom-24 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="transition-transform active:scale-125">
            <Heart className={cn("h-8 w-8 drop-shadow-lg", isLiked ? "text-red-500 fill-red-500" : "text-white fill-none")} />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">{formatCount(likesCount)}</span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(true); }}
            className="transition-transform active:scale-125"
          >
            <MessageCircle className="h-8 w-8 text-white drop-shadow-lg" />
          </button>
          <CommentCount productId={reel.product.id} />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); handleFavorite(); }} className="transition-transform active:scale-125">
            <Bookmark className={cn("h-8 w-8 drop-shadow-lg", isProductFavorite ? "text-yellow-400 fill-yellow-400" : "text-white fill-none")} />
          </button>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center transition-all animate-pulse-slow",
            isProductInCart ? "bg-green-500" : "bg-primary text-primary-foreground shadow-lg"
          )}
        >
          {isProductInCart ? <Check className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="transition-transform active:scale-125"
        >
          <Share2 className="h-7 w-7 text-white drop-shadow-lg" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="transition-transform active:scale-125"
            >
              <MoreVertical className="h-6 w-6 text-white drop-shadow-lg" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWatchLater(); }}>
              <Clock className="h-4 w-4 mr-2" />
              Keyinroq ko'rish
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
              <Download className="h-4 w-4 mr-2" />
              Yuklab olish
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReport(); }}>
              <Flag className="h-4 w-4 mr-2" />
              Shikoyat qilish
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); toast.info("Bloklash funksiyasi"); }}
              className="text-destructive focus:text-destructive"
            >
              <UserX className="h-4 w-4 mr-2" />
              Foydalanuvchini bloklash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/product/${reel.product.id}`); }}
          className="h-9 w-9 rounded-md border-2 border-white overflow-hidden shadow-xl mt-2 transition-transform hover:scale-110"
        >
          <img src={reel.product.images[0]} alt="" className="h-full w-full object-cover" />
        </button>
      </div>

      <div className="absolute bottom-6 left-0 right-0 px-4 pt-10 pb-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          <div
            className="flex items-center gap-2 cursor-pointer w-fit"
            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${reel.author?.id || reel.product.sellerId}`); }}
          >
            <Avatar className="h-8 w-8 border border-white/20">
              <AvatarImage src={reel.author?.avatarUrl} />
              <AvatarFallback className="text-[10px]">{reel.author?.fullName?.charAt(0) || "H"}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 drop-shadow-md">
              <span className="text-white font-bold text-sm">
                {reel.author?.fullName || "House Mobile"}
              </span>
              {(reel.author?.role === 'super_admin' || reel.author?.role === 'blogger') && (
                <VerifiedBadge size={14} />
              )}
            </div>
            {user?.id !== (reel.author?.id || reel.product.sellerId) && (
              <Button
                size="sm"
                variant={isFollowing ? "secondary" : "outline"}
                disabled={isFollowLoading}
                onClick={handleFollow}
                className={cn(
                  "h-7 px-3 text-[10px] font-black uppercase tracking-widest backdrop-blur-md rounded-md transition-all active:scale-95",
                  isFollowing
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-primary text-primary-foreground border-transparent border-primary/40"
                )}
              >
                {isFollowLoading ? "..." : isFollowing ? "Obuna bo'lindi" : "Obuna bo'lish"}
              </Button>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-white font-bold text-sm drop-shadow-md">{reel.product.title}</h3>
            <p className="text-white/90 text-xs line-clamp-2 leading-relaxed drop-shadow-sm max-w-[80%]">
              {reel.product.description}
            </p>
          </div>

          <div className="flex items-center gap-1.5 py-1 px-2.5 bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-full w-fit">
            <span className="text-xs font-black text-primary">{new Intl.NumberFormat("uz-UZ").format(reel.product.price)} UZS</span>
          </div>

          <div className="flex items-center gap-2 overflow-hidden w-[60%]">
            <Music2 className="h-3 w-3 text-white animate-pulse" />
            <div className="text-[10px] text-white font-medium whitespace-nowrap animate-reel-music">
              {reel.author?.fullName || "House Mobile"} • Original Audio
            </div>
          </div>
        </div>
      </div>

      <CommentsDrawer
        isOpen={isCommentsOpen}
        onOpenChange={setIsCommentsOpen}
        productId={reel.product.id}
      />
    </div>
  );
}
