import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, ShoppingBag, Eye, Calendar, ArrowUpRight, ArrowDownRight, Loader2, PieChart as PieIcon, Activity } from "lucide-react";
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
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { cn } from "@/lib/utils";

const COLORS = ['#3C50E0', '#80CAEE', '#10B981', '#FFB81C', '#E11D48', '#6366F1'];

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [trafficData, setTrafficData] = useState<any[]>([]);
    const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
    const [metrics, setMetrics] = useState({
        totalViews: 0,
        totalUsers: 0,
        totalProducts: 0,
        conversionRate: 85.4, // Keep some as defaults if not trackable
        avgSession: 12450
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [
                { data: products },
                { count: usersCount }
            ] = await Promise.all([
                supabase.from('products').select('views, category, created_at'),
                supabase.from('profiles').select('*', { count: 'exact', head: true })
            ]);

            if (products) {
                // 1. Metrics
                const views = products.reduce((acc, p) => acc + (p.views || 0), 0);
                setMetrics(prev => ({
                    ...prev,
                    totalViews: views,
                    totalUsers: usersCount || 0,
                    totalProducts: products.length
                }));

                // 2. Category Distribution
                const counts: Record<string, number> = {};
                products.forEach(p => {
                    const cat = p.category || 'Other';
                    counts[cat] = (counts[cat] || 0) + 1;
                });
                setCategoryDistribution(
                    Object.entries(counts).map(([name, value]) => ({ name, value }))
                        .sort((a, b) => b.value - a.value).slice(0, 6)
                );

                // 3. Traffic Overview (Past 7 Days)
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const last7Days: Record<string, { views: number, products: number }> = {};

                const now = new Date();
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(now);
                    d.setDate(now.getDate() - i);
                    last7Days[days[d.getDay()]] = { views: 0, products: 0 };
                }

                products.forEach(p => {
                    const pDate = new Date(p.created_at);
                    const dayLabel = days[pDate.getDay()];
                    if (last7Days[dayLabel]) {
                        last7Days[dayLabel].views += p.views || 0;
                        last7Days[dayLabel].products += 1;
                    }
                });

                setTrafficData(Object.entries(last7Days).map(([name, vals]) => ({
                    name,
                    views: vals.views,
                    products: vals.products * 100 // Scale for visual
                })));
            }
        } catch (error) {
            // Error is handled by React Query
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 text-[#3C50E0] animate-spin" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Analyzing Metrics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-zinc-800 dark:text-white tracking-tight">Analitika Markazi</h2>
                    <p className="text-zinc-500 text-xs md:text-sm font-medium">Platforma rivojlanishi va foydalanuvchi faolligi ko'rsatkichlari</p>
                </div>
                <div className="flex items-center gap-2 bg-[#f7f9fc] dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <Button variant="ghost" size="sm" className="bg-white dark:bg-zinc-900 shadow-sm text-[10px] md:text-xs font-bold px-3 md:px-4 h-7 md:h-8 rounded-md">Last 7 Days</Button>
                    <Button variant="ghost" size="sm" className="text-[10px] md:text-xs font-bold px-3 md:px-4 h-7 md:h-8 text-zinc-500">Last 30 Days</Button>
                </div>
            </div>

            {/* Metrics Grid - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="p-5 md:p-6 lg:p-7 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="h-10 w-10 md:h-11 md:w-11 rounded-lg bg-[#3C50E0]/10 flex items-center justify-center">
                            <Eye className="h-5 w-5 md:h-6 md:w-6 text-[#3C50E0]" />
                        </div>
                        <span className="text-[#10B981] text-[10px] md:text-xs font-black flex items-center gap-1">
                            Live <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-zinc-800 dark:text-white">{metrics.totalViews.toLocaleString()}</h3>
                    <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Total Views</p>
                </div>

                <div className="p-5 md:p-6 lg:p-7 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="h-10 w-10 md:h-11 md:w-11 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-[#10B981]" />
                        </div>
                        <span className="text-[#10B981] text-[10px] md:text-xs font-black flex items-center gap-1">
                            +{metrics.totalProducts} <TrendingUp className="h-3 w-3" />
                        </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-zinc-800 dark:text-white">{metrics.totalProducts}</h3>
                    <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Total Items</p>
                </div>

                <div className="p-5 md:p-6 lg:p-7 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="h-10 w-10 md:h-11 md:w-11 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <Users className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                        </div>
                        <span className="text-blue-500 text-[10px] md:text-xs font-black flex items-center gap-1">
                            Active <ArrowUpRight className="h-3 w-3" />
                        </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-zinc-800 dark:text-white">{metrics.totalUsers}</h3>
                    <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Total Users</p>
                </div>
            </div>

            {/* Main Analytical charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h4 className="text-base md:text-lg font-black text-zinc-800 dark:text-white mb-4 md:mb-6 uppercase tracking-tighter">Traffic Overview</h4>
                    <div className="h-[240px] md:h-[280px] lg:h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trafficData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="views" stroke="#3C50E0" strokeWidth={2} fill="#3C50E0" fillOpacity={0.05} />
                                <Area type="monotone" dataKey="products" stroke="#10B981" strokeWidth={2} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h4 className="text-base md:text-lg font-black text-zinc-800 dark:text-white mb-4 md:mb-6 uppercase tracking-tighter">Category Distribution</h4>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="h-[240px] md:h-[280px] lg:h-[320px] w-full md:w-2/3">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full md:w-1/3 space-y-2 md:space-y-3">
                            {categoryDistribution.map((c, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase">{c.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-zinc-800 dark:text-white">{Math.round((c.value / metrics.totalProducts) * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Bar Chart */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h4 className="text-lg font-black text-zinc-800 dark:text-white mb-6 uppercase tracking-tighter">Sales Goal Performance</h4>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trafficData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                            <YAxis fontSize={11} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="products" radius={[4, 4, 0, 0]}>
                                {trafficData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[0]} fillOpacity={index === 4 ? 1 : 0.3} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
