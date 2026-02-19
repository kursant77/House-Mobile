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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrency } from "@/hooks/useCurrency";

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
  const { formatPrice } = useCurrency();


  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    e.stopPropagation();
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
      <div
        onClick={() => navigate(`/product/${product.id}`)}
        className="group flex flex-col gap-3 cursor-pointer"
      >
        {/* Media Thumbnail Container */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-border/50">
          <img
            src={product.images[0]}
            alt={`${product.title} - ${product.description || 'Mahsulot rasmi'}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Play Icon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-black ml-0.5"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
          </div>

          {/* Time / Category Badge */}
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white uppercase tracking-wider">
            {product.category || "Review"}
          </div>
        </div>

        {/* Content Section Below */}
        <div className="flex gap-3 px-1">
          {/* Author Avatar */}
          <Link
            to={`/profile/${product.author?.id}`}
            onClick={(e) => e.stopPropagation()}
            className="z-10"
          >
            <Avatar size="md">
              <AvatarImage src={product.author?.avatarUrl} />
              <AvatarFallback>
                {product.author?.fullName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Metadata */}
          <div className="flex flex-col flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-bold text-foreground leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {product.title}
            </h3>

            <div className="flex flex-col">
              <Link
                to={`/profile/${product.author?.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center flex-nowrap gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors z-10 w-fit"
              >
                <span>{product.author?.fullName || "House Mobile"}</span>
                {(product.author?.role === 'super_admin' || product.author?.role === 'admin' || product.author?.role === 'blogger' || product.author?.role === 'seller') && (
                  <VerifiedBadge size={12} />
                )}
              </Link>

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span>{product.views || 0} views</span>
                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                <span>Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="group flex flex-col gap-3 cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`${product.title} mahsulotini ko'rish`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/product/${product.id}`);
        }
      }}
    >
      {/* Image Container */}
      <div className={cn("relative w-full rounded-2xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden isolate", aspectClass)}>
        <img
          src={product.images[0]}
          alt={`${product.title} - ${product.description || 'Mahsulot rasmi'}`}
          className="h-full w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />

        {/* Favorite Button (Top Right) */}
        <button
          aria-label={isProductFavorite ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}
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
          aria-label="Savatchaga qo'shish"
          className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/40 active:scale-95 transition-all hover:shadow-blue-500/60 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

        {!!product.rating && (
          <div className="flex items-center gap-1.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-muted-foreground">{product.rating}</span>
            <span className="text-[10px] text-muted-foreground/60">({product.reviewCount})</span>
          </div>
        )}

        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-sm md:text-base font-bold text-foreground tracking-tight">
            {formatPrice(product.price, product.currency || "UZS")}
          </span>
          {product.originalPrice && (
            <span className="text-[10px] md:text-xs text-muted-foreground/70 line-through decoration-zinc-400/50">
              {formatPrice(product.originalPrice, product.currency || "UZS")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
