import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import {
    ShoppingBag,
    TrendingUp,
    Eye,
    Package,
    Loader2,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { cn, formatPriceNumber } from "@/lib/utils";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

export default function SellerDashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalViews: 0,
        activeProducts: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        if (!user || (user.role !== 'blogger' && user.role !== 'super_admin')) {
            navigate("/");
            return;
        }

        const fetchSellerData = async () => {
            try {
                // 1. Fetch Seller's Products
                const { data: products } = await supabase
                    .from('products')
                    .select('id, views, price, title')
                    .eq('seller_id', user.id);

                const productIds = products?.map(p => p.id) || [];
                const totalViews = products?.reduce((acc, curr) => acc + (curr.views || 0), 0) || 0;

                // 2. Fetch Orders for these products
                // This requires join or fetching order_items first
                const { data: orderItems } = await supabase
                    .from('order_items')
                    .select('order_id, price, quantity, productId:product_id')
                    .in('product_id', productIds);

                const uniqueOrderIds = Array.from(new Set(orderItems?.map(oi => oi.order_id) || []));

                // 3. Fetch Order Details
                const { data: orders } = await supabase
                    .from('orders')
                    .select('*')
                    .in('id', uniqueOrderIds)
                    .order('created_at', { ascending: false });

                const totalRevenue = orderItems?.reduce((acc, curr) => acc + (Number(curr.price) * curr.quantity), 0) || 0;

                setStats({
                    totalRevenue,
                    totalOrders: uniqueOrderIds.length,
                    totalViews,
                    activeProducts: productIds.length
                });

                setRecentOrders(orders?.slice(0, 5) || []);

                // 4. Generate some mock chart data for now (could be aggregated from orders)
                const mockChartData = [
                    { name: 'Mon', revenue: totalRevenue * 0.1 },
                    { name: 'Tue', revenue: totalRevenue * 0.15 },
                    { name: 'Wed', revenue: totalRevenue * 0.12 },
                    { name: 'Thu', revenue: totalRevenue * 0.2 },
                    { name: 'Fri', revenue: totalRevenue * 0.18 },
                    { name: 'Sat', revenue: totalRevenue * 0.25 },
                    { name: 'Sun', revenue: totalRevenue * 0.1 },
                ];
                setChartData(mockChartData);

            } catch (error) {
                console.error("Seller dashboard error:", error);
                toast.error("Ma'lumotlarni yuklashda xatolik");
            } finally {
                setLoading(false);
            }
        };

        fetchSellerData();
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium animate-pulse">Sotuvchi kabineti yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-12 pt-20">
            <Helmet>
                <title>Sotuvchi Kabineti - House Mobile</title>
            </Helmet>

            <div className="max-w-7xl mx-auto px-4 md:px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Sotuvchi Kabineti</h1>
                        <p className="text-muted-foreground">Sizning do'koningiz ko'rsatkichlari va boshqaruvi</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => navigate("/admin/products/new")} className="rounded-xl font-bold uppercase tracking-wider text-xs h-11">
                            <Package className="mr-2 h-4 w-4" />
                            Yangi mahsulot
                        </Button>
                        <Button className="rounded-xl font-bold uppercase tracking-wider text-xs h-11 px-6">
                            Hisobot yuklash
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Umumiy tushum', value: `${formatPriceNumber(stats.totalRevenue)} UZS`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'Buyurtmalar', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Ko\'rishlar soni', value: formatPriceNumber(stats.totalViews), icon: Eye, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                        { label: 'Faol mahsulotlar', value: stats.activeProducts, icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    ].map((card, i) => (
                        <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                            <div className={cn("h-10 w-10 flex items-center justify-center rounded-xl mb-4", card.bg)}>
                                <card.icon className={cn("h-5 w-5", card.color)} />
                            </div>
                            <h3 className="text-2xl font-black mb-1">{card.value}</h3>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{card.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold text-lg uppercase tracking-tight">Tushum grafigi (7 kunlik)</h4>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                                    <ArrowUpRight className="h-3 w-3" />
                                    +12.5%
                                </span>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3C50E0" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3C50E0" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickFormatter={(value) => `${value / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3C50E0"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold text-lg uppercase tracking-tight">So'nggi buyurtmalar</h4>
                            <Link to="/admin/orders" className="text-xs font-bold text-primary hover:underline">Hammasi</Link>
                        </div>
                        <div className="space-y-4">
                            {recentOrders.length > 0 ? recentOrders.map((order, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                            {order.customer_name?.charAt(0) || 'B'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold truncate max-w-[120px]">{order.customer_name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {order.status === 'delivered' ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> :
                                                    order.status === 'cancelled' ? <XCircle className="h-3 w-3 text-destructive" /> :
                                                        <Clock className="h-3 w-3 text-amber-500" />}
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{order.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black">{formatPriceNumber(order.total_amount)}</p>
                                        <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12">
                                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Hozircha buyurtmalar yo'q</p>
                                </div>
                            )}
                        </div>

                        <Button variant="outline" className="w-full mt-6 rounded-xl font-bold uppercase tracking-widest text-[10px] h-11">
                            Barcha buyurtmalarni ko'rish
                        </Button>
                    </div>
                </div>

                {/* Quick Actions / Recommendations */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                            <h5 className="font-bold text-lg mb-2">Savdolarni oshirish rejasimi?</h5>
                            <p className="text-sm text-muted-foreground mb-4">Mahsulotlaringiz uchun Reels videolarini ko'proq yuklang. Bu foydalanuvchilar qiziqishini 40% ga oshiradi.</p>
                        </div>
                        <Button className="w-fit rounded-lg font-bold text-xs uppercase px-6">Reels yuklash</Button>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                            <h5 className="font-bold text-lg mb-2">Profilni tasdiqlash</h5>
                            <p className="text-sm text-muted-foreground mb-4">Tasdiqlangan 'Verified' nishonini olish orqali xaridorlar ishonchini qozoning.</p>
                        </div>
                        <Button variant="outline" className="w-fit rounded-lg font-bold text-xs uppercase px-6 border-amber-500/50 text-amber-600 hover:bg-amber-500/10">Ariza yuborish</Button>
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                            <h5 className="font-bold text-lg mb-2">Mijozlar bilan aloqa</h5>
                            <p className="text-sm text-muted-foreground mb-4">Sizga kelgan 4 ta yangi xabarni o'qib chiqing va javob bering.</p>
                        </div>
                        <Button variant="ghost" className="w-fit rounded-lg font-bold text-xs uppercase px-0 text-blue-600 hover:bg-transparent hover:text-blue-700">
                            Xabarlarga o'tish <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
