import { memo } from "react";
import { Product } from "@/types/product";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { VerifiedBadge } from "../ui/VerifiedBadge";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "wide" | "review";
}

export const ProductCard = memo(({ product, variant = "default" }: ProductCardProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { addToCart } = useCartStore();
  const isProductFavorite = isFavorite(product.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Iltimos, avval tizimga kiring");
      navigate("/auth");
      return;
    }
    toggleFavorite(product);
    toast.success(isProductFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Iltimos, avval tizimga kiring");
      navigate("/auth");
      return;
    }
    addToCart(product);
    toast.success("Added to cart");
  }

  const aspectClass = variant === "wide" || variant === "review" ? "aspect-video" : "aspect-[4/5]";

  if (variant === "review") {
    return (
      <Link to={`/product/${product.id}`} className="group relative w-full rounded-2xl overflow-hidden bg-black isolate aspect-video block">
        {/* Background Image/Video */}
        <img
          src={product.images[0]}
          alt={product.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-60"
        />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-110">
          <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:bg-white/30">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black ml-0.5"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 flex flex-col justify-end p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-bold text-white uppercase tracking-wider">
              {product.category || "Review"}
            </span>
            <div className="flex items-center gap-1 text-white/70 text-xs">
              <span className="w-1 h-1 rounded-full bg-white/70" />
              <span>{product.views} views</span>
            </div>
          </div>

          <h3 className="text-lg md:text-xl font-bold text-white leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          <div className="flex items-center gap-2">
            <img
              src={product.author?.avatarUrl || "https://github.com/shadcn.png"}
              className="w-6 h-6 rounded-full border border-white/10"
              alt="author"
            />
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-white/90">
                {product.author?.fullName || "Admin"}
              </span>
              {(product.author?.role === 'super_admin' || product.author?.role === 'blogger') && (
                <VerifiedBadge size={12} />
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/product/${product.id}`}
      className="group flex flex-col gap-3"
    >
      {/* Image Container */}
      <div className={cn("relative w-full rounded-2xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden isolate", aspectClass)}>
        <img
          src={product.images[0]}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />

        {/* Favorite Button (Top Right) */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2.5 right-2.5 z-10 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 active:scale-90 transition-all"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isProductFavorite ? "fill-red-500 text-red-500 drop-shadow-sm" : "text-white fill-black/20"
            )}
          />
        </button>

        {/* Discount Badge (Top Left) */}
        {discount > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-lg bg-red-500/90 backdrop-blur-sm shadow-sm">
            <span className="text-[10px] font-bold text-white tracking-wide">-{discount}%</span>
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/40 active:scale-95 transition-all hover:shadow-blue-500/60 hover:scale-105"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="text-xs font-semibold">Add to Cart</span>
        </button>
      </div>

      {/* Info Section */}
      <div className="flex flex-col gap-1.5 px-0.5">
        <h3 className="text-[13px] md:text-sm font-medium leading-snug line-clamp-2 text-foreground/90 h-[2.5em] md:h-auto">
          {product.title}
        </h3>

        <div className="flex items-center gap-1.5">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium text-muted-foreground">{product.rating}</span>
          <span className="text-[10px] text-muted-foreground/60">({product.reviewCount})</span>
        </div>

        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-sm md:text-base font-bold text-foreground tracking-tight">{formatPrice(product.price)} UZS</span>
          {product.originalPrice && (
            <span className="text-[10px] md:text-xs text-muted-foreground/70 line-through decoration-zinc-400/50">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});
