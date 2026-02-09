import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Star, ShoppingBag, Play, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useCartStore } from "@/store/cartStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomNav } from "@/components/layout/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/api/products";
import { useAuthStore } from "@/store/authStore";
import { historyService } from "@/services/api/history";
import { handleError } from "@/lib/errorHandler";
import { ERROR_MESSAGES as ERROR_MSGS } from "@/lib/errorMessages";
import { formatPriceNumber, formatCurrencySymbol } from "@/lib/utils";
import { Helmet } from "react-helmet-async";
import { logger } from "@/lib/logger";
import { OneClickCheckout } from "@/components/checkout/OneClickCheckout";
import { Zap } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id || ""),
    enabled: !!id,
  });

  useEffect(() => {
    if (product?.id) {
      productService.incrementViews(product.id).catch((error) => {
        // Silently ignore view increment errors
        logger.warn('Failed to increment views:', error);
      });

      // Track view history after 3 seconds of viewing
      if (isAuthenticated) {
        const timer = setTimeout(() => {
          historyService.addToHistory('product', product.id);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [product?.id, isAuthenticated]);

  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { addToCart, isInCart } = useCartStore();
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Mahsulot topilmadi</p>
          <Button variant="outline" onClick={() => navigate("/products")}>
            Mahsulotlarga qaytish
          </Button>
        </div>
      </div>
    );
  }

  const isProductFavorite = isFavorite(product.id);
  const isProductInCart = isInCart(product.id);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error(ERROR_MSGS.AUTH_REQUIRED, {
        action: {
          label: 'Kirish',
          onClick: () => navigate("/auth")
        }
      });
      return;
    }
    try {
      addToCart(product, quantity);
      toast.success(`${quantity} ta mahsulot savatchaga qo'shildi`);
    } catch (error: unknown) {
      const appError = handleError(error, 'AddToCart');
      toast.error(appError.message);
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error(ERROR_MSGS.AUTH_REQUIRED, {
        action: {
          label: 'Kirish',
          onClick: () => navigate("/auth")
        }
      });
      return;
    }

    // Always check stock before opening
    if (!product.inStock) {
      toast.error("Mahsulot sotuvda yo'q");
      return;
    }

    setIsCheckoutOpen(true);
  };


  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast.error("Iltimos, avval tizimga kiring");
      navigate("/auth");
      return;
    }
    toggleFavorite(product);
    toggleFavorite(product);
    toast.success(isProductFavorite ? "Sevimlilardan olib tashlandi" : "Sevimlilarga qo'shildi");
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 md:pt-16">
      <Helmet>
        <title>{product?.title ? `${product.title} - House Mobile` : "Mahsulot - House Mobile"}</title>
        <meta name="description" content={product?.description || "House Mobile mahsuloti haqida batafsil"} />
      </Helmet>
      <BottomNav />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl md:hidden">
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

      {/* Desktop Layout */}
      {!isMobile ? (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Orqaga</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden">
                <img
                  src={product.images[currentImage]}
                  alt={`${product.title} - ${currentImage + 1}`}
                  className="h-full w-full object-cover"
                  loading={currentImage === 0 ? "eager" : "lazy"}
                  decoding="async"
                />

                {/* Discount badge */}
                {discount > 0 && (
                  <div className="absolute left-4 top-4 rounded-full bg-destructive px-3 py-1">
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
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm hover:bg-background transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm hover:bg-background transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail images */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={cn(
                        "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                        currentImage === index
                          ? "border-primary"
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img
                        src={image}
                        alt={`${product.title} - ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-3">{product.title}</h1>

                  {/* Seller Info */}
                  <div
                    className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/profile/${product.author?.id || product.sellerId}`)}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                      {product.author?.avatarUrl ? (
                        <img src={product.author.avatarUrl} className="h-full w-full object-cover" />
                      ) : (
                        product.author?.fullName?.charAt(0) || "H"
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{product.author?.fullName || "House Mobile"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rasmiy do'kon</p>
                    </div>
                  </div>

                  {!!product.rating && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-lg">{product.rating}</span>
                      </div>
                      <span className="text-muted-foreground">
                        ({product.reviewCount} sharhlar)
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleFavorite}
                  className="rounded-full p-3 hover:bg-accent transition-all"
                >
                  <Heart
                    className={cn(
                      "h-6 w-6 transition-colors",
                      isProductFavorite ? "fill-like text-like" : "text-foreground"
                    )}
                  />
                </button>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold">
                  {formatPriceNumber(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPriceNumber(product.originalPrice)}
                  </span>
                )}
                <span className="text-muted-foreground">{product.currency}</span>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Ta'rif</h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {product.description}
                </p>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Miqdor</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xl font-semibold transition-all hover:bg-accent active:scale-95"
                  >
                    -
                  </button>
                  <span className="text-2xl font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xl font-semibold transition-all hover:bg-accent active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleBuyNow}
                  disabled={!product.inStock}
                  variant="secondary"
                  className="h-14 text-lg rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20 gap-2"
                >
                  <Zap className="h-5 w-5" />
                  Hozir olish
                </Button>
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="h-14 text-lg rounded-xl font-semibold gap-2"
                  size="lg"
                >
                  {isProductInCart ? (
                    <>
                      <Check className="h-6 w-6" />
                      Yana qo'shish
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-6 w-6" />
                      {product.inStock ? "Savatchaga" : "Sotuvda yo'q"}
                    </>
                  )}
                </Button>
              </div>

              {/* Video link */}
              {product.videoUrl && (
                <Link
                  to={`/reels?productId=${product.id}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition-colors"
                >
                  <Play className="h-5 w-5 fill-foreground" />
                  <span className="font-medium">Videoni ko'rish</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Image Gallery */}
          <div className="relative aspect-[3/4] bg-muted">
            <img
              src={product.images[currentImage]}
              alt={product.title}
              className="h-full w-full object-cover"
            />

            {/* Video badge */}
            {product.videoUrl && (
              <Link
                to={`/reels?productId=${product.id}`}
                className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-background/80 px-3 py-2 backdrop-blur-sm transition-all active:scale-95"
              >
                <Play className="h-4 w-4 fill-foreground" />
                <span className="text-sm font-medium">Videoni ko'rish</span>
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
              <div
                className="flex items-center gap-2 mb-4"
                onClick={() => navigate(`/profile/${product.author?.id || product.sellerId}`)}
              >
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                  {product.author?.avatarUrl ? (
                    <img src={product.author.avatarUrl} className="h-full w-full object-cover" />
                  ) : (
                    product.author?.fullName?.charAt(0) || "H"
                  )}
                </div>
                <span className="text-xs font-semibold">{product.author?.fullName || "House Mobile"}</span>
              </div>
              {!!product.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{product.rating}</span>
                  </div>
                  <span className="text-muted-foreground">
                    ({product.reviewCount} sharhlar)
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">
                {formatPriceNumber(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPriceNumber(product.originalPrice)}
                </span>
              )}
              <span className="text-muted-foreground">{product.currency}</span>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h2 className="font-semibold text-foreground">Ta'rif</h2>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <h2 className="font-semibold text-foreground">Miqdor</h2>
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

          {/* Mobile Fixed Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border px-4 py-3 pb-safe z-40">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Jami</p>
                <p className="text-xl font-bold">
                  {formatPriceNumber(product.price * quantity)} {formatCurrencySymbol(product.currency || "UZS")}
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
                    Yana qo'shish
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5" />
                    {product.inStock ? "Savatchaga qo'shish" : "Sotuvda yo'q"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Actions for Mobile */}
          <div className="grid grid-cols-[1fr,1.2fr] gap-3 mt-3">
            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              variant="outline"
              className="h-12 rounded-xl font-bold border-2 border-primary/20 text-primary hover:bg-primary/5"
            >
              {isProductInCart ? (
                <Check className="h-5 w-5 mr-1" />
              ) : (
                <ShoppingBag className="h-5 w-5 mr-1" />
              )}
              {isProductInCart ? "Qo'shildi" : "Savatchaga"}
            </Button>
            <Button
              onClick={handleBuyNow}
              disabled={!product.inStock}
              className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              <Zap className="h-5 w-5 mr-2 fill-current" />
              Hozir olish
            </Button>
          </div>
        </>
      )
      }

      {
        product && (
          <OneClickCheckout
            open={isCheckoutOpen}
            onOpenChange={setIsCheckoutOpen}
            product={{
              id: product.id,
              title: product.title,
              price: product.price,
              currency: product.currency || "UZS"
            }}
            quantity={quantity}
          />
        )
      }
    </div >
  );
}
