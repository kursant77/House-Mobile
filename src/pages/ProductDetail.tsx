import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Star, ShoppingBag, Play, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { getProductById } from "@/data/mockProducts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useCartStore } from "@/store/cartStore";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = getProductById(id || "");
  
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { addToCart, isInCart } = useCartStore();
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <Button variant="outline" onClick={() => navigate("/products")}>
            Go to Products
          </Button>
        </div>
      </div>
    );
  }

  const isProductFavorite = isFavorite(product.id);
  const isProductInCart = isInCart(product.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`Added ${quantity} item(s) to cart`);
  };

  const handleFavorite = () => {
    toggleFavorite(product);
    toast.success(isProductFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={handleFavorite}
          className="rounded-full p-2 transition-all active:scale-95"
        >
          <Heart
            className={cn(
              "h-6 w-6 transition-colors",
              isProductFavorite ? "fill-like text-like" : "text-foreground"
            )}
          />
        </button>
      </header>

      {/* Image Gallery */}
      <div className="relative aspect-[3/4] bg-muted">
        <img
          src={product.images[currentImage]}
          alt={product.title}
          className="h-full w-full object-cover"
        />

        {/* Video badge */}
        {product.videoUrl && (
          <Link
            to="/reels"
            className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-background/80 px-3 py-2 backdrop-blur-sm transition-all active:scale-95"
          >
            <Play className="h-4 w-4 fill-foreground" />
            <span className="text-sm font-medium">Watch Video</span>
          </Link>
        )}

        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute left-4 top-16 rounded-full bg-destructive px-3 py-1">
            <span className="text-sm font-semibold text-destructive-foreground">
              -{discount}%
            </span>
          </div>
        )}

        {/* Image navigation */}
        {product.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 right-4 flex gap-1.5">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    currentImage === index
                      ? "bg-foreground w-4"
                      : "bg-foreground/40"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 py-6 space-y-6">
        {/* Title & Rating */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{product.title}</h1>
          {product.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{product.rating}</span>
              </div>
              <span className="text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <span className="text-muted-foreground">{product.currency}</span>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h2 className="font-semibold text-foreground">Description</h2>
          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <h2 className="font-semibold text-foreground">Quantity</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-semibold transition-all active:scale-95"
            >
              -
            </button>
            <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-semibold transition-all active:scale-95"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border px-4 py-3 pb-safe">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">
              {formatPrice(product.price * quantity)} {product.currency}
            </p>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="h-12 px-8 rounded-xl font-semibold gap-2"
          >
            {isProductInCart ? (
              <>
                <Check className="h-5 w-5" />
                Add More
              </>
            ) : (
              <>
                <ShoppingBag className="h-5 w-5" />
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
