import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { orderService } from "@/services/api/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, CreditCard, Banknote, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCurrency } from "@/hooks/useCurrency";

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
    fullName: z.string().min(3, "Ism kamida 3 harf bo'lishi kerak"),
    phone: z.string().min(9, "Telefon raqam noto'g'ri").regex(/^\+998[0-9]{9}$/, "Format: +998901234567"),
    address: z.string().min(5, "Manzil juda qisqa"),
    paymentMethod: z.enum(["cash", "payme", "click"]),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function OneClickCheckout({ open, onOpenChange, product, quantity }: OneClickCheckoutProps) {
    const { user } = useAuthStore();
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const { formatPrice } = useCurrency();

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            fullName: user?.user_metadata?.full_name || "",
            phone: user?.user_metadata?.phone || "+998", // Assuming phone is stored or user enters manually
            address: "", // Could be pre-filled from last order
            paymentMethod: "cash",
        },
    });

    const onSubmit = async (values: CheckoutFormValues) => {
        setIsLoading(true);
        try {
            await orderService.createOrder({
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
                notes: `One-Click Checkout. To'lov turi: ${values.paymentMethod === 'cash' ? 'Naqd' : values.paymentMethod.toUpperCase()}`,
            });

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
            <div className="mb-6 bg-muted/30 p-4 rounded-xl border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Buyurtma:</p>
                <div className="flex justify-between items-center font-medium">
                    <span className="truncate flex-1 mr-2">{product.title} (x{quantity})</span>
                    <span className="whitespace-nowrap">{formatPrice(product.price * quantity, product.currency)}</span>
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

                    <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>To'lov turi</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="grid grid-cols-2 gap-4"
                                    >
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                                            </FormControl>
                                            <Label
                                                htmlFor="cash"
                                                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all cursor-pointer"
                                            >
                                                <Banknote className="mb-2 h-6 w-6" />
                                                Naqd / Terminal
                                            </Label>
                                        </FormItem>
                                        {/* TODO: Add Click/Payme integration later */}
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="click" id="click" className="peer sr-only" disabled />
                                            </FormControl>
                                            <Label
                                                htmlFor="click"
                                                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all cursor-not-allowed opacity-50"
                                            >
                                                <CreditCard className="mb-2 h-6 w-6" />
                                                Click / Payme
                                                <span className="text-[10px] text-muted-foreground mt-1">(Tez kunda)</span>
                                            </Label>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingBag className="mr-2 h-5 w-5" />}
                        {formatPrice(product.price * quantity, product.currency)} - Sotib olish
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

