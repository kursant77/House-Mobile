import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

function formatPrice(amount: number, currency: string = "UZS"): string {
  return `${amount.toLocaleString("uz-UZ")} ${currency}`;
}

export function PriceDisplay({
  price,
  originalPrice,
  currency = "UZS",
  size = "md",
  className,
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercentage = hasDiscount
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-bold text-foreground",
          sizeClasses[size]
        )}
      >
        {formatPrice(price, currency)}
      </span>
      
      {hasDiscount && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(originalPrice, currency)}
          </span>
          <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
            -{discountPercentage}%
          </span>
        </>
      )}
    </div>
  );
}
