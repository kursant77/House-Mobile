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

const data = [
    { name: 'Mon', views: 4000, products: 2400 },
    { name: 'Tue', views: 3000, products: 1398 },
    { name: 'Wed', views: 5000, products: 9800 },
    { name: 'Thu', views: 2780, products: 3908 },
    { name: 'Fri', views: 1890, products: 4800 },
    { name: 'Sat', views: 2390, products: 3800 },
    { name: 'Sun', views: 3490, products: 4300 },
];

const categoryData = [
    { name: 'Phones', value: 400 },
    { name: 'Laptops', value: 300 },
    { name: 'Audio', value: 300 },
    { name: 'Watches', value: 200 },
    { name: 'Accessories', value: 150 },
];

export default function Analytics() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => setLoading(false), 1000);
    }, []);

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 text-[#3C50E0] animate-spin" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Analyzing Metrics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-zinc-800 dark:text-white tracking-tight">Analitika Markazi</h2>
                    <p className="text-zinc-500 text-sm font-medium">Platforma rivojlanishi va foydalanuvchi faolligi ko'rsatkichlari</p>
                </div>
                <div className="flex items-center gap-2 bg-[#f7f9fc] dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <Button variant="ghost" size="sm" className="bg-white dark:bg-zinc-900 shadow-sm text-xs font-bold px-4 h-8 rounded-md">Last 7 Days</Button>
                    <Button variant="ghost" size="sm" className="text-xs font-bold px-4 h-8 text-zinc-500">Last 30 Days</Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-lg bg-[#3C50E0]/10 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-[#3C50E0]" />
                        </div>
                        <span className="text-[#10B981] text-xs font-black flex items-center gap-1">
                            +12% <ArrowUpRight className="h-3 w-3" />
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-zinc-800 dark:text-white">85.4%</h3>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Conversion Rate</p>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-[#10B981]" />
                        </div>
                        <span className="text-[#10B981] text-xs font-black flex items-center gap-1">
                            +5.2% <ArrowUpRight className="h-3 w-3" />
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-zinc-800 dark:text-white">12,450</h3>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Average Session</p>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-orange-500" />
                        </div>
                        <span className="text-red-500 text-xs font-black flex items-center gap-1">
                            -2.4% <ArrowDownRight className="h-3 w-3" />
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-zinc-800 dark:text-white">4,289</h3>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">New Subscribers</p>
                </div>
            </div>

            {/* Main Analytical charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h4 className="text-lg font-black text-zinc-800 dark:text-white mb-6 uppercase tracking-tighter">Traffic Overview</h4>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                                <YAxis fontSize={11} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="views" stroke="#3C50E0" strokeWidth={3} fill="#3C50E0" fillOpacity={0.05} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h4 className="text-lg font-black text-zinc-800 dark:text-white mb-6 uppercase tracking-tighter">Category Distribution</h4>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="w-1/3 space-y-3">
                            {categoryData.map((c, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{c.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-zinc-800 dark:text-white">{Math.round((c.value / 1350) * 100)}%</span>
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
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                            <YAxis fontSize={11} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="products" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
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
