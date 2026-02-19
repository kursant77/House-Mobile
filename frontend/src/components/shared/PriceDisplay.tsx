import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  /** Currency the price was stored in (e.g. "UZS", "USD") */
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Show diff indicator (tiny green/red arrow next to rate) */
  showBadge?: boolean;
}

export function PriceDisplay({
  price,
  originalPrice,
  currency = "UZS",
  size = "md",
  className,
  showBadge = false,
}: PriceDisplayProps) {
  const { formatPrice, selectedCurrency, isFetchingRates } = useCurrency();

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl font-black",
  };

  const formattedPrice = formatPrice(price, currency);
  const formattedOriginal = originalPrice ? formatPrice(originalPrice, currency) : null;

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPct = hasDiscount
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;

  // Show currency conversion badge if viewing in non-original currency
  const showConversionHint = showBadge && selectedCurrency !== currency && !isFetchingRates;

  return (
    <div className={cn("flex flex-wrap items-baseline gap-1.5", className)}>
      <span className={cn("font-bold text-foreground", sizeClasses[size])}>
        {formattedPrice}
      </span>

      {formattedOriginal && hasDiscount && (
        <>
          <span className="text-xs text-muted-foreground/70 line-through">
            {formattedOriginal}
          </span>
          <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-md">
            -{discountPct}%
          </span>
        </>
      )}

      {showConversionHint && (
        <span className="text-[10px] text-muted-foreground/60 italic ml-0.5">
          ≈ ({selectedCurrency})
        </span>
      )}
    </div>
  );
}
