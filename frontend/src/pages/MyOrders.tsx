import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { orderService, Order } from "@/services/api/orders";
import {
    Package,
    Truck,
    Clock,
    CheckCircle,
    ChevronRight,
    ShoppingBag,
    ArrowLeft,
    MessageSquare,
    X,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { cn, formatCurrency } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const ORDER_STATUSES = {
    pending: { label: "Yig'ilyabdi", icon: Package, color: "text-amber-600 bg-amber-50" },
    confirmed: { label: "Tasdiqlandi", icon: CheckCircle, color: "text-blue-600 bg-blue-50" },
    processing: { label: "Tayyorlanmoqda", icon: Clock, color: "text-purple-600 bg-purple-50" },
    shipped: { label: "Yo'lda", icon: Truck, color: "text-indigo-600 bg-indigo-50" },
    delivered: { label: "Yetkazildi", icon: CheckCircle, color: "text-green-600 bg-green-50" },
    cancelled: { label: "Bekor qilindi", icon: X, color: "text-red-600 bg-red-50" },
};

export default function MyOrders() {
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/auth");
            return;
        }
        fetchOrders();
    }, [isAuthenticated, navigate]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await orderService.getUserOrders();
            setOrders(data);
        } catch (error) {
            console.error("Orders load error:", error);
            toast.error("Buyurtmalarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (order: Order) => {
        try {
            toast.loading("Yuklanmoqda...", { id: "order-details" });
            const detailed = await orderService.getOrderWithDetails(order.id);
            setSelectedOrder(detailed);
            setDetailsOpen(true);
            toast.dismiss("order-details");
        } catch (error) {
            toast.error("Ma'lumotlarni yuklab bo'lmadi", { id: "order-details" });
        }
    };

    const getStatusInfo = (status: keyof typeof ORDER_STATUSES) => {
        return ORDER_STATUSES[status] || { label: status, icon: Info, color: "text-gray-500 bg-gray-50" };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background pt-20 px-4 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground font-medium">Buyurtmalar yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-20 pb-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="rounded-full md:hidden"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Buyurtmalarim</h1>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <Card className="p-12 text-center flex flex-col items-center gap-6 border-dashed bg-white dark:bg-zinc-900 shadow-none">
                        <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center">
                            <ShoppingBag className="h-10 w-10 text-primary/40" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Hozircha buyurtmalar yo'q</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                Siz hali birorta xaridni amalga oshirmadingiz. Mahsulotlar bo'limidan o'zingizga yoqqanini tanlang.
                            </p>
                        </div>
                        <Button onClick={() => navigate("/products")} size="lg" className="rounded-full px-8">
                            Xarid qilishni boshlash
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {orders.map((order) => {
                            const status = getStatusInfo(order.status as keyof typeof ORDER_STATUSES);

                            return (
                                <Card
                                    key={order.id}
                                    className="p-0 overflow-hidden hover:shadow-md transition-all cursor-pointer border-none bg-white dark:bg-zinc-900 group"
                                    onClick={() => handleViewDetails(order)}
                                >
                                    <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                                        {/* Group ID and Date */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between md:justify-start gap-3">
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                    #{order.orderNumber}
                                                </span>
                                                <Badge variant="outline" className={cn("rounded-full border-none px-3 font-bold text-[10px]", status.color)}>
                                                    {status.label}
                                                </Badge>
                                            </div>
                                            <h3 className="font-bold text-lg leading-tight">
                                                {format(new Date(order.createdAt), "d-MMMM, yyyy", { locale: uz })}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                                                <Package className="h-3.5 w-3.5" />
                                                <span className="text-xs font-medium">{order.customerAddress}</span>
                                            </div>
                                        </div>

                                        {/* Price and Action */}
                                        <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground font-medium">Umumiy summa</p>
                                                <p className="text-xl font-black text-primary">
                                                    {formatCurrency(order.totalAmount, order.currency)}
                                                </p>
                                            </div>
                                            <div className="md:mt-2">
                                                <Button variant="ghost" size="sm" className="rounded-full gap-2 text-zinc-500 group-hover:text-primary transition-colors pr-1">
                                                    Batafsil
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual Status Bar (Uzum-style) */}
                                    <div className="h-1 bg-zinc-100 dark:bg-zinc-800 w-full relative">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-500",
                                                order.status === 'delivered' ? "bg-green-500 w-full" :
                                                    order.status === 'cancelled' ? "bg-red-500 w-full" :
                                                        order.status === 'shipped' ? "bg-indigo-500 w-3/4" :
                                                            order.status === 'processing' ? "bg-purple-500 w-1/2" :
                                                                order.status === 'confirmed' ? "bg-blue-500 w-1/4" :
                                                                    "bg-amber-500 w-[10%]"
                                            )}
                                        />
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Order Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none sm:rounded-3xl shadow-2xl">
                    {selectedOrder && (
                        <div className="flex flex-col">
                            {/* Detailed Header */}
                            <div className="p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900 border-b border-border/50">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">
                                            Buyurtma Ma'lumotlari
                                        </p>
                                        <DialogTitle className="text-2xl md:text-3xl font-black tracking-tight">
                                            #{selectedOrder.orderNumber}
                                        </DialogTitle>
                                    </div>
                                    <Badge className={cn("md:text-sm font-bold rounded-xl px-4 py-1.5", getStatusInfo(selectedOrder.status as keyof typeof ORDER_STATUSES).color.replace('bg-', 'bg-opacity-20 bg-'))}>
                                        {getStatusInfo(selectedOrder.status as keyof typeof ORDER_STATUSES).label}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-y-2 items-center gap-x-6 text-sm font-medium text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        {format(new Date(selectedOrder.createdAt), "d MMM, HH:mm", { locale: uz })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4" />
                                        Bepul yetkazish
                                    </div>
                                </div>
                            </div>

                            {/* Tracking Progress */}
                            <div className="p-6 md:px-8 border-b border-border/50 bg-white dark:bg-black">
                                <div className="relative flex items-center justify-between w-full max-w-md mx-auto py-8">
                                    {/* Line background */}
                                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-100 dark:bg-zinc-800 -translate-y-1/2 z-0 rounded-full" />

                                    {/* Line progress */}
                                    <div
                                        className={cn(
                                            "absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-700 rounded-full",
                                            selectedOrder.status === 'delivered' ? "w-full" :
                                                selectedOrder.status === 'shipped' ? "w-[75%]" :
                                                    selectedOrder.status === 'processing' ? "w-[50%]" :
                                                        selectedOrder.status === 'confirmed' ? "w-[25%]" : "w-0"
                                        )}
                                    />

                                    {/* Steps */}
                                    {[
                                        { s: 'confirmed', i: CheckCircle, l: "Tasdiq" },
                                        { s: 'processing', i: Package, l: "Yig'im" },
                                        { s: 'shipped', i: Truck, l: "Yo'lda" },
                                        { s: 'delivered', i: CheckCircle, l: "Kutmoqda" }
                                    ].map((step, idx) => {
                                        const isActive = (
                                            (selectedOrder.status === 'delivered') ||
                                            (selectedOrder.status === 'shipped' && idx <= 2) ||
                                            (selectedOrder.status === 'processing' && idx <= 1) ||
                                            (selectedOrder.status === 'confirmed' && idx === 0) ||
                                            (selectedOrder.status === 'confirmed' && idx === 0)
                                        );
                                        const Icon = step.i;

                                        return (
                                            <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-full flex items-center justify-center border-4 transition-all duration-300",
                                                    isActive
                                                        ? "bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20"
                                                        : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700"
                                                )}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] md:text-xs font-bold whitespace-nowrap",
                                                    isActive ? "text-primary" : "text-muted-foreground"
                                                )}>
                                                    {step.l}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="p-6 md:p-8 bg-white dark:bg-black space-y-6">
                                <h4 className="font-bold flex items-center gap-2">
                                    Xarid qilingan mahsulotlar
                                    <Badge variant="secondary" className="rounded-full">{selectedOrder.items?.length || 0}</Badge>
                                </h4>
                                <div className="space-y-4">
                                    {selectedOrder.items?.map((item: any) => (
                                        <div key={item.id} className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-2xl border border-border/10">
                                            <div
                                                className="h-16 w-16 md:h-20 md:w-20 rounded-xl overflow-hidden bg-white shrink-0 cursor-pointer"
                                                onClick={() => navigate(`/product/${item.productId}`)}
                                            >
                                                {item.product?.image ? (
                                                    <img src={item.product.image} className="h-full w-full object-cover" alt={item.product.title} />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5
                                                    className="font-bold text-sm truncate cursor-pointer hover:text-primary transition-colors"
                                                    onClick={() => navigate(`/product/${item.productId}`)}
                                                >
                                                    {item.product?.title || "Noma'lum mahsulot"}
                                                </h5>
                                                <p className="text-xs text-muted-foreground mt-0.5">Soni: {item.quantity} dona</p>
                                                <p className="text-sm md:text-base font-black text-primary mt-1">
                                                    {formatCurrency(item.price * item.quantity, item.currency)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="opacity-50" />

                                {/* Total and Info */}
                                <div className="grid md:grid-cols-2 gap-8 pt-2">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Manzil</p>
                                            <p className="text-sm font-semibold">{selectedOrder.customerAddress}</p>
                                        </div>
                                        {selectedOrder.notes && (
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Izohlar</p>
                                                <p className="text-sm md:text-xs text-zinc-500 bg-muted/30 p-2 rounded-lg italic">
                                                    "{selectedOrder.notes}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-primary/5 p-6 rounded-3xl space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground font-medium">Mahsulotlar:</span>
                                            <span className="font-bold">{formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground font-medium">Yetkazib berish:</span>
                                            <span className="text-green-600 font-bold">Tekin</span>
                                        </div>
                                        <Separator className="bg-primary/10" />
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-base font-black">Jami:</span>
                                            <span className="text-2xl font-black text-primary">
                                                {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 md:p-8 border-t border-border/50 bg-white dark:bg-black flex flex-col md:flex-row gap-3">
                                <Button className="flex-1 rounded-full h-12 gap-2" variant="outline">
                                    <MessageSquare className="h-4 w-4" />
                                    Yordam kerakmi?
                                </Button>
                                <Button
                                    className="flex-1 rounded-full h-12"
                                    onClick={() => setDetailsOpen(false)}
                                >
                                    Yopish
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
