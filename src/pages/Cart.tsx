import { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useCartStore, CartItem } from "@/store/cartStore";
import { ShoppingBag, Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { useIsMobile } from "@/hooks/use-mobile";

function CartItemCard({ item }: { item: CartItem }) {
  const { removeFromCart, incrementQuantity, decrementQuantity } = useCartStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price);
  };

  return (
    <div className="flex gap-3 p-3 bg-card rounded-2xl border border-border animate-fade-in">
      {/* Image */}
      <Link to={`/product/${item.product.id}`} className="shrink-0">
        <img
          src={item.product.images[0]}
          alt={item.product.title}
          className="h-24 w-24 rounded-xl object-cover"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link to={`/product/${item.product.id}`}>
          <h3 className="font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
            {item.product.title}
          </h3>
        </Link>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {formatPrice(item.product.price)} {item.product.currency}
        </p>

        {/* Quantity controls */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => decrementQuantity(item.product.id)}
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center transition-all active:scale-95"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-semibold">{item.quantity}</span>
            <button
              onClick={() => incrementQuantity(item.product.id)}
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => removeFromCart(item.product.id)}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const { items, getTotal, getItemCount, clearCart } = useCartStore();
  const [showCheckout, setShowCheckout] = useState(false);
  const isMobile = useIsMobile();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price);
  };

  const itemCount = getItemCount();
  const total = getTotal();

  if (showCheckout) {
    return <CheckoutForm onBack={() => setShowCheckout(false)} />;
  }

  return (
    <div className="min-h-screen bg-background pb-36 md:pb-0 md:pt-16">
      <BottomNav />
      {/* Header - faqat mobile uchun */}
      {isMobile && (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cart</h1>
            <p className="text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </header>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
              <p className="text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors px-4 py-2 rounded-lg hover:bg-accent"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="px-4 py-4 md:container md:mx-auto md:max-w-6xl">
        {items.length > 0 ? (
          <div className="space-y-3 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
            <div className="md:col-span-2 space-y-3">
              {items.map((item) => (
                <CartItemCard key={item.product.id} item={item} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">Your cart is empty</h2>
            <p className="mb-6 text-muted-foreground max-w-xs">
              Add products to your cart to see them here
            </p>
            <Link to="/products">
              <Button className="rounded-xl">Browse Products</Button>
            </Link>
          </div>
        )}
      </main>

      {/* Desktop Order Summary */}
      {items.length > 0 && !isMobile && (
        <div className="container mx-auto px-4 max-w-6xl mt-8">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(total)} UZS</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between font-semibold text-xl pt-3 border-t border-border">
                <span>Total</span>
                <span>{formatPrice(total)} UZS</span>
              </div>
            </div>
            <Button
              onClick={() => setShowCheckout(true)}
              className="w-full h-12 rounded-xl font-semibold gap-2"
            >
              Checkout
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Bar */}
      {items.length > 0 && isMobile && (
        <div className="fixed bottom-16 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border px-4 py-4 pb-safe z-40">
          {/* Order summary */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(total)} UZS</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span>{formatPrice(total)} UZS</span>
            </div>
          </div>

          <Button
            onClick={() => setShowCheckout(true)}
            className="w-full h-12 rounded-xl font-semibold gap-2"
          >
            Checkout
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
