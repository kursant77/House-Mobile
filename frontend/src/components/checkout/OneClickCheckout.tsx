import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { orderService } from "@/services/api/orders";
import { paymentService, type PaymentMethodType } from "@/services/api/payments";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, ShoppingBag, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCurrency } from "@/hooks/useCurrency";
import { checkoutSchema as baseCheckoutSchema } from "@/lib/validation";

interface OneClickCheckoutProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: {
        id: string;
        title: string;
        price: number;
        currency: string;
    };
    quantity: number;
}

const checkoutSchema = z.object({
    fullName: baseCheckoutSchema.shape.name,
    phone: baseCheckoutSchema.shape.phone,
    address: baseCheckoutSchema.shape.address,
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function OneClickCheckout({ open, onOpenChange, product, quantity }: OneClickCheckoutProps) {
    const { user } = useAuthStore();
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const { formatPrice } = useCurrency();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            fullName: user?.name || "",
            phone: user?.phone || "+998",
            address: "",
        },
    });

    const onSubmit = async (values: CheckoutFormValues) => {
        setIsLoading(true);
        try {
            const order = await orderService.createOrder({
                customerName: values.fullName,
                customerPhone: values.phone,
                customerAddress: values.address,
                items: [{
                    productId: product.id,
                    quantity: quantity,
                    price: product.price,
                    currency: product.currency,
                }],
                totalAmount: product.price * quantity,
                currency: product.currency,
                paymentMethod: paymentService.getMethodLabel(paymentMethod),
                notes: `Tezkor xarid`,
            });

            // Process online payment if not cash
            if (paymentMethod !== 'cash') {
                const paymentResult = await paymentService.processPayment({
                    orderId: order.id,
                    amount: product.price * quantity,
                    method: { type: paymentMethod },
                    currency: product.currency,
                });

                if (paymentResult.success && paymentResult.paymentUrl) {
                    toast.success("To'lov sahifasiga yo'naltirilmoqda...", {
                        description: `Buyurtma #${order.orderNumber}`,
                    });
                    onOpenChange(false);
                    window.open(paymentResult.paymentUrl, '_blank');
                    navigate("/orders");
                    return;
                }
            }

            toast.success("Buyurtma qabul qilindi!");
            onOpenChange(false);
            navigate("/orders");
        } catch (error) {
            console.error(error);
            toast.error("Buyurtma berishda xatolik yuz berdi");
        } finally {
            setIsLoading(false);
        }
    };

    const content = (
        <div className="px-4 pb-4">
            <div className="mb-5 bg-muted/30 p-4 rounded-xl border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Buyurtma:</p>
                <div className="flex justify-between items-center font-medium">
                    <span className="truncate flex-1 mr-2">{product.title} (x{quantity})</span>
                    <span className="whitespace-nowrap font-bold">{formatPrice(product.price * quantity, product.currency)}</span>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ism-familiya</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ism Familiya" {...field} className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Telefon</FormLabel>
                                <FormControl>
                                    <Input placeholder="+998901234567" {...field} className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Yetkazib berish manzili</FormLabel>
                                <FormControl>
                                    <Input placeholder="Toshkent sh, Chilonzor..." {...field} className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Payment Method Selection */}
                    <div className="space-y-2 pt-2">
                        <p className="text-sm font-semibold">To'lov usuli</p>
                        <PaymentMethodSelector
                            value={paymentMethod}
                            onChange={setPaymentMethod}
                            compact
                        />
                    </div>

                    <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold mt-4 gap-2" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : paymentMethod !== 'cash' ? (
                            <ExternalLink className="h-5 w-5" />
                        ) : (
                            <ShoppingBag className="h-5 w-5" />
                        )}
                        {formatPrice(product.price * quantity, product.currency)} — {paymentMethod === 'cash' ? "Sotib olish" : `${paymentService.getMethodLabel(paymentMethod)} orqali to'lash`}
                    </Button>
                </form>
            </Form>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>Tezkor xarid</DrawerTitle>
                        <DrawerDescription>
                            Buyurtma ma'lumotlarini to'ldiring
                        </DrawerDescription>
                    </DrawerHeader>
                    {content}
                    <DrawerFooter className="pt-2">
                        {/* Footer usually for secondary actions, main action in form */}
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tezkor xarid</DialogTitle>
                    <DialogDescription>
                        Buyurtma ma'lumotlarini to'ldiring
                    </DialogDescription>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
    );
}
