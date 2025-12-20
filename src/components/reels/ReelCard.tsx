import { useNavigate } from "react-router-dom";
import { ReelItem } from "@/types/product";

interface ReelCardProps {
  reel: ReelItem;
  isActive: boolean;
  onLike: (id: string) => void;
  onFavorite: (id: string) => void;
  onAddToCart: (id: string) => void;
}

import { useState, useRef, useEffect } from "react";
import { Heart, Star, ShoppingBag, Share2, Volume2, VolumeX, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReelCard({
  reel,
  isActive,
  onLike,
  onFavorite,
  onAddToCart,
}: ReelCardProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(reel.isLiked);
  const [isFavorite, setIsFavorite] = useState(reel.isFavorite);
  const [likeAnimation, setLikeAnimation] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeAnimation(true);
    setTimeout(() => setLikeAnimation(false), 300);
    onLike(reel.id);
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    onFavorite(reel.id);
  };

  const handleViewProduct = () => {
    navigate(`/product/${reel.product.id}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price);
  };

  const formatLikes = (likes: number) => {
    if (likes >= 1000) {
      return `${(likes / 1000).toFixed(1)}K`;
    }
    return likes.toString();
  };

  return (
    <div className="relative h-full w-full snap-start bg-reels">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnailUrl}
        loop
        muted={isMuted}
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-reels-overlay/80 via-transparent to-reels-overlay/30" />

      {/* Mute toggle */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute right-4 top-16 rounded-full bg-reels-foreground/10 p-2 backdrop-blur-sm transition-all active:scale-95"
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5 text-reels-foreground" />
        ) : (
          <Volume2 className="h-5 w-5 text-reels-foreground" />
        )}
      </button>

      {/* Action buttons - Right side */}
      <div className="absolute bottom-32 right-4 flex flex-col items-center gap-5">
        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 active:scale-95"
        >
          <div
            className={cn(
              "rounded-full bg-reels-foreground/10 p-3 backdrop-blur-sm transition-all",
              likeAnimation && "animate-heart-pop"
            )}
          >
            <Heart
              className={cn(
                "h-7 w-7 transition-colors",
                isLiked ? "fill-like text-like" : "text-reels-foreground"
              )}
            />
          </div>
          <span className="text-xs font-medium text-reels-foreground">
            {formatLikes(reel.likes + (isLiked ? 1 : 0))}
          </span>
        </button>

        {/* Favorite */}
        <button
          onClick={handleFavorite}
          className="flex flex-col items-center gap-1 active:scale-95"
        >
          <div className="rounded-full bg-reels-foreground/10 p-3 backdrop-blur-sm transition-all">
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                isFavorite
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-reels-foreground"
              )}
            />
          </div>
          <span className="text-xs font-medium text-reels-foreground">Save</span>
        </button>

        {/* Add to Cart */}
        <button
          onClick={() => onAddToCart(reel.id)}
          className="flex flex-col items-center gap-1 active:scale-95"
        >
          <div className="rounded-full bg-reels-foreground/10 p-3 backdrop-blur-sm transition-all">
            <ShoppingBag className="h-7 w-7 text-reels-foreground" />
          </div>
          <span className="text-xs font-medium text-reels-foreground">Cart</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1 active:scale-95">
          <div className="rounded-full bg-reels-foreground/10 p-3 backdrop-blur-sm transition-all">
            <Share2 className="h-7 w-7 text-reels-foreground" />
          </div>
          <span className="text-xs font-medium text-reels-foreground">Share</span>
        </button>
      </div>

      {/* Product info - Bottom (clickable) */}
      <button
        onClick={handleViewProduct}
        className="absolute bottom-20 left-4 right-20 text-left animate-slide-up"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-reels-foreground line-clamp-2">
              {reel.product.title}
            </h3>
            <ExternalLink className="h-4 w-4 text-reels-foreground/70 shrink-0" />
          </div>
          <p className="text-sm text-reels-foreground/70 line-clamp-2">
            {reel.product.description}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-reels-foreground">
              {formatPrice(reel.product.price)} {reel.product.currency}
            </span>
            {reel.product.originalPrice && (
              <span className="text-sm text-reels-foreground/50 line-through">
                {formatPrice(reel.product.originalPrice)}
              </span>
            )}
          </div>
          {reel.product.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-reels-foreground/80">
                {reel.product.rating} ({reel.product.reviewCount} reviews)
              </span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
