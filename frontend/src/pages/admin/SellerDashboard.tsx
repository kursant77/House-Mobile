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
    ArrowDownRight,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
    DollarSign,
    Star,
    AlertCircle,
    Users,
    BarChart3,
    Percent,
    Gift,
    Sparkles,
    MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { formatPriceNumber } from "@/lib/utils";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    totalViews: number;
    activeProducts: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
    conversionRate: number;
    totalCustomers: number;
    lowStockProducts: number;
    averageRating: number;
    totalReviews: number;
}

interface RevenueData {
    date: string;
    revenue: number;
    orders: number;
}

interface CategorySales {
    category: string;
    sales: number;
    revenue: number;
}

interface TopProduct {
    id: string;
    title: string;
    sales: number;
    revenue: number;
    views: number;
    thumbnail: string;
}


export default function SellerDashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        totalOrders: 0,
        totalViews: 0,
        activeProducts: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        totalCustomers: 0,
        lowStockProducts: 0,
        averageRating: 0,
        totalReviews: 0,
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');

    useEffect(() => {
        if (!user || (user.role !== 'blogger' && user.role !== 'super_admin' && user.role !== 'seller' && user.role !== 'admin')) {
            navigate("/");
            return;
        }

        fetchSellerData();
    }, [user, navigate, selectedPeriod]);

    const fetchSellerData = async () => {
        try {
            setLoading(true);

            // Calculate date range based on selected period
            const now = new Date();
            const daysAgo = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
            const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

            // 1. Fetch Seller's Products
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id, views, price, title, category, in_stock, rating, review_count, media:product_media(url)')
                .eq('seller_id', user!.id);

            if (productsError) throw productsError;

            const productIds = products?.map(p => p.id) || [];
            const totalViews = products?.reduce((acc, curr) => acc + (curr.views || 0), 0) || 0;
            const activeProducts = products?.filter(p => p.in_stock && p.in_stock > 0).length || 0;
            const lowStockProducts = products?.filter(p => p.in_stock !== null && p.in_stock > 0 && p.in_stock < 5).length || 0;

            // Calculate average rating
            const productsWithRatings = products?.filter(p => p.rating && p.rating > 0) || [];
            const averageRating = productsWithRatings.length > 0
                ? productsWithRatings.reduce((acc, curr) => acc + (curr.rating || 0), 0) / productsWithRatings.length
                : 0;
            const totalReviews = products?.reduce((acc, curr) => acc + (curr.review_count || 0), 0) || 0;

            // 2. Fetch Orders for these products
            const { data: orderItems, error: orderItemsError } = await supabase
                .from('order_items')
                .select('order_id, price, quantity, product_id')
                .in('product_id', productIds);

            if (orderItemsError) throw orderItemsError;

            const uniqueOrderIds = Array.from(new Set(orderItems?.map(oi => oi.order_id) || []));

            // 3. Fetch Order Details
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .in('id', uniqueOrderIds)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // Filter orders by date range
            const filteredOrders = orders?.filter(order =>
                new Date(order.created_at) >= startDate
            ) || [];

            const totalRevenue = orderItems?.reduce((acc, curr) =>
                acc + (Number(curr.price) * curr.quantity), 0
            ) || 0;

            const pendingOrders = filteredOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
            const completedOrders = filteredOrders.filter(o => o.status === 'delivered').length;
            const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length;
            const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

            // Calculate unique customers
            const uniqueCustomers = new Set(filteredOrders.map(o => o.user_id)).size;

            // Calculate conversion rate (orders / views * 100)
            const conversionRate = totalViews > 0 ? (filteredOrders.length / totalViews * 100) : 0;

            setStats({
                totalRevenue,
                totalOrders: filteredOrders.length,
                totalViews,
                activeProducts,
                pendingOrders,
                completedOrders,
                cancelledOrders,
                averageOrderValue,
                conversionRate,
                totalCustomers: uniqueCustomers,
                lowStockProducts,
                averageRating,
                totalReviews,
            });

            setRecentOrders(orders?.slice(0, 5) || []);

            // 4. Generate revenue data by date
            const revenueByDate = new Map<string, { revenue: number; orders: number }>();

            for (let i = 0; i < daysAgo; i++) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dateKey = date.toISOString().split('T')[0];
                revenueByDate.set(dateKey, { revenue: 0, orders: 0 });
            }

            filteredOrders.forEach(order => {
                const dateKey = new Date(order.created_at).toISOString().split('T')[0];
                const orderRevenue = orderItems
                    ?.filter(oi => oi.order_id === order.id)
                    .reduce((acc, curr) => acc + (Number(curr.price) * curr.quantity), 0) || 0;

                if (revenueByDate.has(dateKey)) {
                    const current = revenueByDate.get(dateKey)!;
                    revenueByDate.set(dateKey, {
                        revenue: current.revenue + orderRevenue,
                        orders: current.orders + 1
                    });
                }
            });

            const revenueChartData: RevenueData[] = Array.from(revenueByDate.entries())
                .map(([date, data]) => ({
                    date: new Date(date).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
                    revenue: data.revenue,
                    orders: data.orders
                }))
                .reverse();

            setRevenueData(revenueChartData);

            // 5. Calculate category sales
            const categoryMap = new Map<string, { sales: number; revenue: number }>();

            orderItems?.forEach(item => {
                const product = products?.find(p => p.id === item.product_id);
                if (product) {
                    const category = product.category || 'Boshqa';
                    const current = categoryMap.get(category) || { sales: 0, revenue: 0 };
                    categoryMap.set(category, {
                        sales: current.sales + item.quantity,
                        revenue: current.revenue + (Number(item.price) * item.quantity)
                    });
                }
            });

            const categoryData: CategorySales[] = Array.from(categoryMap.entries())
                .map(([category, data]) => ({
                    category,
                    sales: data.sales,
                    revenue: data.revenue
                }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            setCategorySales(categoryData);

            // 6. Calculate top products
            const productSalesMap = new Map<string, { sales: number; revenue: number }>();

            orderItems?.forEach(item => {
                const current = productSalesMap.get(item.product_id) || { sales: 0, revenue: 0 };
                productSalesMap.set(item.product_id, {
                    sales: current.sales + item.quantity,
                    revenue: current.revenue + (Number(item.price) * item.quantity)
                });
            });

            const topProductsData: TopProduct[] = Array.from(productSalesMap.entries())
                .map(([productId, data]) => {
                    const product = products?.find(p => p.id === productId);
                    return {
                        id: productId,
                        title: product?.title || 'Unknown',
                        sales: data.sales,
                        revenue: data.revenue,
                        views: product?.views || 0,
                        thumbnail: product?.media?.[0]?.url || ''
                    };
                })
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            setTopProducts(topProductsData);

        } catch (error) {
            console.error("Seller dashboard error:", error);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async () => {
        try {
            if (!user) return;
            const { data: products, error } = await supabase
                .from('products')
                .select('title, category, price, views, in_stock, rating, created_at')
                .eq('seller_id', user.id);

            if (error) throw error;
            if (!products || products.length === 0) {
                toast.error("Mahsulotlar topilmadi");
                return;
            }

            // Simple CSV generation
            const headers = ["Nomi", "Kategoriya", "Narxi", "Ko'rishlar", "Zaxira", "Reyting", "Sana"];
            const rows = products.map(p => [
                `"${p.title.replace(/"/g, '""')}"`,
                p.category,
                p.price,
                p.views,
                p.in_stock,
                p.rating || 0,
                new Date(p.created_at).toLocaleDateString()
            ]);

            const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `seller_report_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Hisobot yuklab olindi");
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Hisobotni yuklashda xatolik yuz berdi");
        }
    };

    // Calculate revenue trend
    const calculateTrend = () => {
        if (revenueData.length < 2) return { percentage: 0, isPositive: true };

        const halfLength = Math.floor(revenueData.length / 2);
        const firstHalf = revenueData.slice(0, halfLength);
        const secondHalf = revenueData.slice(halfLength);

        const firstHalfAvg = firstHalf.reduce((acc, curr) => acc + curr.revenue, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((acc, curr) => acc + curr.revenue, 0) / secondHalf.length;

        if (firstHalfAvg === 0) return { percentage: 0, isPositive: true };

        const percentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
        return { percentage: Math.abs(percentage), isPositive: percentage >= 0 };
    };

    const trend = calculateTrend();

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-background via-background to-primary/5">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-semibold animate-pulse">Sotuvchi kabineti yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24 md:pb-12 pt-20">
            <Helmet>
                <title>Sotuvchi Kabineti - House Mobile</title>
            </Helmet>

            <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Sotuvchi Kabineti
                        </h1>
                        <p className="text-muted-foreground mt-1">Sizning do'koningiz ko'rsatkichlari va boshqaruvi</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)} className="w-auto">
                            <TabsList className="bg-muted/50">
                                <TabsTrigger value="7d" className="text-xs">7 kun</TabsTrigger>
                                <TabsTrigger value="30d" className="text-xs">30 kun</TabsTrigger>
                                <TabsTrigger value="90d" className="text-xs">90 kun</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button
                            variant="outline"
                            onClick={() => navigate("/upload-product")}
                            className="rounded-xl font-semibold text-sm h-10"
                        >
                            <Package className="mr-2 h-4 w-4" />
                            Yangi mahsulot
                        </Button>
                        <Button
                            onClick={handleDownloadReport}
                            className="rounded-xl font-semibold text-sm h-10 bg-gradient-to-r from-primary to-blue-600 hover:opacity-90"
                        >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Hisobot
                        </Button>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="border-l-4 border-l-emerald-500 shadow-lg hover:shadow-xl transition-all">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <DollarSign className="h-6 w-6 text-emerald-500" />
                                </div>
                                {trend.isPositive ? (
                                    <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 bg-emerald-500/10">
                                        <ArrowUpRight className="h-3 w-3 mr-1" />
                                        {trend.percentage.toFixed(1)}%
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="border-red-500/50 text-red-600 bg-red-500/10">
                                        <ArrowDownRight className="h-3 w-3 mr-1" />
                                        {trend.percentage.toFixed(1)}%
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-2xl font-black mb-1">
                                {formatPriceNumber(stats.totalRevenue)} <span className="text-sm font-normal text-muted-foreground">UZS</span>
                            </h3>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Umumiy tushum</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <ShoppingBag className="h-6 w-6 text-blue-500" />
                                </div>
                                <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-500/10">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {stats.pendingOrders} kutilmoqda
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-2xl font-black mb-1">{stats.totalOrders}</h3>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jami buyurtmalar</p>
                            <div className="mt-3 flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1 text-emerald-600">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {stats.completedOrders}
                                </span>
                                <span className="flex items-center gap-1 text-red-600">
                                    <XCircle className="h-3 w-3" />
                                    {stats.cancelledOrders}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Eye className="h-6 w-6 text-purple-500" />
                                </div>
                                <Badge variant="outline" className="border-purple-500/50 text-purple-600 bg-purple-500/10">
                                    <Percent className="h-3 w-3 mr-1" />
                                    {stats.conversionRate.toFixed(2)}%
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-2xl font-black mb-1">{formatPriceNumber(stats.totalViews)}</h3>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ko'rishlar soni</p>
                            <p className="text-xs text-muted-foreground mt-2">Konversiya darajasi</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-all">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Package className="h-6 w-6 text-amber-500" />
                                </div>
                                {stats.lowStockProducts > 0 && (
                                    <Badge variant="outline" className="border-red-500/50 text-red-600 bg-red-500/10">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        {stats.lowStockProducts} kam
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-2xl font-black mb-1">{stats.activeProducts}</h3>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Faol mahsulotlar</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="shadow-md hover:shadow-lg transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xl font-black">{stats.totalCustomers}</p>
                                    <p className="text-xs text-muted-foreground font-semibold">Mijozlar</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <DollarSign className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-xl font-black">{formatPriceNumber(stats.averageOrderValue)}</p>
                                    <p className="text-xs text-muted-foreground font-semibold">O'rtacha buyurtma</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <Star className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-xl font-black">{stats.averageRating.toFixed(1)}</p>
                                    <p className="text-xs text-muted-foreground font-semibold">{stats.totalReviews} ta sharh</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-xl font-black">{stats.conversionRate.toFixed(2)}%</p>
                                    <p className="text-xs text-muted-foreground font-semibold">Konversiya</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Revenue Chart */}
                    <Card className="lg:col-span-2 shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold">Tushum va Buyurtmalar</CardTitle>
                                    <CardDescription>So'nggi {selectedPeriod === '7d' ? '7' : selectedPeriod === '30d' ? '30' : '90'} kunlik statistika</CardDescription>
                                </div>
                                <Badge variant={trend.isPositive ? "default" : "destructive"} className="gap-1">
                                    {trend.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {trend.percentage.toFixed(1)}%
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3C50E0" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3C50E0" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                backgroundColor: 'hsl(var(--card))',
                                            }}
                                            formatter={(value: number, name: string) => [
                                                name === 'revenue' ? `${formatPriceNumber(value)} UZS` : value,
                                                name === 'revenue' ? 'Tushum' : 'Buyurtmalar'
                                            ]}
                                        />
                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#3C50E0"
                                            strokeWidth={2.5}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                        <Area
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="orders"
                                            stroke="#10B981"
                                            strokeWidth={2.5}
                                            fillOpacity={1}
                                            fill="url(#colorOrders)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Orders */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold">So'nggi buyurtmalar</CardTitle>
                                <Link to="/seller/orders" className="text-xs font-semibold text-primary hover:underline">
                                    Hammasi
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                                {recentOrders.length > 0 ? recentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-primary/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                                {order.customer_name?.charAt(0) || 'M'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold truncate max-w-[120px]">
                                                    {order.customer_name}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {order.status === 'delivered' ? (
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                    ) : order.status === 'cancelled' ? (
                                                        <XCircle className="h-3 w-3 text-red-500" />
                                                    ) : (
                                                        <Clock className="h-3 w-3 text-amber-500" />
                                                    )}
                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black">{formatPriceNumber(order.total_amount)}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {new Date(order.created_at).toLocaleDateString('uz-UZ')}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12">
                                        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            Hozircha buyurtmalar yo'q
                                        </p>
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                className="w-full mt-4 rounded-lg font-semibold text-xs h-10"
                                onClick={() => navigate('/seller/orders')}
                            >
                                Barcha buyurtmalar
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Category Sales & Top Products */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Category Sales */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Kategoriya bo'yicha savdo</CardTitle>
                            <CardDescription>Eng ko'p sotilgan kategoriyalar</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {categorySales.length > 0 ? (
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={categorySales} layout="horizontal">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                            <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={80} />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                    backgroundColor: 'hsl(var(--card))',
                                                }}
                                                formatter={(value: number) => `${formatPriceNumber(value)} UZS`}
                                            />
                                            <Bar dataKey="revenue" fill="#3C50E0" radius={[0, 8, 8, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                    <p className="text-xs font-semibold text-muted-foreground">Ma'lumot yo'q</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Eng ko'p sotilgan mahsulotlar</CardTitle>
                            <CardDescription>Top 5 mahsulotlar</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topProducts.length > 0 ? topProducts.map((product, index) => (
                                    <div key={product.id} className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{product.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {product.sales} ta sotildi • {formatPriceNumber(product.revenue)} UZS
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <Badge variant="secondary" className="text-xs">
                                                <Eye className="h-3 w-3 mr-1" />
                                                {product.views}
                                            </Badge>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12">
                                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                        <p className="text-xs font-semibold text-muted-foreground">Ma'lumot yo'q</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="shadow-lg hover:shadow-xl transition-all border-2 hover:border-primary/50 cursor-pointer group" onClick={() => navigate('/seller/orders')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ShoppingBag className="h-6 w-6 text-blue-500" />
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h5 className="font-bold text-base mb-1">Buyurtmalarni boshqarish</h5>
                            <p className="text-xs text-muted-foreground">
                                {stats.pendingOrders} ta yangi buyurtma kutilmoqda
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg hover:shadow-xl transition-all border-2 hover:border-purple-500/50 cursor-pointer group" onClick={() => navigate('/seller/inventory')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Package className="h-6 w-6 text-purple-500" />
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                            </div>
                            <h5 className="font-bold text-base mb-1">Mahsulot inventari</h5>
                            <p className="text-xs text-muted-foreground">
                                {stats.activeProducts} ta faol mahsulot
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg hover:shadow-xl transition-all border-2 hover:border-emerald-500/50 cursor-pointer group" onClick={() => navigate('/seller/financial')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <DollarSign className="h-6 w-6 text-emerald-500" />
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <h5 className="font-bold text-base mb-1">Moliya va to'lovlar</h5>
                            <p className="text-xs text-muted-foreground">
                                Daromadingizni ko'ring va chiqarib oling
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg hover:shadow-xl transition-all border-2 hover:border-amber-500/50 cursor-pointer group" onClick={() => navigate('/seller/promotions')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Gift className="h-6 w-6 text-amber-500" />
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                            </div>
                            <h5 className="font-bold text-base mb-1">Marketing va aksiyalar</h5>
                            <p className="text-xs text-muted-foreground">
                                Chegirmalar va aksiyalar yarating
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recommendations */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10 border-primary/20 shadow-lg">
                        <CardContent className="pt-6">
                            <Sparkles className="h-8 w-8 text-primary mb-3" />
                            <h5 className="font-bold text-base mb-2">Savdolarni oshirish</h5>
                            <p className="text-sm text-muted-foreground mb-4">
                                Mahsulotlaringiz uchun Reels videolarini ko'proq yuklang. Bu foydalanuvchilar qiziqishini 40% ga oshiradi.
                            </p>
                            <Button size="sm" className="rounded-lg font-semibold">
                                Reels yuklash
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/20 shadow-lg">
                        <CardContent className="pt-6">
                            <Star className="h-8 w-8 text-amber-500 mb-3" />
                            <h5 className="font-bold text-base mb-2">Professional bo'ling</h5>
                            <p className="text-sm text-muted-foreground mb-4">
                                Tasdiqlangan 'Verified' nishonini olish orqali xaridorlar ishonchini qozoning.
                            </p>
                            <Button size="sm" variant="outline" className="rounded-lg font-semibold border-amber-500/50 text-amber-600 hover:bg-amber-500/10">
                                Ariza yuborish
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 border-blue-500/20 shadow-lg">
                        <CardContent className="pt-6">
                            <MessageSquare className="h-8 w-8 text-blue-500 mb-3" />
                            <h5 className="font-bold text-base mb-2">Mijozlar bilan aloqa</h5>
                            <p className="text-sm text-muted-foreground mb-4">
                                Mijozlar savollariga tez javob bering va savdolarni oshiring.
                            </p>
                            <Button size="sm" variant="ghost" className="rounded-lg font-semibold text-blue-600 hover:bg-transparent hover:text-blue-700 px-0">
                                Xabarlarga o'tish
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
