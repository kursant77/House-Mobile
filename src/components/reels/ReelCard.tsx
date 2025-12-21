import { useNavigate } from "react-router-dom";
import { ReelItem } from "@/types/product";
import { useState, useRef, useEffect } from "react";
import { Heart, Star, ShoppingBag, Share2, Volume2, VolumeX, ExternalLink, Check, MessageCircle, ThumbsDown, Music2, Search, Camera, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { ShareDrawer } from "./ShareDrawer";
import { CommentsDrawer } from "./CommentsDrawer";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(reel.isLiked);
  const [likeAnimation, setLikeAnimation] = useState(false);

  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);
  // ...

  const isProductFavorite = isFavorite(reel.product.id);
  const isProductInCart = isInCart(reel.product.id);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => { });
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
    toggleFavorite(reel.product);
    toast.success(isProductFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleAddToCart = () => {
    addToCart(reel.product);
    toast.success("Added to cart");
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

    <div className="relative h-full w-full snap-start bg-black flex flex-col md:flex-row">

      {/* video container */}
      <div className="relative h-full w-full md:w-auto md:aspect-[9/16] bg-black shrink-0 mx-auto">
        <video
          ref={videoRef}
          src={reel.videoUrl}
          poster={reel.thumbnailUrl}
          loop
          muted={isMuted}
          playsInline
          className="h-full w-full object-cover"
        />

        {/* --- MOBILE OVERLAYS (md:hidden) --- */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 md:hidden" />

        {/* Mobile Mute */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 left-4 rounded-full bg-black/40 p-2 backdrop-blur-sm md:hidden"
        >
          {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
        </button>

        {/* Mobile Right Actions */}
        <div className="absolute bottom-4 right-2 flex flex-col items-center gap-6 z-20 pb-12 md:pb-4 md:hidden">
          <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
            <div className="rounded-full bg-zinc-800/60 p-3 backdrop-blur-sm active:scale-95">
              <Heart className={cn("h-7 w-7", isLiked ? "fill-red-500 text-red-500" : "text-white fill-white")} />
            </div>
            <span className="text-xs font-medium text-white shadow-black drop-shadow-md">{formatLikes(reel.likes + (isLiked ? 1 : 0))}</span>
          </button>
          <button className="flex flex-col items-center gap-1 group">
            <div className="rounded-full bg-zinc-800/60 p-3 backdrop-blur-sm active:scale-95">
              <ThumbsDown className="h-7 w-7 text-white fill-white" />
            </div>
            <span className="text-xs font-medium text-white shadow-black drop-shadow-md">Dislike</span>
          </button>
          <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 group">
            <div className="rounded-full bg-zinc-800/60 p-3 backdrop-blur-sm active:scale-95">
              <MessageCircle className="h-7 w-7 text-white fill-white" />
            </div>
            <span className="text-xs font-medium text-white shadow-black drop-shadow-md">1.2K</span>
          </button>
          <button onClick={() => setShowShare(true)} className="flex flex-col items-center gap-1 group">
            <div className="rounded-full bg-zinc-800/60 p-3 backdrop-blur-sm active:scale-95">
              <Share2 className="h-7 w-7 text-white fill-white" />
            </div>
            <span className="text-xs font-medium text-white shadow-black drop-shadow-md">Share</span>
          </button>
          <button onClick={handleAddToCart} className="flex flex-col items-center gap-1.5 group mt-2 relative">
            <div className={cn(
              "relative rounded-2xl overflow-hidden h-14 w-14 flex items-center justify-center transition-all active:scale-90",
              isProductInCart
                ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50"
                : "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 shadow-xl shadow-pink-500/60"
            )}>
              {isProductInCart ? (
                <Check className="h-7 w-7 text-white stroke-[3]" />
              ) : (
                <ShoppingBag className="h-7 w-7 text-white stroke-[2.5]" />
              )}
            </div>
            <span className={cn(
              "text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-lg",
              isProductInCart
                ? "bg-green-500 text-white"
                : "bg-gradient-to-r from-pink-500 to-red-500 text-white"
            )}>
              {isProductInCart ? "IN CART" : "SHOP NOW"}
            </span>
          </button>
        </div>

        {/* Mobile Bottom Info */}
        <div className="absolute bottom-4 left-4 right-20 z-20 pb-12 md:pb-4 flex flex-col gap-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center border border-white/20">
              <span className="font-bold text-white text-xs">HM</span>
            </div>
            <span className="text-white font-semibold text-sm drop-shadow-md">@housemobile</span>
            <button className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full">Subscribe</button>
          </div>
          <div className="space-y-1">
            <p className="text-white text-sm line-clamp-2 drop-shadow-md">{reel.product.title}</p>
            <div onClick={handleViewProduct} className="flex items-center gap-2 cursor-pointer bg-white/10 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
              <ShoppingBag className="h-3 w-3 text-white" />
              <span className="text-white text-xs font-medium">View Product · {formatPrice(reel.product.price)} UZS</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- DESKTOP SIDE PANEL (hidden md:flex) --- */}
      <div className="hidden md:flex flex-1 flex-col bg-zinc-950 h-full border-l border-white/10">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-violet-600 rounded-full blur opacity-75"></div>
              <div className="relative h-10 w-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs ring-2 ring-black">HM</div>
            </div>
            <div className="flex flex-col">
              <h3 className="font-bold text-sm text-white tracking-wide">House Mobile</h3>
              <span className="text-[10px] text-zinc-400 font-medium bg-white/10 px-1.5 py-0.5 rounded w-fit mt-0.5">Tech Reviewer</span>
            </div>
          </div>
          <button className="bg-white text-black hover:bg-gray-200 px-5 py-2 rounded-full text-xs font-bold transition-all transform active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            Subscribe
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-none">
          {/* Description */}
          <div className="space-y-3">
            <h2 className="font-bold text-xl leading-snug text-white tracking-tight">{reel.product.title}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed text-balance">
              {reel.product.description}
            </p>
            <div className="flex gap-2 flex-wrap">
              {['tech', 'mobile', 'review', 'gadgets'].map(tag => (
                <span key={tag} className="text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">#{tag}</span>
              ))}
            </div>
          </div>

          {/* Enhanced Product Box */}
          <div
            onClick={handleViewProduct}
            className="group relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-3 flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                <img src={reel.product.images[0]} className="h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-500" alt="prod" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-zinc-300 mb-0.5">Featured Product</p>
                <p className="font-bold text-white tracking-tight">{formatPrice(reel.product.price)} UZS</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white text-white group-hover:text-black transition-all">
                <ExternalLink className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Beautiful Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 transition-all transform active:scale-95 shadow-lg relative overflow-hidden",
              isProductInCart
                ? "bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/50"
                : "bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 shadow-pink-500/60 hover:shadow-pink-500/80 hover:scale-[1.02]"
            )}
          >
            <div className="absolute inset-0 bg-white/10" />
            <div className="relative flex items-center gap-2.5 text-white">
              <div className="h-6 w-6 rounded-full bg-white/25 flex items-center justify-center">
                {isProductInCart ? <Check className="h-4 w-4 stroke-[2.5]" /> : <ShoppingBag className="h-4 w-4 stroke-[2.5]" />}
              </div>
              <span className="font-semibold">{isProductInCart ? "Added ✓" : "Add to Cart"}</span>
            </div>
          </button>

          {/* Stylized Comments Section */}
          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm text-white">Comments (1.2K)</h4>
              <button className="text-xs text-zinc-500 hover:text-white transition-colors">View all</button>
            </div>
            <div className="space-y-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 group">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 shrink-0" />
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">User_{i}</span>
                      <span className="text-[10px] text-zinc-600">2h ago</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      This design looks absolutely stunning! The glassmorphism effect is top notch. 🔥
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Polished Bottom Actions Bar */}
        <div className="p-2 border-t border-white/10 bg-zinc-950/80 backdrop-blur-md grid grid-cols-4 gap-1">
          <button onClick={handleLike} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/5 transition-all group active:scale-95">
            <Heart className={cn("h-6 w-6 transition-transform group-hover:scale-110", isLiked ? "fill-red-500 text-red-500 shadow-red-500/50 drop-shadow-sm" : "text-zinc-400 group-hover:text-white")} />
            <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300">{formatLikes(reel.likes + (isLiked ? 1 : 0))}</span>
          </button>
          <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/5 transition-all group active:scale-95">
            <MessageCircle className="h-6 w-6 text-zinc-400 group-hover:text-white transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300">1.2K</span>
          </button>
          <button onClick={() => setShowShare(true)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/5 transition-all group active:scale-95">
            <Share2 className="h-6 w-6 text-zinc-400 group-hover:text-white transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300">Share</span>
          </button>
          <button onClick={handleFavorite} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/5 transition-all group active:scale-95">
            <Star className={cn("h-6 w-6 transition-transform group-hover:scale-110", isProductFavorite ? "fill-yellow-400 text-yellow-400 shadow-yellow-400/50 drop-shadow-sm" : "text-zinc-400 group-hover:text-white")} />
            <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300">Save</span>
          </button>
        </div>
      </div>

      <ShareDrawer isOpen={showShare} onOpenChange={setShowShare} productTitle={reel.product.title} />
      <CommentsDrawer isOpen={showComments} onOpenChange={setShowComments} />

    </div>
  );
}
