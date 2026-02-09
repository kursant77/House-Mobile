import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const sizeClasses = {
    sm: {
      button: "h-7 w-7",
      icon: "h-3 w-3",
      text: "text-sm w-8",
    },
    md: {
      button: "h-8 w-8",
      icon: "h-4 w-4",
      text: "text-base w-10",
    },
    lg: {
      button: "h-10 w-10",
      icon: "h-5 w-5",
      text: "text-lg w-12",
    },
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg bg-muted p-1",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDecrease}
        disabled={value <= min}
        className={cn(
          "rounded-md hover:bg-background",
          sizeClasses[size].button
        )}
      >
        <Minus className={sizeClasses[size].icon} />
      </Button>
      <span
        className={cn(
          "font-medium text-center tabular-nums",
          sizeClasses[size].text
        )}
      >
        {value}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleIncrease}
        disabled={value >= max}
        className={cn(
          "rounded-md hover:bg-background",
          sizeClasses[size].button
        )}
      >
        <Plus className={sizeClasses[size].icon} />
      </Button>
    </div>
  );
}
