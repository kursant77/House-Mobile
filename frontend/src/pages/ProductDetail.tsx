import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Heart, ShoppingBag, Play,
  ChevronLeft, ChevronRight, Check, Loader2,
  Users, Truck, Shield, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useCartStore } from "@/store/cartStore";
import { BottomNav } from "@/components/layout/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/api/products";
import { useAuthStore } from "@/store/authStore";
import { historyService } from "@/services/api/history";
import { handleError } from "@/lib/errorHandler";
import { ERROR_MESSAGES as ERROR_MSGS } from "@/lib/errorMessages";
import { useCurrency } from "@/hooks/useCurrency";
import { Helmet } from "react-helmet-async";
import { logger } from "@/lib/logger";
import { OneClickCheckout } from "@/components/checkout/OneClickCheckout";

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
        logger.warn("Failed to increment views:", error);
      });
      if (isAuthenticated) {
        const timer = setTimeout(() => {
          historyService.addToHistory("product", product.id);
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
  const [activeTab, setActiveTab] = useState<"info" | "reviews">("info");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    description: true,
    delivery: false,
    warranty: false,
  });
  const { formatPrice } = useCurrency();

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
        action: { label: "Kirish", onClick: () => navigate("/auth") },
      });
      return;
    }
    try {
      addToCart(product, quantity);
      toast.success(`${quantity} ta mahsulot savatchaga qo'shildi`);
    } catch (error: unknown) {
      const appError = handleError(error, "AddToCart");
      toast.error(appError.message);
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error(ERROR_MSGS.AUTH_REQUIRED, {
        action: { label: "Kirish", onClick: () => navigate("/auth") },
      });
      return;
    }
    if (!product.inStock) {
      toast.error("Mahsulot sotuvda yo'q");
      return;
    }
    setIsCheckoutOpen(true);
  };
  void handleBuyNow; // available for future buy-now button

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast.error("Iltimos, avval tizimga kiring");
      navigate("/auth");
      return;
    }
    toggleFavorite(product);
    toast.success(
      isProductFavorite ? "Sevimlilardan olib tashlandi" : "Sevimlilarga qo'shildi"
    );
  };

  const nextImage = () =>
    setCurrentImage((prev) => (prev + 1) % product.images.length);
  const prevImage = () =>
    setCurrentImage(
      (prev) => (prev - 1 + product.images.length) % product.images.length
    );

  return (
    <div className="min-h-screen bg-background pb-20 pt-14 md:pt-16">
      <Helmet>
        <title>
          {product?.title
            ? `${product.title} - House Mobile`
            : "Mahsulot - House Mobile"}
        </title>
        <meta
          name="description"
          content={product?.description || "House Mobile mahsuloti haqida batafsil"}
        />
      </Helmet>
      <BottomNav />

      {/* ===== Mobile Header ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl md:hidden">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={handleFavorite}
          className="rounded-full p-2 active:scale-95"
        >
          <Heart
            className={cn(
              "h-5 w-5",
              isProductFavorite ? "fill-like text-like" : "text-foreground"
            )}
          />
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4">
        {/* ===== Breadcrumb (Desktop) ===== */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground mb-4 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Orqaga
          </button>
          <span>&gt;</span>
          <Link
            to="/products"
            className="hover:text-foreground transition-colors"
          >
            Mahsulotlar
          </Link>
          <span>&gt;</span>
          <span>{product.category}</span>
          <span>&gt;</span>
          <span className="text-foreground font-medium truncate max-w-[180px]">
            {product.title}
          </span>
        </nav>

        {/* ===== MAIN GRID — stacks on mobile, side-by-side on lg ===== */}
        <div className="flex flex-col lg:flex-row lg:gap-6">
          {/* ============ LEFT: IMAGE GALLERY ============ */}
          <div className="flex-1 min-w-0">
            {/* Desktop: Thumbnails left + Main image */}
            <div className="hidden md:flex gap-3">
              {/* Vertical thumbnails */}
              {product.images.length > 1 && (
                <div className="flex flex-col gap-2 w-[70px] flex-shrink-0">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      onMouseEnter={() => setCurrentImage(index)}
                      className={cn(
                        "w-[70px] h-[70px] rounded-lg overflow-hidden border-2 transition-all",
                        currentImage === index
                          ? "border-primary ring-1 ring-primary/30"
                          : "border-border/50 opacity-60 hover:opacity-100"
                      )}
                    >
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="relative flex-1 aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 group">
                <img
                  src={product.images[currentImage]}
                  alt={product.title}
                  className="h-full w-full object-contain"
                  loading="eager"
                />
                {product.videoUrl && (
                  <Link
                    to={`/reels?productId=${product.id}`}
                    className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 text-white px-3 py-1.5 text-xs font-medium backdrop-blur-sm hover:bg-black/90 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    Video
                  </Link>
                )}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                  {currentImage + 1}/{product.images.length}
                </div>
                {discount > 0 && (
                  <div className="absolute left-3 top-3 rounded-md bg-destructive px-2 py-0.5 text-[11px] font-bold text-white">
                    -{discount}%
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: Full-width image */}
            <div className="md:hidden relative aspect-square bg-zinc-900 -mx-4">
              <img
                src={product.images[currentImage]}
                alt={product.title}
                className="h-full w-full object-contain"
              />
              {product.videoUrl && (
                <Link
                  to={`/reels?productId=${product.id}`}
                  className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 text-white px-3 py-1.5 text-xs font-medium"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Video
                </Link>
              )}
              {discount > 0 && (
                <div className="absolute left-3 top-3 rounded-md bg-destructive px-2 py-0.5 text-[11px] font-bold text-white">
                  -{discount}%
                </div>
              )}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white p-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white p-1.5"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 right-3 flex gap-1">
                    {product.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          currentImage === i
                            ? "w-4 bg-white"
                            : "w-1.5 bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Mobile thumbnails */}
            {product.images.length > 1 && (
              <div className="md:hidden flex gap-2 py-2.5 overflow-x-auto -mx-4 px-4">
                {product.images.map((image, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={cn(
                      "w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0",
                      currentImage === i
                        ? "border-primary"
                        : "border-border/30 opacity-50"
                    )}
                  >
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Tabs: Mahsulot haqida / Sharhlar — below image on desktop */}
            <div className="hidden lg:block mt-4">
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("info")}
                  className={cn(
                    "px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                    activeTab === "info"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Mahsulot haqida
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={cn(
                    "px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                    activeTab === "reviews"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Sharhlar ({product.reviewCount || 0})
                </button>
              </div>
              <div className="py-4">
                {activeTab === "info" ? (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sharhlar hozircha mavjud emas.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ============ RIGHT: PRODUCT INFO CARD ============ */}
          <div className="lg:w-[320px] xl:w-[350px] flex-shrink-0 mt-4 lg:mt-0 space-y-3">
            {/* Seller card */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() =>
                navigate(
                  `/profile/${product.author?.id || product.sellerId}`
                )
              }
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-bold text-white overflow-hidden flex-shrink-0">
                {product.author?.avatarUrl ? (
                  <img
                    src={product.author.avatarUrl}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  product.author?.fullName?.charAt(0) || "H"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">
                  {product.author?.fullName || "House Mobile"}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Rasmiy do'kon
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>

            {/* ====== PRICE CARD ====== */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              {/* "Foydali taklif" header */}
              <div className="px-4 py-2.5 border-b border-border">
                <span className="font-bold text-sm">Foydali taklif</span>
              </div>

              <div className="p-4 space-y-4">
                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">
                    {formatPrice(product.price, product.currency || "UZS")}
                  </span>
                </div>
                {product.originalPrice && (
                  <p className="text-xs text-muted-foreground -mt-2 line-through">
                    {formatPrice(product.originalPrice, product.currency || "UZS")}
                  </p>
                )}

                {/* Quantity row */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Miqdor</span>
                  <div className="flex items-center gap-0">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-8 w-8 rounded-l-lg border border-border bg-muted flex items-center justify-center text-sm font-bold hover:bg-accent active:scale-95"
                    >
                      −
                    </button>
                    <div className="h-8 w-10 border-y border-border flex items-center justify-center text-sm font-bold bg-background">
                      {quantity}
                    </div>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-8 w-8 rounded-r-lg border border-border bg-muted flex items-center justify-center text-sm font-bold hover:bg-accent active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Green Add to Cart button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="w-full h-11 rounded-xl font-bold text-sm gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {isProductInCart
                    ? "Yana qo'shish"
                    : product.inStock
                      ? "Savatga qo'shish"
                      : "Sotuvda yo'q"}
                </Button>

                {/* Stock info */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {product.inStock
                        ? `${quantity} dona xarid qilish mumkin`
                        : "Hozirda sotuvda yo'q"}
                    </span>
                  </div>
                  {product.views && product.views > 10 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Bu haftada {Math.min(product.views, 999)} kishi sotib
                        oldi
                      </span>
                    </div>
                  )}
                </div>

                {/* Delivery & Safety badges */}
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground flex-1">
                    <Truck className="h-3.5 w-3.5 flex-shrink-0" />
                    Yetkazib berish
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground flex-1">
                    <Heart className="h-3.5 w-3.5 flex-shrink-0" />
                    Xavsita to'lov
                  </div>
                </div>
              </div>

              {/* Collapsible sections */}
              <div className="border-t border-border">
                {/* Mahsulot haqida */}
                <button
                  onClick={() => toggleSection("description")}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <span className="font-bold text-sm">Mahsulot haqida</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      expandedSections.description && "rotate-180"
                    )}
                  />
                </button>
                {expandedSections.description && (
                  <div className="px-4 pb-3 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    {product.description}
                  </div>
                )}

                {/* Yetkazib berish */}
                <button
                  onClick={() => toggleSection("delivery")}
                  className="flex items-center justify-between w-full px-4 py-3 border-t border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Yetkazib berish</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      expandedSections.delivery && "rotate-90"
                    )}
                  />
                </button>
                {expandedSections.delivery && (
                  <div className="px-4 pb-3 text-xs text-muted-foreground leading-relaxed">
                    Buyurtma berilgan kunning ertasiga yetkazib beramiz.
                    Toshkent shahri bo'ylab yetkazib berish bepul.
                  </div>
                )}

                {/* Kafolat */}
                <button
                  onClick={() => toggleSection("warranty")}
                  className="flex items-center justify-between w-full px-4 py-3 border-t border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Kafolat</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      expandedSections.warranty && "rotate-90"
                    )}
                  />
                </button>
                {expandedSections.warranty && (
                  <div className="px-4 pb-3 text-xs text-muted-foreground leading-relaxed">
                    Barcha mahsulotlarga 30 kunlik qaytarish kafolati beriladi.
                    Sifat muammolari bo'lsa, bepul almashtirish amalga oshiriladi.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Tabs section */}
        <div className="lg:hidden mt-4">
          <div className="flex border-b border-border -mx-4 px-4">
            <button
              onClick={() => setActiveTab("info")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === "info"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
            >
              Mahsulot haqida
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === "reviews"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
            >
              Sharhlar ({product.reviewCount || 0})
            </button>
          </div>
          <div className="py-4">
            {activeTab === "info" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
                {product.videoUrl && (
                  <Link
                    to={`/reels?productId=${product.id}`}
                    className="block relative aspect-video rounded-xl overflow-hidden bg-zinc-900"
                  >
                    <img
                      src={product.images[0]}
                      alt="Video thumbnail"
                      className="h-full w-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="h-5 w-5 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sharhlar hozircha mavjud emas.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===== Mobile Fixed Bottom Bar ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border px-4 py-2.5 z-40 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground">Jami</p>
            <p className="text-base font-bold truncate">
              {formatPrice(product.price * quantity, product.currency || "UZS")}
            </p>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="h-10 px-5 rounded-xl font-semibold text-sm gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isProductInCart ? (
              <>
                <Check className="h-4 w-4" />
                Qo'shildi
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                Savatga
              </>
            )}
          </Button>
        </div>
      </div>

      {/* OneClickCheckout */}
      {product && (
        <OneClickCheckout
          open={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          product={{
            id: product.id,
            title: product.title,
            price: product.price,
            currency: product.currency || "UZS",
          }}
          quantity={quantity}
        />
      )}
    </div>
  );
}
