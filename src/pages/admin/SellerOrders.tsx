import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import {
    ShoppingBag,
    Loader2,
    Clock,
    CheckCircle2,
    XCircle,
    Package,
    Truck,
    Filter,
    Search,
    Eye,
    Download,
    MessageSquare,
    MoreVertical,
    ChevronDown,
    ArrowUpDown,
    PackageCheck,
    PackageX,
    AlertCircle,
    Phone,
    MapPin,
    Calendar,
    DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn, formatPriceNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Order {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    total_amount: number;
    currency: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    created_at: string;
    updated_at: string;
    user_id: string;
    items?: OrderItem[];
}

interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    product?: {
        title: string;
        media?: { url: string }[];
    };
}

const statusConfig = {
    pending: { label: 'Kutilmoqda', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
    confirmed: { label: 'Tasdiqlandi', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: CheckCircle2 },
    processing: { label: 'Tayyorlanmoqda', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Package },
    shipped: { label: 'Yetkazilmoqda', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20', icon: Truck },
    delivered: { label: 'Yetkazildi', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: PackageCheck },
    cancelled: { label: 'Bekor qilindi', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: PackageX },
};

export default function SellerOrders() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        if (!user || (user.role !== 'blogger' && user.role !== 'super_admin' && user.role !== 'seller' && user.role !== 'admin')) {
            navigate("/");
            return;
        }

        fetchOrders();
    }, [user, navigate]);

    useEffect(() => {
        filterAndSortOrders();
    }, [orders, searchQuery, statusFilter, sortBy, sortOrder]);

    const fetchOrders = async () => {
        try {
            setLoading(true);

            // 1. Fetch seller's products
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id')
                .eq('seller_id', user!.id);

            if (productsError) throw productsError;

            const productIds = products?.map(p => p.id) || [];

            if (productIds.length === 0) {
                setOrders([]);
                setFilteredOrders([]);
                setLoading(false);
                return;
            }

            // 2. Fetch order items for these products
            const { data: orderItems, error: orderItemsError } = await supabase
                .from('order_items')
                .select('order_id, product_id, quantity, price, product:products(title, media:product_media(url))')
                .in('product_id', productIds);

            if (orderItemsError) throw orderItemsError;

            const uniqueOrderIds = Array.from(new Set(orderItems?.map(oi => oi.order_id) || []));

            // 3. Fetch orders
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .in('id', uniqueOrderIds)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // 4. Combine orders with their items
            const ordersWithItems = ordersData?.map(order => ({
                ...order,
                items: orderItems?.filter(item => item.order_id === order.id).map(item => ({
                    id: item.order_id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    product: item.product as any,
                })) || []
            })) || [];

            setOrders(ordersWithItems);
            setFilteredOrders(ordersWithItems);

        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Buyurtmalarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortOrders = () => {
        let filtered = [...orders];

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(order =>
                order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer_phone.includes(searchQuery)
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            } else {
                return sortOrder === 'desc'
                    ? b.total_amount - a.total_amount
                    : a.total_amount - b.total_amount;
            }
        });

        setFilteredOrders(filtered);
    };

    const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', orderId);

            if (error) throw error;

            toast.success("Buyurtma holati yangilandi");
            fetchOrders();

            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            toast.error("Holat yangilashda xatolik");
        }
    };

    const viewOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setDetailsDialogOpen(true);
    };

    const getStatusCounts = () => {
        return {
            all: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            confirmed: orders.filter(o => o.status === 'confirmed').length,
            processing: orders.filter(o => o.status === 'processing').length,
            shipped: orders.filter(o => o.status === 'shipped').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
        };
    };

    const statusCounts = getStatusCounts();

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-background via-background to-primary/5">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-semibold animate-pulse">Buyurtmalar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24 md:pb-12 pt-20">
            <Helmet>
                <title>Buyurtmalarni Boshqarish - House Mobile</title>
            </Helmet>

            <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Buyurtmalarni Boshqarish
                        </h1>
                        <p className="text-muted-foreground mt-1">Mahsulotlaringiz uchun kelgan barcha buyurtmalar</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-lg font-semibold text-sm">
                            <Download className="mr-2 h-4 w-4" />
                            Eksport
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    <Card className="shadow-md hover:shadow-lg transition-all cursor-pointer" onClick={() => setStatusFilter('all')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <ShoppingBag className="h-5 w-5 text-primary" />
                                <h3 className="text-2xl font-black">{statusCounts.all}</h3>
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Jami</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-amber-500" onClick={() => setStatusFilter('pending')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-5 w-5 text-amber-500" />
                                <h3 className="text-2xl font-black">{statusCounts.pending}</h3>
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Kutilmoqda</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500" onClick={() => setStatusFilter('confirmed')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                <h3 className="text-2xl font-black">{statusCounts.confirmed}</h3>
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Tasdiqlandi</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-purple-500" onClick={() => setStatusFilter('processing')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="h-5 w-5 text-purple-500" />
                                <h3 className="text-2xl font-black">{statusCounts.processing}</h3>
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Tayyorlanmoqda</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-cyan-500" onClick={() => setStatusFilter('shipped')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Truck className="h-5 w-5 text-cyan-500" />
                                <h3 className="text-2xl font-black">{statusCounts.shipped}</h3>
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Yo'lda</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-emerald-500" onClick={() => setStatusFilter('delivered')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <PackageCheck className="h-5 w-5 text-emerald-500" />
                                <h3 className="text-2xl font-black">{statusCounts.delivered}</h3>
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Yetkazildi</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="shadow-lg mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buyurtma raqami, mijoz nomi yoki telefon bo'yicha qidirish..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 rounded-lg"
                                    />
                                </div>
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[200px] rounded-lg">
                                    <SelectValue placeholder="Holat bo'yicha" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Barcha buyurtmalar</SelectItem>
                                    <SelectItem value="pending">Kutilmoqda</SelectItem>
                                    <SelectItem value="confirmed">Tasdiqlandi</SelectItem>
                                    <SelectItem value="processing">Tayyorlanmoqda</SelectItem>
                                    <SelectItem value="shipped">Yetkazilmoqda</SelectItem>
                                    <SelectItem value="delivered">Yetkazildi</SelectItem>
                                    <SelectItem value="cancelled">Bekor qilindi</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                                <SelectTrigger className="w-full md:w-[180px] rounded-lg">
                                    <SelectValue placeholder="Saralash" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">Sana bo'yicha</SelectItem>
                                    <SelectItem value="amount">Summa bo'yicha</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-lg"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            >
                                <ArrowUpDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Table */}
                <Card className="shadow-lg">
                    <CardContent className="p-0">
                        {filteredOrders.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Buyurtma</TableHead>
                                            <TableHead>Mijoz</TableHead>
                                            <TableHead>Mahsulotlar</TableHead>
                                            <TableHead>Summa</TableHead>
                                            <TableHead>Holat</TableHead>
                                            <TableHead>Sana</TableHead>
                                            <TableHead className="text-right">Amallar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOrders.map((order) => {
                                            const StatusIcon = statusConfig[order.status].icon;
                                            return (
                                                <TableRow key={order.id} className="hover:bg-muted/50">
                                                    <TableCell className="font-mono text-sm font-semibold">
                                                        #{order.order_number}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-semibold">{order.customer_name}</p>
                                                            <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Package className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm">{order.items?.length || 0} ta mahsulot</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-bold">
                                                        {formatPriceNumber(order.total_amount)} <span className="text-xs font-normal text-muted-foreground">{order.currency}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={cn("gap-1", statusConfig[order.status].color)}>
                                                            <StatusIcon className="h-3 w-3" />
                                                            {statusConfig[order.status].label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {new Date(order.created_at).toLocaleDateString('uz-UZ')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="rounded-lg">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-56">
                                                                <DropdownMenuLabel>Amallar</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => viewOrderDetails(order)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Batafsil ko'rish
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem>
                                                                    <MessageSquare className="mr-2 h-4 w-4" />
                                                                    Mijozga xabar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuLabel>Holatni o'zgartirish</DropdownMenuLabel>
                                                                {order.status === 'pending' && (
                                                                    <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'confirmed')}>
                                                                        <CheckCircle2 className="mr-2 h-4 w-4 text-blue-500" />
                                                                        Tasdiqlash
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {order.status === 'confirmed' && (
                                                                    <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'processing')}>
                                                                        <Package className="mr-2 h-4 w-4 text-purple-500" />
                                                                        Tayyorlash
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {order.status === 'processing' && (
                                                                    <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'shipped')}>
                                                                        <Truck className="mr-2 h-4 w-4 text-cyan-500" />
                                                                        Yuborish
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {order.status === 'shipped' && (
                                                                    <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'delivered')}>
                                                                        <PackageCheck className="mr-2 h-4 w-4 text-emerald-500" />
                                                                        Yetkazildi
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                                                            className="text-red-600"
                                                                        >
                                                                            <PackageX className="mr-2 h-4 w-4" />
                                                                            Bekor qilish
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-bold mb-2">Buyurtmalar topilmadi</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    {searchQuery || statusFilter !== 'all'
                                        ? "Qidiruv kriteriyalariga mos buyurtmalar yo'q"
                                        : "Hozircha hech qanday buyurtma yo'q"}
                                </p>
                                {(searchQuery || statusFilter !== 'all') && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setStatusFilter("all");
                                        }}
                                    >
                                        Filterni tozalash
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Order Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                            Buyurtma #{selectedOrder?.order_number}
                        </DialogTitle>
                        <DialogDescription>
                            Buyurtma tafsilotlari va mijoz ma'lumotlari
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
                            <div className="space-y-6">
                                {/* Status */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-3">Holat</h4>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={cn("gap-2 py-2 px-4", statusConfig[selectedOrder.status].color)}>
                                            {(() => {
                                                const StatusIcon = statusConfig[selectedOrder.status].icon;
                                                return <StatusIcon className="h-4 w-4" />;
                                            })()}
                                            {statusConfig[selectedOrder.status].label}
                                        </Badge>
                                        <Select
                                            value={selectedOrder.status}
                                            onValueChange={(value) => updateOrderStatus(selectedOrder.id, value as any)}
                                        >
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Kutilmoqda</SelectItem>
                                                <SelectItem value="confirmed">Tasdiqlandi</SelectItem>
                                                <SelectItem value="processing">Tayyorlanmoqda</SelectItem>
                                                <SelectItem value="shipped">Yetkazilmoqda</SelectItem>
                                                <SelectItem value="delivered">Yetkazildi</SelectItem>
                                                <SelectItem value="cancelled">Bekor qilindi</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Separator />

                                {/* Customer Info */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-3">Mijoz ma'lumotlari</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold">
                                                {selectedOrder.customer_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{selectedOrder.customer_name}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {selectedOrder.customer_phone}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <p className="text-sm">{selectedOrder.customer_address}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Order Items */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-3">Buyurtma mahsulotlari</h4>
                                    <div className="space-y-3">
                                        {selectedOrder.items?.map((item, index) => (
                                            <div key={index} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                                                {item.product?.media?.[0]?.url ? (
                                                    <img
                                                        src={item.product.media[0].url}
                                                        alt={item.product.title}
                                                        className="h-16 w-16 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <p className="font-semibold">{item.product?.title || 'Unknown'}</p>
                                                    <p className="text-sm text-muted-foreground">Miqdor: {item.quantity} ta</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">{formatPriceNumber(item.price * item.quantity)} UZS</p>
                                                    <p className="text-xs text-muted-foreground">{formatPriceNumber(item.price)} × {item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                {/* Total */}
                                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-5 w-5 text-primary" />
                                            <span className="font-semibold">Jami summa</span>
                                        </div>
                                        <p className="text-2xl font-black">
                                            {formatPriceNumber(selectedOrder.total_amount)} <span className="text-sm font-normal text-muted-foreground">{selectedOrder.currency}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Yaratilgan</p>
                                            <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString('uz-UZ')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Yangilangan</p>
                                            <p className="font-medium">{new Date(selectedOrder.updated_at).toLocaleString('uz-UZ')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                            Yopish
                        </Button>
                        <Button variant="outline">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Mijozga xabar
                        </Button>
                        <Button>
                            <Download className="mr-2 h-4 w-4" />
                            Chop etish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
