import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore } from "@/store/cartStore";
import { cn, formatPriceNumber, formatCurrencySymbol } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";

interface CheckoutFormProps {
  onBack: () => void;
}

export function CheckoutForm({ onBack }: CheckoutFormProps) {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  const onSubmit = async (formData: CheckoutInput) => {
    setIsLoading(true);

    try {
      const { orderService } = await import("@/services/api/orders");

      const orderData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        customerAddress: formData.address,
        notes: formData.notes || undefined,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          currency: item.product.currency,
        })),
        totalAmount: getTotal(),
        currency: items[0]?.product.currency || "UZS",
      };

      const order = await orderService.createOrder(orderData);

      toast.success(`Buyurtma qabul qilindi! Buyurtma raqami: ${order.orderNumber}`);
      setOrderPlaced(true);
      clearCart();
    } catch (error) {
      const { handleError } = await import("@/lib/errorHandler");
      const appError = handleError(error, "CheckoutForm");
      toast.error(appError.message || "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center animate-scale-in">
          <div className="mb-6 mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Buyurtma qabul qilindi!</h1>
          <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
            Buyurtmangiz uchun rahmat. Tez orada siz bilan bog'lanamiz.
          </p>
          <Button onClick={() => navigate("/")} className="rounded-xl">
            Xaridni davom ettirish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={onBack}
            className="text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Rasmiylashtirish</h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Contact Info */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Aloqa ma'lumotlari</h2>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">To'liq ism</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Ismingizni kiriting"
                  {...register("name")}
                  className={cn(
                    "h-12 pl-10 rounded-xl bg-muted border-0",
                    errors.name && "ring-2 ring-destructive"
                  )}
                />
              </div>
              {errors.name?.message && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon raqam</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  {...register("phone")}
                  className={cn(
                    "h-12 pl-10 rounded-xl bg-muted border-0",
                    errors.phone && "ring-2 ring-destructive"
                  )}
                />
              </div>
              {errors.phone?.message && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </section>

          {/* Delivery Address */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Yetkazib berish manzili</h2>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Manzil</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Textarea
                  id="address"
                  placeholder="Shahar, ko'cha, uy raqami, xonadon"
                  {...register("address")}
                  className={cn(
                    "min-h-[100px] pl-10 rounded-xl bg-muted border-0 resize-none",
                    errors.address && "ring-2 ring-destructive"
                  )}
                />
              </div>
              {errors.address?.message && (
                <p className="text-xs text-destructive">{errors.address.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Qo'shimcha izohlar (ixtiyoriy)</Label>
              <Textarea
                id="notes"
                placeholder="Yetkazib berish bo'yicha maxsus ko'rsatmalar"
                {...register("notes")}
                className="min-h-[80px] rounded-xl bg-muted border-0 resize-none"
              />
            </div>
          </section>

          {/* Order Summary */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Buyurtma xulosasi</h2>
            <div className="rounded-2xl bg-muted p-4 space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.product.title} x {item.quantity}
                  </span>
                  <span>{formatPriceNumber(item.product.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-3 flex justify-between font-semibold">
                <span>Jami</span>
                <span>{formatPriceNumber(getTotal())} {formatCurrencySymbol(items[0]?.product.currency || "UZS")}</span>
              </div>
            </div>
          </section>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl font-semibold"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              `Buyurtma berish — ${formatPriceNumber(getTotal())} ${formatCurrencySymbol(items[0]?.product.currency || "UZS")}`
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
