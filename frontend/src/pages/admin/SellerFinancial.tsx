import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import {
    DollarSign,
    Loader2,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    Download,
    Wallet,
    AlertCircle,
    Info,
    Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatPriceNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Transaction {
    id: string;
    order_id: string;
    amount: number;
    commission: number;
    net_amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    created_at: string;
    order_number?: string;
    customer_name?: string;
}

interface EarningsData {
    date: string;
    earnings: number;
    commission: number;
}

const PLATFORM_COMMISSION_RATE = 0.10; // 10% commission

export default function SellerFinancial() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
    const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

    const [stats, setStats] = useState({
        totalEarnings: 0,
        availableBalance: 0,
        pendingBalance: 0,
        totalWithdrawn: 0,
        totalCommission: 0,
        thisMonthEarnings: 0,
    });

    useEffect(() => {
        if (!user || (user.role !== 'blogger' && user.role !== 'super_admin' && user.role !== 'seller')) {
            navigate("/");
            return;
        }

        fetchFinancialData();
    }, [user, navigate, selectedPeriod]);

    const fetchFinancialData = async () => {
        try {
            setLoading(true);

            // Calculate date range
            const now = new Date();
            let startDate: Date;
            if (selectedPeriod === '7d') {
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            } else if (selectedPeriod === '30d') {
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            } else if (selectedPeriod === '90d') {
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            } else {
                startDate = new Date(0); // All time
            }

            // 1. Fetch seller's products
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id')
                .eq('seller_id', user!.id);

            if (productsError) throw productsError;

            const productIds = products?.map((p: any) => p.id) || [];

            if (productIds.length === 0) {
                setStats({
                    totalEarnings: 0,
                    availableBalance: 0,
                    pendingBalance: 0,
                    totalWithdrawn: 0,
                    totalCommission: 0,
                    thisMonthEarnings: 0,
                });
                setTransactions([]);
                setEarningsData([]);
                setLoading(false);
                return;
            }

            // 2. Fetch order items
            const { data: orderItems, error: orderItemsError } = await supabase
                .from('order_items')
                .select('order_id, price, quantity')
                .in('product_id', productIds);

            if (orderItemsError) throw orderItemsError;

            const orderIds = Array.from(new Set(orderItems?.map((oi: any) => oi.order_id) || []));

            // 3. Fetch orders
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .in('id', orderIds)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // 4. Calculate transactions
            const transactionsList: Transaction[] = [];
            let totalEarnings = 0;
            let totalCommission = 0;
            let availableBalance = 0;
            let pendingBalance = 0;

            orders?.forEach((order: any) => {
                const orderRevenue = orderItems
                    ?.filter((oi: any) => oi.order_id === order.id)
                    .reduce((acc: number, curr: any) => acc + (Number(curr.price) * curr.quantity), 0) || 0;

                const commission = orderRevenue * PLATFORM_COMMISSION_RATE;
                const netAmount = orderRevenue - commission;

                let status: Transaction['status'] = 'pending';
                if (order.status === 'delivered') {
                    status = 'completed';
                    availableBalance += netAmount;
                } else if (order.status === 'cancelled') {
                    status = 'cancelled';
                } else {
                    pendingBalance += netAmount;
                }

                if (order.status !== 'cancelled') {
                    totalEarnings += orderRevenue;
                    totalCommission += commission;
                }

                transactionsList.push({
                    id: order.id,
                    order_id: order.id,
                    amount: orderRevenue,
                    commission,
                    net_amount: netAmount,
                    status,
                    created_at: order.created_at,
                    order_number: order.order_number,
                    customer_name: order.customer_name,
                });
            });

            // Filter transactions by period
            const filteredTransactions = selectedPeriod === 'all'
                ? transactionsList
                : transactionsList.filter(t => new Date(t.created_at) >= startDate);

            setTransactions(filteredTransactions);

            // Calculate this month earnings
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const thisMonthEarnings = transactionsList
                .filter(t => new Date(t.created_at) >= thisMonthStart && t.status !== 'cancelled')
                .reduce((acc, curr) => acc + curr.amount, 0);

            // Fetch withdrawals
            const { data: withdrawals } = await supabase
                .from('withdrawals')
                .select('amount, status')
                .eq('seller_id', user!.id);

            const totalWithdrawn = (withdrawals || [])
                .filter(w => w.status === 'completed')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            setStats({
                totalEarnings,
                availableBalance: availableBalance - totalWithdrawn,
                pendingBalance,
                totalWithdrawn,
                totalCommission,
                thisMonthEarnings,
            });

            // 5. Generate earnings chart data
            const earningsMap = new Map<string, { earnings: number; commission: number }>();
            const daysInPeriod = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 30;

            for (let i = 0; i < daysInPeriod; i++) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dateKey = date.toISOString().split('T')[0];
                earningsMap.set(dateKey, { earnings: 0, commission: 0 });
            }

            filteredTransactions.forEach(transaction => {
                if (transaction.status !== 'cancelled') {
                    const dateKey = new Date(transaction.created_at).toISOString().split('T')[0];
                    if (earningsMap.has(dateKey)) {
                        const current = earningsMap.get(dateKey)!;
                        earningsMap.set(dateKey, {
                            earnings: current.earnings + transaction.net_amount,
                            commission: current.commission + transaction.commission,
                        });
                    }
                }
            });

            const chartData: EarningsData[] = Array.from(earningsMap.entries())
                .map(([date, data]) => ({
                    date: new Date(date).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
                    earnings: data.earnings,
                    commission: data.commission,
                }))
                .reverse();

            setEarningsData(chartData);

        } catch (error) {
            console.error("Error fetching financial data:", error);
            toast.error("Moliyaviy ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const requestWithdrawal = async () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 100000) {
            toast.error("Minimal summa: 100,000 UZS");
            return;
        }
        if (amount > stats.availableBalance) {
            toast.error("Yetarli mablag' yo'q");
            return;
        }

        try {
            const { error } = await supabase
                .from('withdrawals')
                .insert([{
                    seller_id: user!.id,
                    amount: amount,
                    status: 'pending',
                }]);

            if (error) throw error;

            toast.success("To'lov so'rovi muvaffaqiyatli yuborildi. 3-5 ish kunida ko'rib chiqiladi.");
            setWithdrawDialogOpen(false);
            setWithdrawAmount("");
            fetchFinancialData();
        } catch (error) {
            console.error("Error requesting withdrawal:", error);
            toast.error("Xatolik yuz berdi. Iltimos keyinroq qayta urinib ko'ring.");
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-background via-background to-primary/5">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-semibold animate-pulse">Moliyaviy ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24 md:pb-12 pt-20">
            <Helmet>
                <title>Moliya va To'lovlar - House Mobile</title>
            </Helmet>

            <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Moliya va To'lovlar
                        </h1>
                        <p className="text-muted-foreground mt-1">Daromadlaringizni boshqaring va chiqarib oling</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)} className="w-auto">
                            <TabsList className="bg-muted/50">
                                <TabsTrigger value="7d" className="text-xs">7 kun</TabsTrigger>
                                <TabsTrigger value="30d" className="text-xs">30 kun</TabsTrigger>
                                <TabsTrigger value="90d" className="text-xs">90 kun</TabsTrigger>
                                <TabsTrigger value="all" className="text-xs">Barchasi</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button variant="outline" className="rounded-lg font-semibold text-sm">
                            <Download className="mr-2 h-4 w-4" />
                            Hisobot
                        </Button>
                    </div>
                </div>

                {/* Info Alert */}
                <Alert className="mb-6 border-primary/20 bg-primary/5">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary font-bold">Platforma komissiyasi</AlertTitle>
                    <AlertDescription>
                        Har bir sotuvdan {(PLATFORM_COMMISSION_RATE * 100).toFixed(0)}% platforma komissiyasi ushlab qolinadi.
                        Yetkazilgan buyurtmalar uchun to'lov 3-5 ish kunida mavjud bo'ladi.
                    </AlertDescription>
                </Alert>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <Card className="border-l-4 border-l-emerald-500 shadow-lg col-span-1 sm:col-span-2 lg:col-span-1">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <Wallet className="h-6 w-6 text-emerald-500" />
                                </div>
                                <Button
                                    size="sm"
                                    className="rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => setWithdrawDialogOpen(true)}
                                    disabled={stats.availableBalance <= 0}
                                >
                                    <DollarSign className="mr-1 h-4 w-4" />
                                    Chiqarish
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-3xl font-black mb-1">
                                {formatPriceNumber(stats.availableBalance)} <span className="text-base font-normal text-muted-foreground">UZS</span>
                            </h3>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Mavjud balans</p>
                            <Progress value={(stats.availableBalance / (stats.totalEarnings || 1)) * 100} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">
                                {formatPriceNumber(stats.pendingBalance)} UZS kutilmoqda
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 shadow-lg">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-blue-500" />
                                </div>
                                <Badge variant="outline" className="border-blue-500/50 text-blue-600 bg-blue-500/10">
                                    Oy
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-3xl font-black mb-1">
                                {formatPriceNumber(stats.thisMonthEarnings)} <span className="text-base font-normal text-muted-foreground">UZS</span>
                            </h3>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bu oy daromadi</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-lg">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <DollarSign className="h-6 w-6 text-purple-500" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-3xl font-black mb-1">
                                {formatPriceNumber(stats.totalEarnings)} <span className="text-base font-normal text-muted-foreground">UZS</span>
                            </h3>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jami daromad</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <Card className="shadow-md">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-black">{formatPriceNumber(stats.pendingBalance)}</p>
                                    <p className="text-xs text-muted-foreground font-semibold">Kutilayotgan to'lov</p>
                                </div>
                                <Clock className="h-8 w-8 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-black">{formatPriceNumber(stats.totalCommission)}</p>
                                    <p className="text-xs text-muted-foreground font-semibold">Jami komissiya</p>
                                </div>
                                <Percent className="h-8 w-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-black">{formatPriceNumber(stats.totalWithdrawn)}</p>
                                    <p className="text-xs text-muted-foreground font-semibold">Chiqarilgan</p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Earnings Chart */}
                <Card className="shadow-lg mb-8">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Daromad grafigi</CardTitle>
                        <CardDescription>
                            {selectedPeriod === 'all' ? 'Barcha vaqt' : `So'nggi ${selectedPeriod === '7d' ? '7' : selectedPeriod === '30d' ? '30' : '90'} kunlik`} daromadingiz
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={earningsData}>
                                    <defs>
                                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
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
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            backgroundColor: 'hsl(var(--card))',
                                        }}
                                        formatter={(value: number, name: string) => [
                                            `${formatPriceNumber(value)} UZS`,
                                            name === 'earnings' ? 'Sof daromad' : 'Komissiya'
                                        ]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="earnings"
                                        stroke="#10B981"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#colorEarnings)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="commission"
                                        stroke="#EF4444"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#colorCommission)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Transactions Table */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Tranzaksiyalar tarixi</CardTitle>
                        <CardDescription>Barcha buyurtmalar va to'lovlar</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {transactions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Buyurtma</TableHead>
                                            <TableHead>Mijoz</TableHead>
                                            <TableHead>Summa</TableHead>
                                            <TableHead>Komissiya</TableHead>
                                            <TableHead>Sof summa</TableHead>
                                            <TableHead>Holat</TableHead>
                                            <TableHead>Sana</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((transaction) => (
                                            <TableRow key={transaction.id} className="hover:bg-muted/50">
                                                <TableCell className="font-mono text-sm font-semibold">
                                                    #{transaction.order_number}
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-semibold">{transaction.customer_name || 'Unknown'}</p>
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatPriceNumber(transaction.amount)} UZS
                                                </TableCell>
                                                <TableCell className="text-red-600 font-semibold">
                                                    -{formatPriceNumber(transaction.commission)} UZS
                                                </TableCell>
                                                <TableCell className="font-bold text-emerald-600">
                                                    {formatPriceNumber(transaction.net_amount)} UZS
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.status === 'completed' ? (
                                                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 bg-emerald-500/10 gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            To'langan
                                                        </Badge>
                                                    ) : transaction.status === 'cancelled' ? (
                                                        <Badge variant="outline" className="border-red-500/50 text-red-600 bg-red-500/10 gap-1">
                                                            <XCircle className="h-3 w-3" />
                                                            Bekor qilindi
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-500/10 gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Kutilmoqda
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(transaction.created_at).toLocaleDateString('uz-UZ')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-bold mb-2">Tranzaksiyalar yo'q</h3>
                                <p className="text-sm text-muted-foreground">
                                    Hozircha hech qanday moliyaviy operatsiya amalga oshirilmagan
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Withdrawal Dialog */}
            <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-primary" />
                            Pulni chiqarish
                        </DialogTitle>
                        <DialogDescription>
                            Mavjud balansingizdan pul chiqarib olishingiz mumkin. To'lov 3-5 ish kunida amalga oshiriladi.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Mavjud balans</Label>
                            <p className="text-2xl font-black text-emerald-600">
                                {formatPriceNumber(stats.availableBalance)} UZS
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="amount">Chiqariladigan summa</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="Summani kiriting"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Minimal summa: 100,000 UZS
                            </p>
                        </div>

                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                                Bank hisobingizga to'lov 3-5 ish kunida o'tkaziladi. Komissiya: 0 UZS
                            </AlertDescription>
                        </Alert>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
                            Bekor qilish
                        </Button>
                        <Button onClick={requestWithdrawal} className="bg-emerald-600 hover:bg-emerald-700">
                            <DollarSign className="mr-2 h-4 w-4" />
                            So'rov yuborish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
