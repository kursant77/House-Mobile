import { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useCartStore, CartItem } from "@/store/cartStore";
import { ShoppingBag, Trash2, Minus, Plus, ArrowRight, Package, Truck, Shield, CreditCard, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn, formatPriceNumber } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function CartItemCard({ item }: { item: CartItem }) {
  const { removeFromCart, incrementQuantity, decrementQuantity } = useCartStore();
  const { formatPrice } = useCurrency();
  const itemTotal = item.product.price * item.quantity;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="flex gap-4 p-4 md:p-5">
        {/* Image */}
        <Link to={`/product/${item.product.id}`} className="shrink-0 relative group">
          <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <img
              src={item.product.images[0]}
              alt={item.product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          {item.product.inStock ? (
            <Badge className="absolute top-1 right-1 bg-green-500 hover:bg-green-600 text-white text-[10px] px-1.5 py-0.5">
              Omborda
            </Badge>
          ) : (
            <Badge variant="destructive" className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5">
              Tugagan
            </Badge>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <Link to={`/product/${item.product.id}`}>
              <h3 className="font-semibold text-sm md:text-base text-foreground line-clamp-2 hover:text-primary transition-colors mb-1">
                {item.product.title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-base md:text-lg font-bold text-primary">
                {formatPrice(item.product.price, item.product.currency || "UZS")}
              </p>
              {item.quantity > 1 && (
                <span className="text-xs text-muted-foreground">
                  ({formatPrice(item.product.price, item.product.currency || "UZS")} x {item.quantity})
                </span>
              )}
            </div>
          </div>

          {/* Quantity controls and Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => decrementQuantity(item.product.id)}
                disabled={item.quantity <= 1}
                className={cn(
                  "h-7 w-7 md:h-8 md:w-8 rounded-md flex items-center justify-center transition-all",
                  item.quantity <= 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-white dark:hover:bg-zinc-700 active:scale-95"
                )}
              >
                <Minus className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </button>
              <span className="w-8 md:w-10 text-center font-semibold text-sm md:text-base">{item.quantity}</span>
              <button
                onClick={() => incrementQuantity(item.product.id)}
                className="h-7 w-7 md:h-8 md:w-8 rounded-md flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 transition-all active:scale-95"
              >
                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Jami</p>
                <p className="text-base md:text-lg font-bold text-foreground">
                  {formatPrice(itemTotal, item.product.currency || "UZS")}
                </p>
              </div>
              <button
                onClick={() => removeFromCart(item.product.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                aria-label="O'chirish"
              >
                <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>

          {/* Mobile Total */}
          <div className="flex justify-between items-center mt-2 sm:hidden pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Jami:</span>
            <span className="text-base font-bold text-foreground">
              {formatPrice(itemTotal, item.product.currency || "UZS")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const { items, getTotal, getItemCount, clearCart } = useCartStore();
  const [showCheckout, setShowCheckout] = useState(false);
  const isMobile = useIsMobile();
  const { formatPrice } = useCurrency();

  const itemCount = getItemCount();
  const total = getTotal();

  if (showCheckout) {
    return <CheckoutForm onBack={() => setShowCheckout(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 pb-36 md:pb-0 md:pt-16">
      <BottomNav />

      {/* Header */}
      <header className={cn(
        "sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800",
        isMobile ? "px-4 py-3" : "px-6 py-4"
      )}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className={cn(
              "font-bold tracking-tight text-foreground",
              isMobile ? "text-xl" : "text-3xl"
            )}>
              Savatcha
            </h1>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-xs mt-0.5" : "text-sm mt-1"
            )}>
              {itemCount} {itemCount === 1 ? "mahsulot" : "mahsulot"}
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Haqiqatan ham barcha mahsulotlarni o'chirmoqchimisiz?")) {
                  clearCart();
                }
              }}
              className={cn(
                "text-muted-foreground hover:text-destructive transition-colors",
                isMobile ? "text-xs px-2 py-1" : "text-sm px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
              )}
            >
              <span className="hidden sm:inline">Tozalash</span>
              <X className="h-4 w-4 sm:hidden" />
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className={cn(
        "max-w-7xl mx-auto",
        isMobile ? "px-4 py-4" : "px-6 py-8"
      )}>
        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-12 space-y-4">
              {/* Benefits Banner */}
              <div className="hidden md:grid grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Tezkor yetkazib berish</p>
                    <p className="text-[10px] text-muted-foreground">1-2 kun ichida</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Shield className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Xavfsiz to'lov</p>
                    <p className="text-[10px] text-muted-foreground">100% himoyalangan</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Qaytarib berish</p>
                    <p className="text-[10px] text-muted-foreground">14 kun ichida</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItemCard key={item.product.id} item={item} />
                ))}
              </div>

              {/* Actions */}
              <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800 mt-4">
                <Link to="/products" className="w-full md:w-auto order-2 md:order-1">
                  <Button variant="ghost" className="w-full md:w-auto gap-2 text-muted-foreground hover:text-foreground">
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Xaridni davom ettirish
                  </Button>
                </Link>
                {!isMobile && (
                  <Button
                    onClick={() => setShowCheckout(true)}
                    className="w-full md:w-auto gap-2 px-10 h-14 rounded-2xl text-lg font-black order-1 md:order-2 shadow-xl hover:shadow-2xl transition-all bg-primary hover:scale-[1.02] active:scale-95"
                  >
                    Buyurtma berish — {formatPrice(total, items[0]?.product.currency || "UZS")}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/10 p-8 rounded-full">
                <ShoppingBag className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Savatchangiz bo'sh</h2>
            <p className="text-muted-foreground mb-8">
              Xarid qilishni boshlash uchun mahsulotlarni qo'shing
            </p>
            <Link to="/products">
              <Button size="lg" className="rounded-xl gap-2 px-8">
                Mahsulotlarni ko'rish
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Bar */}
      {items.length > 0 && isMobile && (
        <div className="fixed bottom-16 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 px-4 py-4 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Jami</p>
              <p className="text-xl font-bold text-primary">
                {formatPrice(total, items[0]?.product.currency || "UZS")}
              </p>
            </div>
            <Button
              onClick={() => setShowCheckout(true)}
              className="flex-1 h-12 rounded-xl font-semibold gap-2 shadow-lg"
              size="lg"
            >
              Buyurtma berish
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3 text-green-500" />
              <span>Bepul yetkazib berish</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
