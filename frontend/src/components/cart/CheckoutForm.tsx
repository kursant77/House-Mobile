import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  MapPin,
  Phone,
  User,
  ChevronRight,
  ShoppingBag,
  ShieldCheck,
  Info,
  Clock,
  ArrowRight,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore } from "@/store/cartStore";
import { cn, formatPriceNumber, formatCurrencySymbol } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { paymentService, type PaymentMethodType } from "@/services/api/payments";

interface CheckoutFormProps {
  onBack: () => void;
}

export function CheckoutForm({ onBack }: CheckoutFormProps) {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Address, 3: Payment, 4: Summary
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
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

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(['name', 'phone']);
    } else if (step === 2) {
      isValid = await trigger(['address']);
    } else if (step === 3) {
      isValid = true; // payment method always has a value
    }

    if (isValid) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
      window.scrollTo(0, 0);
    } else {
      onBack();
    }
  };

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
        paymentMethod: paymentService.getMethodLabel(paymentMethod),
      };

      const order = await orderService.createOrder(orderData);

      // Process payment if not cash
      if (paymentMethod !== 'cash') {
        const paymentResult = await paymentService.processPayment({
          orderId: order.id,
          amount: getTotal(),
          method: { type: paymentMethod },
          currency: items[0]?.product.currency || 'UZS',
        });

        if (paymentResult.success && paymentResult.paymentUrl) {
          toast.success(`To'lov sahifasiga yo'naltirilmoqda...`, {
            description: `Buyurtma #${order.orderNumber}`,
          });
          clearCart();
          window.open(paymentResult.paymentUrl, '_blank');
          setOrderPlaced(true);
          return;
        }
      }

      toast.success(`Buyurtma qabul qilindi!`, {
        description: `Buyurtma raqami: #${order.orderNumber}`,
      });
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
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-500/20">
              <Check className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Buyurtma qabul qilindi!</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              Buyurtmangiz muvaffaqiyatli rasmiylashtirildi. Tez orada operatorimiz siz bilan bog'lanib, tafsilotlarni tasdiqlaydi.
            </p>
          </div>

          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Holat</span>
              <Badge className="bg-amber-500/10 text-amber-600 border-0 rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                <Clock className="h-3 w-3 mr-2" />
                TASDIQLASH KUTILMOQDA
              </Badge>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">Yetkazib berish:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">1-3 ish kuni</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">To'lov usuli:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{paymentService.getMethodLabel(paymentMethod)}</span>
              </div>
            </div>
          </Card>

          <Button
            onClick={() => navigate("/")}
            className="w-full h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95"
          >
            Asosiy sahifaga qaytish
          </Button>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, label: "Ma'lumotlar", icon: User },
    { id: 2, label: "Manzil", icon: MapPin },
    { id: 3, label: "To'lov", icon: CreditCard },
    { id: 4, label: "Xulosa", icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={prevStep}
              className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-white transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-90"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase transition-all duration-300">
                Checkout {step}/4
              </h1>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 md:gap-4">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all duration-500",
                  step === s.id
                    ? "bg-[#3C50E0] text-white shadow-lg shadow-[#3C50E0]/20"
                    : step > s.id
                      ? "bg-green-500 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                )}>
                  <s.icon className={cn("h-3.5 w-3.5 md:h-4 md:w-4", step === s.id && "animate-pulse")} />
                  <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-1 text-zinc-300 dark:text-zinc-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
          {/* Form Side */}
          <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* STEP 1: CONTACT INFO */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Shaxsingizni tasdiqlang</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Buyurtmani rasmiylashtirish uchun ism va telefoningizni kiriting</p>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">To'liq ism-sharifingiz</Label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-[#3C50E0] transition-colors" />
                        <Input
                          id="name"
                          placeholder="Falonchiyev Pistonchi"
                          {...register("name")}
                          className={cn(
                            "h-14 pl-12 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-4 focus:ring-[#3C50E0]/10 transition-all",
                            errors.name && "border-red-500 focus:ring-red-500/10"
                          )}
                        />
                      </div>
                      {errors.name && <p className="text-[10px] font-bold text-red-500 ml-2 uppercase tracking-tight">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Bog'lanish uchun telefon</Label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-[#3C50E0] transition-colors" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+998 90 123 45 67"
                          {...register("phone")}
                          className={cn(
                            "h-14 pl-12 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-4 focus:ring-[#3C50E0]/10 transition-all",
                            errors.phone && "border-red-500 focus:ring-red-500/10"
                          )}
                        />
                      </div>
                      {errors.phone && <p className="text-[10px] font-bold text-red-500 ml-2 uppercase tracking-tight">{errors.phone.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: ADDRESS */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Yetkazib berish manzili</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Mahsulot qayerga yetib borishi kerakligini aniq ko'rsating</p>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Aniq manzil</Label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-5 h-5 w-5 text-zinc-400 group-focus-within:text-[#3C50E0] transition-colors" />
                        <Textarea
                          id="address"
                          placeholder="Shahar, tuman, ko'cha nomi, uy raqami..."
                          {...register("address")}
                          className={cn(
                            "min-h-[140px] pl-12 pt-4 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-4 focus:ring-[#3C50E0]/10 transition-all resize-none",
                            errors.address && "border-red-500 focus:ring-red-500/10"
                          )}
                        />
                      </div>
                      {errors.address && <p className="text-[10px] font-bold text-red-500 ml-2 uppercase tracking-tight">{errors.address.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Qo'shimcha izoh (Kuryer uchun)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Masalan: Uy raqami ko'rinmaydi, kelsangiz tel qiling..."
                        {...register("notes")}
                        className="min-h-[100px] p-4 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-4 focus:ring-[#3C50E0]/10 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT METHOD */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">To'lov usulini tanlang</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Qulay to'lov usulini tanlang</p>
                  </div>

                  <PaymentMethodSelector
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                  />

                  {paymentMethod !== 'cash' && (
                    <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Buyurtmani tasdiqlangandan so'ng, {paymentService.getMethodLabel(paymentMethod)} to'lov sahifasiga yo'naltirilasiz.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'cash' && (
                    <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Mahsulot qo'lingizga yetib borganida naqd yoki terminal orqali to'lov qilasiz.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: FINAL SUMMARY */}
              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Yakuniy tekshiruv</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Ma'lumotlar to'g'riligiga ishonch hosil qiling va buyurtmani tasdiqlang</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden group hover:ring-2 hover:ring-[#3C50E0]/20 transition-all">
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-center gap-3 text-[#3C50E0]">
                          <User className="h-4 w-4" />
                          <h3 className="text-[10px] font-black uppercase tracking-widest">Mijoz</h3>
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-lg text-zinc-800 dark:text-zinc-100">{getValues('name')}</p>
                          <p className="text-sm font-bold text-zinc-500 flex items-center gap-2">
                            <Phone className="h-3 w-3 text-zinc-400" />
                            {getValues('phone')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep(1)}
                          className="w-full text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-[#3C50E0] hover:bg-[#3C50E0]/5 mt-2 h-8 rounded-lg"
                        >
                          O'zgartirish
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden group hover:ring-2 hover:ring-[#3C50E0]/20 transition-all">
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-center gap-3 text-purple-500">
                          <MapPin className="h-4 w-4" />
                          <h3 className="text-[10px] font-black uppercase tracking-widest">Yetkazib berish</h3>
                        </div>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-relaxed line-clamp-2 min-h-[40px]">
                          {getValues('address')}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep(2)}
                          className="w-full text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-[#3C50E0] hover:bg-[#3C50E0]/5 mt-2 h-8 rounded-lg"
                        >
                          O'zgartirish
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="p-6 bg-[#3C50E0]/5 rounded-3xl border border-[#3C50E0]/10 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[#3C50E0] flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-[#3C50E0] text-sm uppercase tracking-wider mb-1">To'lov usuli</h4>
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        {paymentService.getMethodLabel(paymentMethod)}
                        {paymentMethod === 'cash' && ' — yetkazib berilganda to\'lash'}
                        {paymentMethod !== 'cash' && ' — onlayn to\'lov'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep(3)}
                      className="text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-[#3C50E0] hover:bg-[#3C50E0]/5 h-8 rounded-lg ml-auto shrink-0"
                    >
                      O'zgartirish
                    </Button>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1 h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-black uppercase tracking-widest text-xs"
                  >
                    Orqaga
                  </Button>
                )}

                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex-[2] h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
                  >
                    Davom etish
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] h-14 rounded-2xl bg-[#3C50E0] hover:bg-[#3C50E0]/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-[#3C50E0]/20 active:scale-95 transition-all"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        Buyurtmani tasdiqlash
                        <Check className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Sidebar / Bag Summary */}
          <div className="lg:col-span-5 animate-in fade-in slide-in-from-right-5 duration-700 delay-200 lg:sticky lg:top-24">
            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-[3px] text-zinc-400 ml-1">Sizning savatchangiz</h2>

              <Card className="rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl shadow-zinc-200/50 dark:shadow-none overflow-hidden">
                <CardContent className="p-8">
                  {/* Item List */}
                  <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                    {items.map((item: any) => (
                      <div key={item.product.id} className="flex gap-4 items-center group">
                        <div className="h-16 w-16 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-100 dark:border-zinc-700">
                          <img src={item.product.images?.[0]} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <p className="font-black text-sm text-zinc-800 dark:text-zinc-100 line-clamp-1">{item.product.title}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            <span>Soni: {item.quantity} ta</span>
                            <div className="h-1 w-1 rounded-full bg-zinc-200" />
                            <span>{formatPriceNumber(item.product.price)} {item.product.currency}</span>
                          </div>
                        </div>
                        <p className="font-black text-sm text-zinc-900 dark:text-white">
                          {formatPriceNumber(item.product.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-8 opacity-50" />

                  {/* Pricing Breakdown */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Oraliq summa</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{formatPriceNumber(getTotal())}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Yetkazib berish</span>
                      <span className="text-[#3C50E0] text-[10px] font-black uppercase">Bepul</span>
                    </div>

                    <div className="pt-4 mt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex justify-between items-end">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[2px]">Jami To'lov</p>
                        <p className="text-xs font-bold text-zinc-500">{paymentService.getMethodLabel(paymentMethod)}</p>
                      </div>
                      <p className="text-3xl font-black text-[#3C50E0] tracking-tighter">
                        {formatPriceNumber(getTotal())}
                        <span className="text-xs align-top ml-1 opacity-50">{formatCurrencySymbol(items[0]?.product.currency || "UZS")}</span>
                      </p>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 flex flex-col items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500">Xavfsiz Xarid</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 flex flex-col items-center gap-1">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500">24/7 Yordam</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
