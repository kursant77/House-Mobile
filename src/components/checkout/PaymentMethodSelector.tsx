import { CreditCard, Wallet, Banknote, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentMethod = "cash" | "click" | "payme" | "uzum";

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: "cash",
    name: "Naqd pul",
    description: "Yetkazib berilganda to'lash",
    icon: Banknote,
    available: true,
  },
  {
    id: "click",
    name: "Click",
    description: "Click orqali to'lash",
    icon: Wallet,
    available: true,
  },
  {
    id: "payme",
    name: "Payme",
    description: "Payme orqali to'lash",
    icon: CreditCard,
    available: true,
  },
  {
    id: "uzum",
    name: "Uzum Bank",
    description: "Uzum Bank kartasi orqali",
    icon: CreditCard,
    available: true,
  },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  className?: string;
}

export function PaymentMethodSelector({
  value,
  onChange,
  className,
}: PaymentMethodSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {paymentMethods.map((method) => {
        const Icon = method.icon;
        const isSelected = value === method.id;

        return (
          <button
            key={method.id}
            type="button"
            disabled={!method.available}
            onClick={() => onChange(method.id)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/50 hover:border-muted-foreground/50",
              !method.available && "opacity-50 cursor-not-allowed"
            )}
          >
            <div
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{method.name}</p>
              <p className="text-sm text-muted-foreground">{method.description}</p>
            </div>
            {isSelected && (
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
