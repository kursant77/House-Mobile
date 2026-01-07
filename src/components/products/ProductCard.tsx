import { memo } from "react";
import { Product } from "@/types/product";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "wide";
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

  const aspectClass = variant === "wide" ? "aspect-video" : "aspect-[4/5]";

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
