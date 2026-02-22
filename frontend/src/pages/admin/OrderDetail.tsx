import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
    Loader2,
    Clock,
    CheckCircle2,
    Package,
    Truck,
    PackageCheck,
    PackageX,
    AlertCircle,
    Phone,
    MapPin,
    ArrowLeft,
    RefreshCw,
    ExternalLink,
    Send,
    Calendar,
    Hash,
    Receipt,
    ListFilter,
    CreditCard,
    UserCircle2,
    Box,
    ChevronRight,
    DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPriceNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { orderService } from "@/services/api/orders";

// Premium Status Configuration with gradient backgrounds for badges
const statusConfig = {
    pending: { label: 'Kutilmoqda', color: 'text-amber-600 bg-amber-500/10 border-amber-200/20', icon: Clock, gradient: 'from-amber-500/20 to-orange-500/20', desc: 'Mijoz buyurtma berdi' },
    confirmed: { label: 'Tasdiqlandi', color: 'text-blue-600 bg-blue-500/10 border-blue-200/20', icon: CheckCircle2, gradient: 'from-blue-500/20 to-indigo-500/20', desc: 'Admin tomonidan tasdiqlandi' },
    processing: { label: 'Tayyorlanmoqda', color: 'text-purple-600 bg-purple-500/10 border-purple-200/20', icon: Package, gradient: 'from-purple-500/20 to-pink-500/20', desc: 'Qadoqlash jarayoni' },
    shipped: { label: 'Yetkazilmoqda', color: 'text-cyan-600 bg-cyan-500/10 border-cyan-200/20', icon: Truck, gradient: 'from-cyan-500/20 to-teal-500/20', desc: 'Kuryerga topshirildi' },
    delivered: { label: 'Yetkazildi', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200/20', icon: PackageCheck, gradient: 'from-emerald-500/20 to-green-500/20', desc: 'Muvaffaqiyatli yakunlandi' },
    cancelled: { label: 'Bekor qilindi', color: 'text-red-600 bg-red-500/10 border-red-200/20', icon: PackageX, gradient: 'from-red-500/20 to-rose-500/20', desc: 'Buyurtma bekor qilindi' },
};

export default function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<any | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrderDetails = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const data = await orderService.getOrderWithDetails(id!);
            setOrder(data);
        } catch (error) {
            console.error("Error fetching order details:", error);
            toast.error("Buyurtma ma'lumotlarini yuklashda xatolik yuz berdi");
            if (showLoading) navigate("/admin/orders");
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        if (!user || user.role !== 'super_admin') {
            navigate("/");
            return;
        }

        if (id) {
            fetchOrderDetails();
        }
    }, [id, user, navigate, fetchOrderDetails]);

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await fetchOrderDetails(false);
            toast.success("Ma'lumotlar yangilandi");
        } catch (error) {
            toast.error("Yangilashda xatolik");
        } finally {
            setRefreshing(false);
        }
    };

    const handleSendMessage = () => {
        toast.info("Xabar yuborish tizimi tez orada ishga tushadi", {
            description: "Hozircha mijoz telefon raqami orqali bog'lanishingiz mumkin."
        });
    };

    const handleViewProfile = () => {
        if (order?.userProfile?.id) {
            navigate(`/admin/users/${order.userProfile.id}`);
        } else {
            toast.warning("Foydalanuvchi profili topilmadi");
        }
    };

    const updateStatus = async (newStatus: any) => {
        try {
            toast.loading("Holat yangilanmoqda...", { id: "update-status" });
            await orderService.updateOrderStatus(id!, newStatus);
            toast.success("Holat muvaffaqiyatli o'zgartirildi", { id: "update-status" });
            await fetchOrderDetails(false);
        } catch (error: any) {
            toast.error(error.message || "Xatolik yuz berdi", { id: "update-status" });
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="h-12 w-12 text-indigo-600 animate-spin relative z-10" />
                </div>
                <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="min-h-screen bg-zinc-50/50 dark:bg-black/20 pb-20">
            <Helmet>
                <title>Buyurtma #{order.orderNumber} | Dashboard</title>
            </Helmet>

            {/* Floating Glass Header */}
            <div className="sticky top-4 z-40 px-4 md:px-6 mb-8">
                <div className="max-w-7xl mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-200/5 dark:shadow-none rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/admin/orders")}
                            className="h-10 w-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
                        >
                            <ArrowLeft className="h-5 w-5 text-zinc-500" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Buyurtma #{order.orderNumber}</span>
                                <Badge variant="outline" className={cn("text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5 border-0", statusConfig[order.status as keyof typeof statusConfig]?.color)}>
                                    {statusConfig[order.status as keyof typeof statusConfig]?.label}
                                </Badge>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-medium tracking-wide hidden sm:block">
                                ID: {order.id}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex-1 sm:flex-none h-9 text-xs font-semibold rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5 mr-2", refreshing && "animate-spin")} />
                            Yangilash
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSendMessage}
                            className="flex-1 sm:flex-none h-9 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                        >
                            <Send className="h-3.5 w-3.5 mr-2" />
                            Xabar
                        </Button>
                        <div className="h-9 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1" />
                        <div className="hidden sm:block">
                            <Select value={order.status} onValueChange={updateStatus}>
                                <SelectTrigger className="h-9 w-[180px] rounded-lg text-xs font-semibold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-500/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("h-2 w-2 rounded-full", statusConfig[order.status as keyof typeof statusConfig]?.color.split(' ')[0].replace('text-', 'bg-'))} />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl p-1">
                                    {Object.entries(statusConfig).map(([key, val]) => (
                                        <SelectItem key={key} value={key} className="text-xs font-medium rounded-lg cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-6 w-6 rounded-md flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800", val.color)}>
                                                    <val.icon className="h-3.5 w-3.5" />
                                                </div>
                                                <span>{val.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">

                {/* Mobile Status Control (Only visible on mobile) */}
                <div className="sm:hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Buyurtma holati</p>
                    <Select value={order.status} onValueChange={updateStatus}>
                        <SelectTrigger className="w-full h-11 rounded-xl bg-zinc-50 dark:bg-black/20 border-zinc-200 dark:border-zinc-800 font-semibold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(statusConfig).map(([key, val]) => (
                                <SelectItem key={key} value={key}>
                                    {val.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Products & Info */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Hero Stats Card */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                                    <Hash className="h-4 w-4" />
                                </div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Buyurtma Raqami</p>
                                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">#{order.orderNumber}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Yaratilgan Sana</p>
                                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                                    <Box className="h-4 w-4" />
                                </div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mahsulotlar</p>
                                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{order.items?.length || 0} tur</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3 group-hover:scale-110 transition-transform">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Umumiy Summa</p>
                                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formatPriceNumber(order.totalAmount)}</p>
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-[1.5rem] shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ListFilter className="h-4 w-4 text-zinc-400" />
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Mahsulotlar Ro'yxati</h3>
                                </div>
                                <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-0 text-[10px] font-bold px-2">
                                    Jami: {order.items?.length}
                                </Badge>
                            </div>
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {order.items?.map((item: any) => (
                                    <div key={item.id} className="p-5 flex flex-col sm:flex-row items-center gap-5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                        <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                            <img
                                                src={item.product?.image || '/placeholder.png'}
                                                alt={item.product?.title}
                                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                onError={(e: any) => e.target.src = '/placeholder.png'}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 text-center sm:text-left">
                                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                {item.product?.title}
                                            </h4>
                                            <p className="text-xs text-zinc-400 mt-1 font-medium">
                                                Mahsulot ID: {item.productId.slice(0, 8)}...
                                            </p>
                                            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                                                <Badge variant="outline" className="text-[10px] font-semibold text-zinc-500 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700">
                                                    {item.quantity} dona
                                                </Badge>
                                                <span className="text-[10px] text-zinc-300">•</span>
                                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                    {formatPriceNumber(item.price)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-center sm:text-right">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Jami</p>
                                            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">
                                                {formatPriceNumber(item.price * item.quantity)}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase">{item.currency}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-zinc-50/50 dark:bg-zinc-900 p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-xs font-medium text-zinc-500">
                                <span>Barcha mahsulotlar ko'rib chiqildi</span>
                                <span>Jami summa: {formatPriceNumber(order.totalAmount)}</span>
                            </div>
                        </div>

                        {/* Logistics Timeline (Horizontal) */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-[1.5rem] shadow-sm p-6 md:p-8">
                            <div className="flex items-center gap-2 mb-8">
                                <Truck className="h-4 w-4 text-zinc-400" />
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Yetkazib berish jarayoni</h3>
                            </div>

                            <div className="relative mx-4">
                                {/* Track Line */}
                                <div className="absolute top-[15px] left-0 right-0 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full -z-0" />
                                <div
                                    className="absolute top-[15px] left-0 h-1 bg-indigo-600 rounded-full -z-0 transition-all duration-1000"
                                    style={{ width: `${(['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.status) / 4) * 100}%` }}
                                />

                                <div className="flex justify-between relative z-10">
                                    {[
                                        { key: 'pending', icon: Clock, label: 'Kutilmoqda' },
                                        { key: 'confirmed', icon: CheckCircle2, label: 'Tasdiqlandi' },
                                        { key: 'processing', icon: Package, label: 'Tayyorlanmoqda' },
                                        { key: 'shipped', icon: Truck, label: 'Yo\'lda' },
                                        { key: 'delivered', icon: PackageCheck, label: 'Yetkazildi' }
                                    ].map((step, idx) => {
                                        const currentStatusIdx = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.status);
                                        const isCompleted = currentStatusIdx >= idx;
                                        const isCurrent = order.status === step.key;

                                        return (
                                            <div key={step.key} className="flex flex-col items-center gap-3 w-20">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-sm transition-all duration-500",
                                                    isCompleted ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400",
                                                    isCurrent && "scale-125 ring-4 ring-indigo-500/20"
                                                )}>
                                                    <step.icon className="h-3.5 w-3.5" />
                                                </div>
                                                <span className={cn(
                                                    "text-[9px] font-bold uppercase tracking-wide text-center leading-tight transition-colors duration-300",
                                                    isCompleted ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-300 dark:text-zinc-600"
                                                )}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Customer & Payment */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Customer Profile Card */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-[1.5rem] p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.02]">
                                <UserCircle2 className="h-40 w-40 text-black dark:text-white" />
                            </div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <Avatar className="h-20 w-20 border-4 border-white dark:border-zinc-900 shadow-xl">
                                        <AvatarImage src={order.userProfile?.avatarUrl} />
                                        <AvatarFallback className="bg-indigo-600 text-white font-bold text-xl">
                                            {order.customerName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-0 right-0 h-6 w-6 bg-emerald-500 rounded-full border-4 border-white dark:border-zinc-900 flex items-center justify-center">
                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{order.customerName}</h3>
                                <p className="text-xs font-medium text-zinc-500 mb-6">Mijoz ID: {order.userProfile?.id?.slice(0, 8) || 'N/A'}</p>

                                <div className="w-full space-y-3">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-colors group cursor-pointer">
                                        <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-90 transition-transform">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Telefon Raqam</p>
                                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{order.customerPhone}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-zinc-300" />
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-colors group cursor-pointer">
                                        <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-90 transition-transform">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Manzil</p>
                                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{order.customerAddress}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-zinc-300" />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleViewProfile}
                                    className="w-full mt-6 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                    Profilni Ko'rish
                                </Button>
                            </div>
                        </div>

                        {/* Payment Receipt Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[1.5rem] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            <div className="absolute -bottom-10 -right-10 h-40 w-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center justify-between opacity-80">
                                    <CreditCard className="h-6 w-6" />
                                    <Receipt className="h-6 w-6" />
                                </div>
                                <div className="space-y-4 font-mono text-sm opacity-90">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>{formatPriceNumber(order.totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Delivery</span>
                                        <span>FREE</span>
                                    </div>
                                </div>
                                <div className="h-px bg-white/20" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Total Amount</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black tracking-tight">{formatPriceNumber(order.totalAmount)}</span>
                                        <span className="text-sm font-bold opacity-60">{order.currency}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Notes */}
                        {order.notes && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/20 rounded-[1.5rem] p-6 relative overflow-hidden">
                                <div className="flex gap-4 relative z-10">
                                    <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h6 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Qo'shimcha Izoh</h6>
                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100 italic leading-relaxed">"{order.notes}"</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
