import { Package, Truck, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { CartItem } from "@/store/cartStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  deliveryFee?: number;
  discount?: number;
  discountCode?: string;
  onApplyDiscount?: (code: string) => Promise<boolean>;
  currency?: string;
  className?: string;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString("uz-UZ");
}

export function OrderSummary({
  items,
  subtotal,
  deliveryFee = 0,
  discount = 0,
  discountCode,
  onApplyDiscount,
  currency = "UZS",
  className,
}: OrderSummaryProps) {
  const [showItems, setShowItems] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [promoError, setPromoError] = useState("");

  const total = subtotal + deliveryFee - discount;

  const handleApplyPromo = async () => {
    if (!onApplyDiscount || !promoCode.trim()) return;

    setIsApplying(true);
    setPromoError("");

    try {
      const success = await onApplyDiscount(promoCode.trim());
      if (!success) {
        setPromoError("Noto'g'ri promo kod");
      }
    } catch {
      setPromoError("Promo kodni tekshirishda xatolik");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Buyurtma xulosasi
        </h3>
        <button
          type="button"
          onClick={() => setShowItems(!showItems)}
          className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground"
        >
          {items.length} ta mahsulot
          {showItems ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Items list (collapsible) */}
      {showItems && (
        <div className="space-y-3 pb-3 border-b border-border">
          {items.map((item) => (
            <div key={item.product.id} className="flex gap-3">
              <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
                {item.product.images?.[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(item.product.price)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium">
                {formatPrice(item.product.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Price breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Mahsulotlar</span>
          <span>{formatPrice(subtotal)} {currency}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            <Truck className="h-3.5 w-3.5" />
            Yetkazib berish
          </span>
          <span>
            {deliveryFee === 0 ? (
              <span className="text-green-600 font-medium">Bepul</span>
            ) : (
              `${formatPrice(deliveryFee)} ${currency}`
            )}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              Chegirma {discountCode && `(${discountCode})`}
            </span>
            <span>-{formatPrice(discount)} {currency}</span>
          </div>
        )}
      </div>

      {/* Promo code input */}
      {onApplyDiscount && !discountCode && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Promo kod"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setPromoError("");
              }}
              className="h-10 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyPromo}
              disabled={isApplying || !promoCode.trim()}
              className="h-10 px-4"
            >
              {isApplying ? "..." : "Qo'llash"}
            </Button>
          </div>
          {promoError && (
            <p className="text-xs text-destructive">{promoError}</p>
          )}
        </div>
      )}

      {/* Total */}
      <div className="pt-3 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Jami</span>
          <span className="text-lg font-bold">
            {formatPrice(total)} {currency}
          </span>
        </div>
      </div>
    </div>
  );
}
