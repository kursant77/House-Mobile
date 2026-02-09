import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
    ShoppingBag,
    Loader2,
    Clock,
    CheckCircle2,
    Package,
    Truck,
    Search,
    Eye,
    Download,
    MoreVertical,
    PackageCheck,
    PackageX,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn, formatPriceNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { orderService } from "@/services/api/orders";

const statusConfig = {
    pending: { label: 'Kutilmoqda', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock, desc: 'Mijoz buyurtma berdi va tasdiqlashni kutmoqda' },
    confirmed: { label: 'Tasdiqlandi', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: CheckCircle2, desc: 'Buyurtma admin tomonidan tekshirildi' },
    processing: { label: 'Tayyorlanmoqda', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Package, desc: 'Mahsulot qadoqlanmoqda' },
    shipped: { label: 'Yetkazilmoqda', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20', icon: Truck, desc: 'Buyurtma kurerga topshirildi' },
    delivered: { label: 'Yetkazildi', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: PackageCheck, desc: 'Mijoz mahsulotni qabul qilib oldi' },
    cancelled: { label: 'Bekor qilindi', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: PackageX, desc: 'Buyurtma bekor qilingan' },
};

export default function OrdersAdmin() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
            navigate("/");
            return;
        }

        fetchOrders();
    }, [user, navigate]);

    useEffect(() => {
        let filtered = [...orders];

        if (searchQuery) {
            filtered = filtered.filter(order =>
                order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customerPhone.includes(searchQuery)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        setFilteredOrders(filtered);
    }, [orders, searchQuery, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await orderService.getAllOrders();
            setOrders(data);
            setFilteredOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Buyurtmalarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
        toast.info("Ma'lumotlar yangilandi");
    };

    const updateStatus = async (orderId: string, newStatus: any) => {
        try {
            await orderService.updateOrderStatus(orderId, newStatus);
            toast.success("Holat yangilandi");

            // Update local state
            setOrders((prev: any[]) => prev.map((o: any) => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error: any) {
            toast.error(error.message || "Xatolik yuz berdi");
        }
    };

    const viewDetails = (order: any) => {
        navigate(`/admin/orders/${order.id}`);
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 text-[#3C50E0] animate-spin" />
                <p className="text-zinc-500 font-medium">Barcha buyurtmalar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Helmet>
                <title>Buyurtmalar Boshqaruvi | House Admin</title>
            </Helmet>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                        Buyurtmalar Markazi
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium mt-2 max-w-md">
                        Tizimdagi barcha tranzaktsiyalar, yetkazib berish jarayonlari va mijozlar bilan aloqalarni boshqarish markazi.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="h-12 px-6 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Yangilash
                    </Button>
                    <Button className="h-12 px-8 rounded-2xl bg-[#3C50E0] hover:bg-[#3C50E0]/90 text-white font-black uppercase tracking-wider text-xs transition-all active:scale-95 shadow-xl shadow-[#3C50E0]/20">
                        <Download className="h-4 w-4 mr-2" />
                        Hisobot (CSV)
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6">
                {/* Filters & Actions */}
                <Card className="border-0 bg-transparent shadow-none overflow-visible">
                    <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-md p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800/50 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full lg:w-auto">
                                <TabsList className="bg-zinc-100/50 dark:bg-zinc-800/50 p-1.5 h-14 rounded-2xl">
                                    <TabsTrigger value="all" className="rounded-xl px-6 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-lg">Barchasi</TabsTrigger>
                                    <TabsTrigger value="pending" className="rounded-xl px-6 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-lg">Kutilayotgan</TabsTrigger>
                                    <TabsTrigger value="processing" className="rounded-xl px-6 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-lg">Jarayonda</TabsTrigger>
                                    <TabsTrigger value="shipped" className="rounded-xl px-6 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-lg">Yo'lda</TabsTrigger>
                                    <TabsTrigger value="delivered" className="rounded-xl px-6 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-lg">Yakunlangan</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <div className="relative w-full lg:w-[400px] group">
                                <div className="absolute -inset-1 bg-[#3C50E0]/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-[#3C50E0] transition-colors z-10" />
                                <Input
                                    placeholder="Buyurtma #, Ism yoki Tel..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 font-bold focus:border-[#3C50E0] transition-all relative z-10 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/40 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden transition-all">
                        <div className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-zinc-50/30 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
                                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-[2px] text-zinc-500">Buyurtma ID</TableHead>
                                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-[2px] text-zinc-500">Mijoz</TableHead>
                                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-[2px] text-zinc-500">Summa</TableHead>
                                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-[2px] text-zinc-500">Holat</TableHead>
                                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-[2px] text-zinc-500">Sana</TableHead>
                                            <TableHead className="py-4 text-right font-black text-[10px] uppercase tracking-[2px] text-zinc-500">Amallar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOrders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="py-20 text-center opacity-30">
                                                    <ShoppingBag className="h-12 w-12 mx-auto mb-2 text-zinc-400" />
                                                    <p className="font-bold uppercase tracking-widest text-xs text-zinc-500">Buyurtmalar topilmadi</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredOrders.map((order: any) => {
                                                const cfg = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                                                return (
                                                    <TableRow key={order.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors border-zinc-100 dark:border-zinc-800">
                                                        <TableCell className="py-4 font-mono font-black text-sm text-[#3C50E0]">
                                                            #{order.orderNumber}
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-9 w-9 border border-zinc-200 shadow-sm">
                                                                    <AvatarImage src={order.user?.avatarUrl} />
                                                                    <AvatarFallback className="bg-zinc-100 font-bold text-xs">{order.customerName.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100 leading-none mb-1">{order.customerName}</p>
                                                                    <p className="text-xs text-zinc-500 font-medium">{order.customerPhone}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 font-black text-zinc-800 dark:text-zinc-100">
                                                            {formatPriceNumber(order.totalAmount)} <span className="text-[10px] text-zinc-400 ml-0.5">{order.currency}</span>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <Badge className={cn("rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-0", cfg.color)}>
                                                                <cfg.icon className="h-3 w-3 mr-1.5" />
                                                                {cfg.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-4 text-xs font-bold text-zinc-500">
                                                            {new Date(order.createdAt).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </TableCell>
                                                        <TableCell className="py-4 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => viewDetails(order)}
                                                                    className="h-9 w-9 rounded-lg hover:bg-[#3C50E0]/10 hover:text-[#3C50E0]"
                                                                >
                                                                    <Eye className="h-4.5 w-4.5" />
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                                                            <MoreVertical className="h-4.5 w-4.5" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-zinc-200 dark:border-zinc-800">
                                                                        <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-widest text-zinc-400 p-3">Holatni boshqarish</DropdownMenuLabel>
                                                                        <DropdownMenuSeparator />
                                                                        {Object.entries(statusConfig).map(([key, val]) => (
                                                                            <DropdownMenuItem
                                                                                key={key}
                                                                                onClick={() => updateStatus(order.id, key)}
                                                                                className={cn(
                                                                                    "flex items-center gap-3 p-3 cursor-pointer",
                                                                                    order.status === key && "bg-zinc-50 dark:bg-zinc-800"
                                                                                )}
                                                                            >
                                                                                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", val.color)}>
                                                                                    <val.icon className="h-4 w-4" />
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <p className="font-bold text-xs">{val.label}</p>
                                                                                    <p className="text-[10px] text-zinc-400 font-medium line-clamp-1">{val.desc}</p>
                                                                                </div>
                                                                            </DropdownMenuItem>
                                                                        ))}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

        </div>
    );
}
