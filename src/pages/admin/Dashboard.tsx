import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { Users, ShoppingBag, Clapperboard, Eye, TrendingUp, Activity, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
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

const COLORS = ['#3C50E0', '#80CAEE', '#F0950C', '#E11D48', '#10B981', '#6366F1', '#F59E0B'];

export default function Dashboard() {
    const [stats, setStats] = useState({
        users: 0,
        products: 0,
        reels: 0,
        views: 0,
        loading: true
    });

    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch counts - Correcting queries to avoid 400 errors
                const [
                    { count: usersCount },
                    { count: productsCount },
                    { count: reelsCount },
                    { data: productsData }
                ] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('products').select('*', { count: 'exact', head: true }),
                    // Reels are products with video media
                    supabase.from('product_media').select('id', { count: 'exact', head: true }).eq('type', 'video'),
                    supabase.from('products').select('views')
                ]);

                const totalViews = productsData?.reduce((acc, curr) => acc + (curr.views || 0), 0) || 0;

                setStats({
                    users: usersCount || 0,
                    products: productsCount || 0,
                    reels: reelsCount || 0,
                    views: totalViews,
                    loading: false
                });

                // Fetch recent activity - Using 'title' instead of 'name' as per the schema logic
                const { data: latestProducts } = await supabase
                    .from('products')
                    .select('*, profiles(full_name, avatar_url)')
                    .order('id', { ascending: false })
                    .limit(5);

                setRecentActivity(latestProducts || []);

            } catch (error) {
                console.error("Dashboard data fetch failed:", error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchDashboardData();
    }, []);

    const data = [
        { name: 'Sep', total: 4000, active: 2400 },
        { name: 'Oct', total: 3000, active: 1398 },
        { name: 'Nov', total: 5000, active: 3800 },
        { name: 'Dec', total: 2780, active: 3908 },
        { name: 'Jan', total: 4890, active: 4800 },
        { name: 'Feb', total: 2390, active: 3800 },
        { name: 'Mar', total: 3490, active: 4300 },
    ];

    if (stats.loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4 bg-[#f1f5f9] dark:bg-zinc-950 rounded-3xl">
                <Loader2 className="h-12 w-12 text-[#3C50E0] animate-spin" />
                <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs">Loading Analytics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Grid - TailAdmin Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
                {[
                    { label: 'Total Views', value: stats.views, icon: Eye, color: '#3C50E0', trend: '0.43%', up: true },
                    { label: 'Total Products', value: stats.products, icon: ShoppingBag, color: '#10B981', trend: '4.35%', up: true },
                    { label: 'Total Users', value: stats.users, icon: Users, color: '#FFB81C', trend: '2.59%', up: true },
                    { label: 'Total Reels', value: stats.reels, icon: Clapperboard, color: '#E11D48', trend: '0.95%', up: false },
                ].map((card, i) => (
                    <div key={i} className="rounded-lg border border-zinc-200 bg-white py-6 px-7.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-transform hover:scale-[1.02] duration-300">
                        <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-[#f1f5f9] dark:bg-zinc-800">
                            <card.icon className="h-6 w-6" style={{ color: card.color }} />
                        </div>

                        <div className="mt-4 flex items-end justify-between">
                            <div>
                                <h4 className="text-2xl font-black text-zinc-800 dark:text-white">
                                    {card.value >= 1000 ? `${(card.value / 1000).toFixed(1)}K` : card.value}
                                </h4>
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{card.label}</span>
                            </div>

                            <span className={cn(
                                "flex items-center gap-1 text-xs font-black",
                                card.up ? "text-[#10B981]" : "text-[#E11D48]"
                            )}>
                                {card.trend}
                                {card.up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-12 2xl:gap-7.5">
                {/* Revenue/Views Chart */}
                <div className="col-span-12 rounded-lg border border-zinc-200 bg-white px-5 pt-7.5 pb-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 xl:col-span-8">
                    <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
                        <div className="flex w-full flex-wrap gap-3 sm:gap-5">
                            <div className="flex min-w-47.5">
                                <span className="mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-[#3C50E0]">
                                    <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-[#3C50E0]"></span>
                                </span>
                                <div className="w-full">
                                    <p className="font-black text-[#3C50E0]">Total Views</p>
                                    <p className="text-sm font-medium text-zinc-500">12.04.2024 - 12.11.2024</p>
                                </div>
                            </div>
                            <div className="flex min-w-47.5">
                                <span className="mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-[#80CAEE]">
                                    <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-[#80CAEE]"></span>
                                </span>
                                <div className="w-full">
                                    <p className="font-black text-[#80CAEE]">Active Users</p>
                                    <p className="text-sm font-medium text-zinc-500">12.04.2024 - 12.11.2024</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3C50E0" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3C50E0" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#3C50E0" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                <Area type="monotone" dataKey="active" stroke="#80CAEE" strokeWidth={3} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Profit/Category Chart */}
                <div className="col-span-12 rounded-lg border border-zinc-200 bg-white p-7.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 xl:col-span-4">
                    <div className="mb-4 justify-between gap-4 sm:flex">
                        <div>
                            <h4 className="text-xl font-black text-black dark:text-white leading-none">Category Profit</h4>
                        </div>
                    </div>

                    <div className="h-[250px] w-full mt-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.slice(0, 5)}>
                                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-[#3C50E0]"></span>
                                <span className="text-sm font-bold text-zinc-500 uppercase tracking-tighter">Phones</span>
                            </div>
                            <span className="text-sm font-black text-black dark:text-white">45%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-[#80CAEE]"></span>
                                <span className="text-sm font-bold text-zinc-500 uppercase tracking-tighter">Laptops</span>
                            </div>
                            <span className="text-sm font-black text-black dark:text-white">30%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-[#F0950C]"></span>
                                <span className="text-sm font-bold text-zinc-500 uppercase tracking-tighter">Other</span>
                            </div>
                            <span className="text-sm font-black text-black dark:text-white">25%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Products Table */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter">Recent Activities</h4>
                    <Link to="/admin/products">
                        <Button variant="outline" className="text-xs font-black uppercase tracking-widest px-6 h-10 border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-[#3C50E0] hover:text-white transition-all">
                            View All
                        </Button>
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#f7f9fc] dark:bg-zinc-800/50">
                                <th className="py-4 px-4 text-left text-xs font-black text-zinc-500 uppercase tracking-widest rounded-l-lg">User</th>
                                <th className="py-4 px-4 text-left text-xs font-black text-zinc-500 uppercase tracking-widest">Action</th>
                                <th className="py-4 px-4 text-left text-xs font-black text-zinc-500 uppercase tracking-widest">Date</th>
                                <th className="py-4 px-4 text-left text-xs font-black text-zinc-500 uppercase tracking-widest rounded-r-lg">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivity.map((item) => (
                                <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full border border-zinc-200 dark:border-zinc-700 p-0.5 overflow-hidden">
                                                {item.profiles?.avatar_url ? (
                                                    <img src={item.profiles.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                                        {item.profiles?.full_name?.charAt(0) || "U"}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-zinc-800 dark:text-white">{item.profiles?.full_name || "Unknown"}</p>
                                                <p className="text-[10px] text-zinc-500">ID: {item.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                        Uploaded new product: <span className="font-black text-[#3C50E0]">"{item.title}"</span>
                                    </td>
                                    <td className="py-4 px-4 text-xs font-bold text-zinc-500">
                                        {new Date(item.created_at || Date.now()).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="inline-block px-3 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-[10px] font-black uppercase tracking-widest">Success</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
