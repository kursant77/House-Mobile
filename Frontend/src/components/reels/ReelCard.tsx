import { useNavigate } from "react-router-dom";
import { ReelItem } from "@/types/product";
import { useState, useRef, useEffect } from "react";
import { Heart, Star, ShoppingBag, Share2, Volume2, VolumeX, ExternalLink, Check, MessageCircle, ThumbsDown } from "lucide-react";
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

  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);

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
    onLike(reel.id);
  };

  const handleFavorite = () => {
    toggleFavorite(reel.product);
    toast.success(isProductFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleAddToCart = () => {
    addToCart(reel.product);
    toast.success("Savatchaga qo'shildi");
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
      {/* Video qismi */}
      <div className="relative h-full w-full md:w-auto md:aspect-[9/16] bg-black shrink-0 mx-auto overflow-hidden">
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

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 left-4 rounded-full bg-black/40 p-2 backdrop-blur-sm md:hidden z-30"
        >
          {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
        </button>

        {/* Mobile Actions */}
        <div className="absolute bottom-12 right-2 flex flex-col items-center gap-6 z-20 md:hidden">
          <button onClick={handleLike} className="flex flex-col items-center gap-1">
            <div className="rounded-full bg-zinc-800/60 p-3 backdrop-blur-sm">
              <Heart className={cn("h-7 w-7", isLiked ? "fill-red-500 text-red-500" : "text-white fill-white")} />
            </div>
            <span className="text-xs font-medium text-white drop-shadow-md">{formatLikes(reel.likes + (isLiked ? 1 : 0))}</span>
          </button>
          {/* ... mobile qolgan tugmalari ... */}
          <button onClick={handleAddToCart} className="active:scale-95">
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all",
              isProductInCart ? "bg-green-500 " : "bg-gradient-to-br from-pink-500 to-rose-600"
            )}>
              {isProductInCart ? <Check className="h-7 w-7 text-white" /> : <ShoppingBag className="h-7 w-7 text-white" />}
            </div>
          </button>
        </div>

        {/* Mobile Info */}
        <div className="absolute bottom-16 left-4 right-20 z-20 md:hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white">HM</div>
            <span className="text-white font-bold text-sm">@housemobile</span>
          </div>
          <p className="text-white text-sm line-clamp-2 drop-shadow-md font-medium">{reel.product.title}</p>
        </div>
      </div>

      {/* --- DESKTOP PREMIUM SIDE PANEL --- */}
      <div className="hidden md:flex flex-1 flex-col bg-zinc-950 h-full border-l border-white/10 relative">
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center border-2 border-primary/30 p-0.5">
              <div className="h-full w-full rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">HM</div>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">House Mobile</h3>
              <span className="text-[10px] text-zinc-500 font-medium bg-zinc-900 px-2 py-0.5 rounded">Tech Reviewer</span>
            </div>
          </div>
          <button className="bg-white text-black font-extrabold px-6 py-2 rounded-full text-xs hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Subscribe
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-4 space-y-6 overflow-y-auto scrollbar-none">
          <h2 className="text-2xl font-bold text-white leading-tight">{reel.product.title}</h2>

          <p className="text-zinc-400 text-sm leading-relaxed">
            🔥 {reel.product.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {['tech', 'mobile', 'review', 'gadgets'].map(tag => (
              <span key={tag} className="text-xs font-semibold text-blue-400">#{tag}</span>
            ))}
          </div>

          {/* Featured Product Card */}
          <div
            onClick={handleViewProduct}
            className="group mt-4 bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-900/60 transition-all border-dashed"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-white rounded-xl overflow-hidden p-1">
                <img src={reel.product.images[0]} alt="" className="h-full w-full object-contain group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Featured Product</span>
                <p className="text-lg font-black text-white">{formatPrice(reel.product.price)} UZS</p>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
              <ExternalLink className="h-5 w-5" />
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className={cn(
              "w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all relative overflow-hidden group/btn",
              isProductInCart
                ? "bg-green-500 text-white"
                : "bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:shadow-[0_15px_40px_rgba(244,63,94,0.5)] active:scale-[0.98]"
            )}
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
              <ShoppingBag className="h-3.5 w-3.5" />
            </div>
            <span className="tracking-wide">{isProductInCart ? "SAVATCHAGA QO'SHILDI" : "Add to Cart"}</span>
          </button>

          {/* Comments Section Preview */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-white text-sm">Comments (1.2K)</h4>
              <span className="text-[10px] text-zinc-500 font-bold uppercase cursor-pointer hover:text-white transition-colors">View all</span>
            </div>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-800" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-300">User_{i}</span>
                      <span className="text-[10px] text-zinc-600">2h ago</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">Bu dizayn juda ajoyib ishlangan! 🔥</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 bg-zinc-950 flex items-center justify-around">
          <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
            <Heart className={cn("h-7 w-7 transition-all active:scale-125", isLiked ? "fill-red-500 text-red-500" : "text-zinc-500 hover:text-white")} />
            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300">12.5K</span>
          </button>
          <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 group">
            <MessageCircle className="h-7 w-7 text-zinc-500 group-hover:text-white transition-all" />
            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300">1.2K</span>
          </button>
          <button onClick={() => setShowShare(true)} className="flex flex-col items-center gap-1 group">
            <Share2 className="h-7 w-7 text-zinc-500 group-hover:text-white transition-all" />
            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300">Share</span>
          </button>
          <button onClick={handleFavorite} className="flex flex-col items-center gap-1 group">
            <Star className={cn("h-7 w-7 transition-all", isProductFavorite ? "fill-yellow-400 text-yellow-400" : "text-zinc-500 hover:text-white")} />
            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300">Save</span>
          </button>
        </div>
      </div>

      <ShareDrawer isOpen={showShare} onOpenChange={setShowShare} productTitle={reel.product.title} />
      <CommentsDrawer isOpen={showComments} onOpenChange={setShowComments} />
    </div>
  );
}
