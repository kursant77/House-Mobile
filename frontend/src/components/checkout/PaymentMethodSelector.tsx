import { CreditCard, Wallet, Banknote, Check, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethodType } from "@/services/api/payments";

interface PaymentMethodOption {
  id: PaymentMethodType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: "cash",
    name: "Naqd pul",
    description: "Yetkazib berilganda to'lash",
    icon: Banknote,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  {
    id: "click",
    name: "Click",
    description: "Click orqali onlayn to'lash",
    icon: Wallet,
    color: "text-blue-600 bg-blue-500/10",
  },
  {
    id: "payme",
    name: "Payme",
    description: "Payme orqali onlayn to'lash",
    icon: CreditCard,
    color: "text-cyan-600 bg-cyan-500/10",
  },
  {
    id: "uzum",
    name: "Uzum Bank",
    description: "Uzum Bank kartasi orqali",
    icon: Building2,
    color: "text-purple-600 bg-purple-500/10",
  },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethodType;
  onChange: (value: PaymentMethodType) => void;
  className?: string;
  compact?: boolean;
}

export function PaymentMethodSelector({
  value,
  onChange,
  className,
  compact = false,
}: PaymentMethodSelectorProps) {
  return (
    <div className={cn(compact ? "grid grid-cols-2 gap-3" : "space-y-3", className)}>
      {paymentMethods.map((method) => {
        const Icon = method.icon;
        const isSelected = value === method.id;

        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onChange(method.id)}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl border-2 transition-all text-left",
              compact ? "p-3" : "p-4 gap-4",
              isSelected
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-muted/30 hover:border-muted-foreground/30 hover:bg-muted/50",
            )}
          >
            <div
              className={cn(
                "rounded-lg flex items-center justify-center shrink-0",
                compact ? "h-9 w-9" : "h-10 w-10",
                isSelected ? "bg-primary text-primary-foreground" : method.color.split(' ')[1],
              )}
            >
              <Icon className={cn(
                compact ? "h-4 w-4" : "h-5 w-5",
                isSelected ? "text-primary-foreground" : method.color.split(' ')[0]
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("font-bold", compact ? "text-sm" : "text-base")}>{method.name}</p>
              {!compact && (
                <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
              )}
            </div>
            {isSelected && (
              <div className={cn(
                "rounded-full bg-primary flex items-center justify-center shrink-0",
                compact ? "h-5 w-5" : "h-6 w-6"
              )}>
                <Check className={cn(compact ? "h-3 w-3" : "h-4 w-4", "text-primary-foreground")} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
