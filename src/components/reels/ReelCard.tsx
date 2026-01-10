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
  Pause
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { socialService } from "@/services/api/social";
import { CommentsDrawer } from "./CommentsDrawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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
    refetchInterval: 2000, // Har 2 soniyada yangilash
    enabled: !!productId,
  });

  // Real-time subscription
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
  const { isAuthenticated } = useAuthStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartTime = useRef<number>(0);
  const isMobile = useIsMobile();

  const [isMuted, setIsMuted] = useState(false); // Default ovozli
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
    if (videoRef.current) {
      if (isActive && !isPaused) {
        videoRef.current.play().catch(() => { });
      } else {
        videoRef.current.pause();
        if (!isActive) {
          videoRef.current.currentTime = 0;
        }
      }
    }
  }, [isActive, isPaused]);

  // Reels bo'limiga o'tganda ovozni yoqish
  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.muted = isMuted;
      if (!isPaused) {
        videoRef.current.play().catch(() => { });
      }
    }
  }, [isActive, isMuted]);

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
      onLike(reel.id); // Keep visual feedback for parent if needed
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikesCount(prev => !isLiked ? prev - 1 : prev + 1);
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Mobile versiyada touch event bo'lsa, pauza/play boshqaruvini qo'shish
    if (isMobile && e.type === 'touchstart') {
      return; // Touch eventni handleVideoTouch ga qoldirish
    }

    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      if (!isLiked) {
        handleLike();
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
    lastTapRef.current = now;
  };

  // Long-press pause detection
  const handleVideoTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;

    e.stopPropagation();
    touchStartTime.current = Date.now();

    // Clear any existing timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    // Start long-press timer (0,5 second)
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

    // Clear the timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Resume video if it was paused by long-press
    if (isLongPressing && isPaused && videoRef.current) {
      setIsPaused(false);
      setIsLongPressing(false);
      videoRef.current.play().catch(() => { });
    }
  };

  const handleVideoTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;

    // Cancel long-press if user moves their finger (scrolling)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Cleanup timer on unmount
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

  return (
    <div
      className="relative h-full w-full bg-reels flex items-center justify-center overflow-hidden transition-colors duration-300"
      onClick={handleDoubleTap}
    >
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnailUrl}
        loop
        muted={isMuted}
        playsInline
        onTimeUpdate={onTimeUpdate}
        onTouchStart={handleVideoTouchStart}
        onTouchEnd={handleVideoTouchEnd}
        onTouchMove={handleVideoTouchMove}
        className="h-full w-full object-cover md:max-w-[450px] md:rounded-lg"
      />

      {/* Mobile Pause/Play Overlay */}
      {isMobile && isPaused && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40">
          <div className="h-20 w-20 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border-4 border-white/20">
            <Play className="h-10 w-10 text-white fill-white" />
          </div>
        </div>
      )}

      {/* --- OVERLAYS --- */}

      {/* Double Tap Heart Animation */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-reel-heart">
            <Heart className="h-32 w-32 text-white fill-white shadow-2xl" />
          </div>
        </div>
      )}

      {/* Mute Toggle Overlay */}
      <button
        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-full bg-black/20 backdrop-blur-md opacity-0 hover:opacity-100 transition-opacity z-10 focus:opacity-100"
      >
        {isMuted ? <VolumeX className="h-10 w-10 text-white" /> : <Volume2 className="h-10 w-10 text-white" />}
      </button>

      {/* --- RIGHT ACTIONS SIDEBAR --- */}
      <div className="absolute right-2 bottom-20 md:right-4 md:bottom-24 flex flex-col items-center gap-6 z-20">
        {/* Like */}
        <div className="flex flex-col items-center gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="transition-transform active:scale-125">
            <Heart className={cn("h-8 w-8 drop-shadow-lg", isLiked ? "text-red-500 fill-red-500" : "text-white fill-none")} />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">{formatCount(likesCount)}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(true); }}
            className="transition-transform active:scale-125"
          >
            <MessageCircle className="h-8 w-8 text-white drop-shadow-lg" />
          </button>
          <CommentCount productId={reel.product.id} />
        </div>

        {/* Save/Favorite */}
        <div className="flex flex-col items-center gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); handleFavorite(); }} className="transition-transform active:scale-125">
            <Bookmark className={cn("h-8 w-8 drop-shadow-lg", isProductFavorite ? "text-yellow-400 fill-yellow-400" : "text-white fill-none")} />
          </button>
        </div>

        {/* Add to Cart - Special Instagram Style */}
        <button
          onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center transition-all animate-pulse-slow",
            isProductInCart ? "bg-green-500" : "bg-primary text-primary-foreground shadow-lg"
          )}
        >
          {isProductInCart ? <Check className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />}
        </button>

        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="transition-transform active:scale-125"
        >
          <Share2 className="h-7 w-7 text-white drop-shadow-lg" />
        </button>

        {/* More */}
        <button className="transition-transform active:scale-125">
          <MoreVertical className="h-6 w-6 text-white drop-shadow-lg" />
        </button>

        {/* Product Thumbnail (Buy Now shortcut) */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/product/${reel.product.id}`); }}
          className="h-9 w-9 rounded-md border-2 border-white overflow-hidden shadow-xl mt-2 transition-transform hover:scale-110"
        >
          <img src={reel.product.images[0]} alt="" className="h-full w-full object-cover" />
        </button>
      </div>

      {/* --- BOTTOM INFO OVERLAY --- */}
      <div className="absolute bottom-6 left-0 right-0 px-4 pt-10 pb-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          {/* Profile Row */}
          <div
            className="flex items-center gap-2 cursor-pointer w-fit"
            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${reel.author?.id || reel.product.sellerId}`); }}
          >
            <Avatar className="h-8 w-8 border border-white/20">
              <AvatarImage src={reel.author?.avatarUrl} />
              <AvatarFallback className="text-[10px]">{reel.author?.fullName?.charAt(0) || "H"}</AvatarFallback>
            </Avatar>
            <span className="text-white font-bold text-sm drop-shadow-md">
              {reel.author?.fullName || "House Mobile"}
            </span>
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
          </div>

          {/* Title & Description */}
          <div className="space-y-1">
            <h3 className="text-white font-bold text-sm drop-shadow-md">{reel.product.title}</h3>
            <p className="text-white/90 text-xs line-clamp-2 leading-relaxed drop-shadow-sm max-w-[80%]">
              {reel.product.description}
            </p>
          </div>

          {/* Price Tag - Exclusive for House Mobile */}
          <div className="flex items-center gap-1.5 py-1 px-2.5 bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-full w-fit">
            <span className="text-xs font-black text-primary">{new Intl.NumberFormat("uz-UZ").format(reel.product.price)} UZS</span>
          </div>

          {/* Audio Label (Authentic Instagram Element) */}
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
