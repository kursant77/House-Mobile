import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Users, ShoppingBag, Clapperboard, Eye, Loader2, ArrowUpRight, ArrowDownRight, Package, Download } from "lucide-react";
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
    Cell
} from 'recharts';
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

const COLORS = ['#3C50E0', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
    const [stats, setStats] = useState({
        users: 0,
        products: 0,
        reels: 0,
        views: 0,
        loading: true
    });

    const [chartData, setChartData] = useState<any[]>([]);
    const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch counts and data
                const [
                    { count: usersCount },
                    { count: productsCount },
                    { count: reelsCount },
                    { data: productsData }
                ] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('products').select('*', { count: 'exact', head: true }),
                    supabase.from('product_media').select('id', { count: 'exact', head: true }).eq('type', 'video'),
                    supabase.from('products').select('views, category, created_at')
                ]);

                const totalViews = productsData?.reduce((acc, curr) => acc + (curr.views || 0), 0) || 0;

                setStats({
                    users: usersCount || 0,
                    products: productsCount || 0,
                    reels: reelsCount || 0,
                    views: totalViews,
                    loading: false
                });

                // Calculate Category Distribution
                if (productsData) {
                    const counts: Record<string, number> = {};
                    productsData.forEach(p => {
                        const cat = p.category || 'Boshqa';
                        counts[cat] = (counts[cat] || 0) + 1;
                    });

                    const distribution = Object.entries(counts)
                        .map(([name, value]) => ({ name, value }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5);

                    setCategoryDistribution(distribution);
                }

                // Generate chart data from created_at timestamps
                const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
                const monthlyStats: Record<string, { products: number, users: number }> = {};

                // Initialize last 6 months
                const now = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const label = months[d.getMonth()];
                    monthlyStats[label] = { products: 0, users: 0 };
                }

                if (productsData) {
                    productsData.forEach(p => {
                        const d = new Date(p.created_at);
                        const label = months[d.getMonth()];
                        if (monthlyStats[label]) {
                            monthlyStats[label].products += 1;
                        }
                    });
                }

                // Note: User chart data is not available due to RLS on profiles table
                // Users count is still shown in stats, just not in the chart

                const chartItems = Object.entries(monthlyStats).map(([name, vals]) => ({
                    name,
                    products: vals.products,
                    users: vals.users
                }));
                setChartData(chartItems);

                // Fetch recent activity
                const { data: latestProducts } = await supabase
                    .from('products')
                    .select('*, profiles!seller_id(full_name, avatar_url)')
                    .order('created_at', { ascending: false })
                    .limit(5);

                setRecentActivity(latestProducts || []);
            } catch (error) {
                console.error('Dashboard error:', error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchDashboardData();
    }, []);

    const handleDownloadReport = async () => {
        try {
            const { data: products, error } = await supabase
                .from('products')
                .select('title, category, price, views, created_at');

            if (error) throw error;
            if (!products || products.length === 0) {
                alert("Mahsulotlar topilmadi");
                return;
            }

            // Simple CSV generation
            const headers = ["Nomi", "Kategoriya", "Narxi", "Ko'rishlar", "Sana"];
            const rows = products.map(p => [
                `"${p.title.replace(/"/g, '""')}"`,
                p.category,
                p.price,
                p.views,
                new Date(p.created_at).toLocaleDateString()
            ]);

            const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `hisobot_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download error:", error);
            alert("Hisobotni yuklashda xatolik yuz berdi");
        }
    };

    if (stats.loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-background via-background to-primary/5">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-semibold animate-pulse">Admin panel yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8">
            <Helmet>
                <title>Admin Dashboard - House Mobile</title>
            </Helmet>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">Platforma statistikasi va faoliyati</p>
                </div>
                <Button
                    onClick={handleDownloadReport}
                    className="rounded-lg font-semibold bg-gradient-to-r from-primary to-blue-600"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Hisobot yuklash
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: 'Jami ko\'rishlar',
                        value: stats.views,
                        icon: Eye,
                        gradient: 'from-blue-500 to-cyan-500',
                        bgColor: 'bg-blue-500/10',
                        iconColor: 'text-blue-500',
                        trend: '12.5%',
                        up: true,
                        borderColor: 'border-l-blue-500'
                    },
                    {
                        label: 'Jami mahsulotlar',
                        value: stats.products,
                        icon: ShoppingBag,
                        gradient: 'from-emerald-500 to-teal-500',
                        bgColor: 'bg-emerald-500/10',
                        iconColor: 'text-emerald-500',
                        trend: '8.2%',
                        up: true,
                        borderColor: 'border-l-emerald-500'
                    },
                    {
                        label: 'Jami foydalanuvchilar',
                        value: stats.users,
                        icon: Users,
                        gradient: 'from-amber-500 to-orange-500',
                        bgColor: 'bg-amber-500/10',
                        iconColor: 'text-amber-500',
                        trend: '15.3%',
                        up: true,
                        borderColor: 'border-l-amber-500'
                    },
                    {
                        label: 'Jami Reels',
                        value: stats.reels,
                        icon: Clapperboard,
                        gradient: 'from-purple-500 to-pink-500',
                        bgColor: 'bg-purple-500/10',
                        iconColor: 'text-purple-500',
                        trend: '3.1%',
                        up: false,
                        borderColor: 'border-l-purple-500'
                    },
                ].map((card, i) => (
                    <Card key={i} className={cn("shadow-lg hover:shadow-xl transition-all border-l-4", card.borderColor)}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", card.bgColor)}>
                                    <card.icon className={cn("h-6 w-6", card.iconColor)} />
                                </div>
                                <Badge variant={card.up ? "default" : "destructive"} className="gap-1">
                                    {card.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {card.trend}
                                </Badge>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black mb-1">
                                    {card.value >= 1000 ? `${(card.value / 1000).toFixed(1)}K` : card.value}
                                </h3>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {card.label}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Views/Activity Chart */}
                <Card className="shadow-lg lg:col-span-8">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Ko'rishlar va Faollik</CardTitle>
                        <CardDescription>So'nggi 6 oylik statistika</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3C50E0" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3C50E0" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                    <XAxis
                                        dataKey="name"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#94a3b8' }}
                                    />
                                    <YAxis
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#94a3b8' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            backgroundColor: 'hsl(var(--card))',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="products"
                                        stroke="#3C50E0"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#colorTotal)"
                                        name="Yangi mahsulotlar"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="users"
                                        stroke="#10B981"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#colorActive)"
                                        name="Yangi foydalanuvchilar"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-primary"></div>
                                <span className="text-sm font-semibold text-muted-foreground">Yangi mahsulotlar</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                                <span className="text-sm font-semibold text-muted-foreground">Yangi foydalanuvchilar</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Distribution */}
                <Card className="shadow-lg lg:col-span-4">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Kategoriyalar</CardTitle>
                        <CardDescription>Mahsulotlar taqsimoti</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryDistribution}>
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {categoryDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                    <XAxis
                                        dataKey="name"
                                        fontSize={10}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            backgroundColor: 'hsl(var(--card))',
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-6 space-y-3">
                            {categoryDistribution.map((cat, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="h-3 w-3 rounded-full"
                                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                        />
                                        <span className="text-sm font-semibold">{cat.name}</span>
                                    </div>
                                    <Badge variant="secondary">
                                        {stats.products > 0 ? Math.round((cat.value / stats.products) * 100) : 0}%
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold">So'nggi faoliyat</CardTitle>
                            <CardDescription>Yangi yuklangan mahsulotlar</CardDescription>
                        </div>
                        <Link to="/admin/products">
                            <Button variant="outline" className="rounded-lg font-semibold text-sm">
                                Barchasini ko'rish
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {recentActivity.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-3 px-6 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Foydalanuvchi
                                        </th>
                                        <th className="py-3 px-6 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Amal
                                        </th>
                                        <th className="py-3 px-6 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Sana
                                        </th>
                                        <th className="py-3 px-6 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Holat
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentActivity.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className={cn(
                                                "border-b last:border-0 hover:bg-muted/50 transition-colors",
                                                "animate-fade-in"
                                            )}
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    {item.profiles?.avatar_url ? (
                                                        <img
                                                            src={item.profiles.avatar_url}
                                                            alt=""
                                                            className="h-10 w-10 rounded-full object-cover border-2 border-border"
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                                            {item.profiles?.full_name?.charAt(0) || "U"}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-semibold">
                                                            {item.profiles?.full_name || "Unknown"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            ID: {item.id.slice(0, 8)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="max-w-xs">
                                                    <p className="text-sm">
                                                        Yangi mahsulot yukladi:{" "}
                                                        <span className="font-semibold text-primary">
                                                            "{item.title}"
                                                        </span>
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(item.created_at || Date.now()).toLocaleDateString('uz-UZ')}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 bg-emerald-500/10">
                                                    Muvaffaqiyatli
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-semibold text-muted-foreground">
                                Hozircha faoliyat yo'q
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
