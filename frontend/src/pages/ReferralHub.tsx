import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { referralService } from "@/services/api/referral";
import { featureFlagsService } from "@/services/api/featureFlags";
import { Referral, ReferralSettings } from "@/types/marketing";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Gift,
    Users,
    DollarSign,
    Share2,
    Copy,
    Check,
    Clock,
    ChevronLeft,
    Trophy,
    Sparkles,
    ArrowRight,
    TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatCurrency, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function ReferralHub() {
    useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isEnabled, setIsEnabled] = useState(true);
    const [referralCode, setReferralCode] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0,
        earnings: 0,
        referrals: [] as Referral[]
    });
    const [settings, setSettings] = useState<ReferralSettings | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const enabled = await featureFlagsService.isEnabled('referrals');
            setIsEnabled(enabled);

            if (!enabled) {
                setLoading(false);
                return;
            }

            const [code, link, referralStats, referralSettings] = await Promise.all([
                referralService.getMyReferralCode(),
                referralService.getReferralLink(),
                referralService.getMyReferralStats(),
                referralService.getSettings()
            ]);

            setReferralCode(code);
            setReferralLink(link);
            setStats(referralStats);
            setSettings(referralSettings);
        } catch (error) {
            console.error("Error loading referral data:", error);
            toast.error("Referal ma'lumotlarini yuklashda xato");
        } finally {
            setLoading(false);
        }
    }

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            toast.success("Havola nusxalandi!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Nusxalashda xato");
        }
    }

    async function shareLink() {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "House Mobile - Referal",
                    text: "House Mobile'ga qo'shiling va bonus oling!",
                    url: referralLink
                });
            } catch {
                // User cancelled or share failed
            }
        } else {
            copyLink();
        }
    }

    if (!isEnabled) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="max-w-md w-full border-none shadow-2xl">
                        <CardHeader className="text-center space-y-4">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                                <Gift className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <CardTitle className="text-2xl font-black">Referal tizimi vaqtincha o'chirilgan</CardTitle>
                            <CardDescription className="text-base text-balance">
                                Sizning qulayligingiz uchun tizimni yangilamoqdamiz. Tez orada qaytamiz!
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </motion.div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground animate-pulse font-medium">Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Immersive Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[150px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100" />
            </div>

            {/* Futuristic Header */}
            <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-2xl border-b border-white/5">
                <div className="max-w-screen-2xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="rounded-2xl shrink-0 bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <div className="space-y-0.5">
                            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic">Referral <span className="text-cyan-400">Hub</span></h1>
                            <p className="text-[10px] font-bold text-white/40 tracking-[0.3em] uppercase">House Mobile Ecosystem</p>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#050505] bg-zinc-800 flex items-center justify-center overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-[#050505] bg-indigo-600 flex items-center justify-center text-[10px] font-black">
                                +1.2k
                            </div>
                        </div>
                        <span className="text-xs font-bold text-white/60">Do'stlaringizga qo'shiling</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-screen-2xl mx-auto px-4 md:px-12 py-8 md:py-12 pb-32 md:pb-40 space-y-16 md:space-y-24">

                {/* Massive Hero Section */}
                <section className="grid grid-cols-1 xl:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        className="space-y-10"
                    >
                        <div className="inline-flex items-center gap-3 bg-indigo-600/10 backdrop-blur-xl border border-indigo-500/30 rounded-full px-6 py-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-300">Ultra Exclusive Program</span>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-[0.95] uppercase italic">
                                Taklif <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">qiling</span> va <br />
                                <span className="relative">
                                    yuting
                                    <div className="absolute -bottom-2 left-0 w-full h-3 bg-indigo-600/30 -rotate-1" />
                                </span>
                            </h2>
                            <p className="text-lg md:text-xl text-white/50 font-medium max-w-xl leading-relaxed">
                                House Mobile hamjamiyatiga do'stlaringizni taklif qiling va har bir muvaffaqiyatli xarid uchun katta bonuslarga ega bo'ling.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4 md:gap-8 items-center">
                            <div className="text-center">
                                <p className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-cyan-400">
                                    {settings?.reward_type === 'fixed'
                                        ? formatCurrency(settings.reward_value)
                                        : `${settings?.reward_value || 10}%`
                                    }
                                </p>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mt-2">Cashback Bonus</p>
                            </div>
                            <div className="h-16 md:h-20 w-px bg-white/10 hidden md:block mx-4" />
                            <div className="text-center">
                                <p className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white">
                                    {stats.total}
                                </p>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mt-2">Active Referrals</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-[3rem] blur-2xl opacity-20 animate-pulse" />
                        <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 md:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
                            <div className="space-y-12">
                                <div className="space-y-4 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40">Sizning unikal kodingiz</p>
                                    <div className="text-5xl md:text-6xl lg:text-7xl font-black tracking-[0.1em] text-white select-all italic drop-shadow-2xl">
                                        {referralCode}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Button
                                        onClick={shareLink}
                                        className="h-16 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg md:text-xl shadow-[0_20px_40px_rgba(79,70,229,0.3)] group transition-all"
                                    >
                                        <Share2 className="w-6 h-6 md:w-7 md:h-7 mr-3 md:mr-4 group-hover:rotate-12 transition-transform" />
                                        Share Now
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={copyLink}
                                        className="h-16 md:h-20 rounded-[1.5rem] md:rounded-[2rem] border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-lg md:text-xl backdrop-blur-md transition-all"
                                    >
                                        {copied ? <Check className="w-6 h-6 md:w-7 md:h-7 mr-3 md:mr-4 text-cyan-400" /> : <Copy className="w-6 h-6 md:w-7 md:h-7 mr-3 md:mr-4" />}
                                        {copied ? "Copied!" : "Copy Link"}
                                    </Button>
                                </div>
                            </div>

                            {/* Decorative background circle */}
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]" />
                        </Card>
                    </motion.div>
                </section>

                {/* Stats & Progress Section */}
                <section className="space-y-12 pt-0 md:pt-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">Statistika</h3>
                            <p className="text-sm md:text-white/40 font-medium max-w-sm">Dasturdagi rivojlanishingizni kuzatib boring va yangi marralarni zabt eting.</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 w-fit">
                            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-[10px] font-black whitespace-nowrap uppercase tracking-widest text-cyan-400/80">Jonli yangilanish</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: "Barcha do'stlar", value: stats.total, sub: "Registered users", icon: Users, color: "text-indigo-400" },
                            { label: "Kutilayotganlar", value: stats.pending, sub: "Process initiated", icon: Clock, color: "text-amber-400" },
                            { label: "Jami foyda", value: formatCurrency(stats.earnings), sub: "Total earnings", icon: DollarSign, color: "text-cyan-400" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                            >
                                <Card className="group relative overflow-hidden h-full border border-white/5 bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] p-8 md:p-10 hover:bg-white/[0.08] transition-all duration-500">
                                    <div className="relative z-10 space-y-4 md:space-y-5">
                                        <div className={cn("inline-flex p-4 rounded-2xl bg-white/5", stat.color)}>
                                            <stat.icon size={24} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter">{stat.value}</p>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{stat.label}</p>
                                                <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">{stat.sub}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Hover glow */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rotate-45 translate-x-16 -translate-y-16 group-hover:translate-x-12 group-hover:-translate-y-12 transition-transform duration-700" />
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Grid Layout for Steps and Team */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 lg:items-start pt-12">

                    {/* Steps - How it works */}
                    <div className="lg:col-span-3 space-y-12">
                        <div className="space-y-2">
                            <h3 className="text-4xl font-black tracking-tighter uppercase italic">Qanday ishlaydi?</h3>
                            <p className="text-white/40 font-medium">Barchasi juda oddiy, xuddi 1-2-3-4 kabi.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {[
                                { title: "Ulashish", desc: "Do'stlaringizga referal havolangizni yoki kodingizni yuboring", icon: Share2 },
                                { title: "Ro'yxatdan o'tish", desc: "Ular sizning havolangiz orqali House Mobile'da ro'yxatdan o'tishadi", icon: Users },
                                { title: "Xarid qilish", desc: `Kamida ${formatCurrency(settings?.min_purchase_amount || 50000)} lik xarid amalga oshirishsa bas`, icon: Gift },
                                { title: "Mukofotni olish", desc: "Sizning balansizga darhol bonuslar kelib tushadi", icon: Trophy }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + idx * 0.1 }}
                                    className="group flex gap-8 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all duration-500"
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-600/10 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                            <item.icon size={28} />
                                        </div>
                                        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#050505] border border-white/10 flex items-center justify-center text-[10px] font-black">
                                            0{idx + 1}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black tracking-tight">{item.title}</h4>
                                        <p className="text-white/40 font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Team List - Leaderboard style */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black tracking-tighter uppercase italic">Sizning Jamoangiz</h3>
                            <p className="text-sm text-white/40 font-medium">Barcha taklif qilingan a'zolar ro'yxati.</p>
                        </div>

                        <Card className="border border-white/5 bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
                            <Tabs defaultValue="all" className="w-full">
                                <TabsList className="w-full bg-white/5 h-16 p-2 gap-2 border-b border-white/5">
                                    <TabsTrigger value="all" className="flex-1 rounded-2xl font-black text-[10px] tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white">ALL</TabsTrigger>
                                    <TabsTrigger value="pending" className="flex-1 rounded-2xl font-black text-[10px] tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white">PROGRESS</TabsTrigger>
                                    <TabsTrigger value="completed" className="flex-1 rounded-2xl font-black text-[10px] tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white">REWARDED</TabsTrigger>
                                </TabsList>

                                <div className="p-6 h-[500px] overflow-y-auto scrollbar-hide">
                                    <TabsContent value="all" className="mt-0 focus-visible:ring-0">
                                        <ReferralList referrals={stats.referrals} />
                                    </TabsContent>
                                    <TabsContent value="pending" className="mt-0 focus-visible:ring-0">
                                        <ReferralList referrals={stats.referrals.filter(r => r.status === 'registered')} />
                                    </TabsContent>
                                    <TabsContent value="completed" className="mt-0 focus-visible:ring-0">
                                        <ReferralList referrals={stats.referrals.filter(r => r.status === 'completed')} />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </Card>
                    </div>
                </div>

                {/* Floating Info Bottom Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <Card className="relative overflow-hidden border border-white/10 bg-gradient-to-r from-indigo-900/40 via-indigo-600/20 to-transparent backdrop-blur-3xl rounded-[2rem] p-8 md:p-12">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full -mr-32 -mt-32 blur-[100px]" />
                        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10 text-center md:text-left">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-[1.5rem] flex items-center justify-center text-indigo-400 shrink-0 border border-white/10 shadow-2xl">
                                <TrendingUp size={32} />
                            </div>
                            <div className="flex-1 space-y-2 md:space-y-3">
                                <h4 className="text-2xl md:text-4xl font-black tracking-tighter leading-none uppercase">CHEKSIZ IMKONIYATLAR!</h4>
                                <p className="text-sm md:text-lg text-white/50 font-medium leading-relaxed">Do'stlaringiz soni cheklanmagan. Qancha ko'p odam qo'shilsa, shuncha ko'p daromad olasiz. Bugundan boshlang!</p>
                            </div>
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-14 md:h-16 px-8 md:px-10 rounded-[1.2rem] border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-black text-base md:text-lg hover:bg-indigo-500 hover:text-white transition-all sm:w-auto w-full"
                            >
                                Learn More
                                <ArrowRight className="ml-3 w-5 h-5" />
                            </Button>
                        </div>
                    </Card>
                </motion.div>

            </main>

            {/* Global background noise overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-40 mix-blend-overlay z-[100]" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
        </div>
    );
}

function ReferralList({ referrals }: { referrals: Referral[] }) {
    if (referrals.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-6"
            >
                <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center opacity-20">
                    <Users size={40} />
                </div>
                <div className="space-y-1">
                    <p className="text-xl font-bold text-white/40 italic">Hali a'zolar yo'q</p>
                    <p className="text-xs font-medium text-white/20 uppercase tracking-widest">Do'stlaringizni taklif qilishni boshlang!</p>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            {referrals.map((referral, idx) => (
                <motion.div
                    key={referral.id || idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                >
                    <div className="group relative flex items-center gap-5 p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-indigo-500/20 transition-all duration-300">
                        <div className="relative">
                            <Avatar className="h-14 w-14 border-2 border-indigo-500/20 ring-4 ring-black/20">
                                <AvatarImage src={referral.referred_user?.avatar_url} />
                                <AvatarFallback className="bg-zinc-800 text-sm font-black text-indigo-400">
                                    {referral.referred_user?.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                            </Avatar>
                            {referral.status === 'completed' && (
                                <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1 shadow-lg shadow-cyan-500/40">
                                    <Check className="w-3 h-3 text-[#050505] font-black" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h5 className="font-black text-base truncate tracking-tight text-white/90 group-hover:text-cyan-400 transition-colors">
                                {referral.referred_user?.full_name || "New Explorer"}
                            </h5>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                Joined {new Date(referral.created_at).toLocaleDateString('uz', { month: 'short', day: 'numeric' })}
                            </p>
                        </div>

                        <div className="text-right shrink-0">
                            {referral.status === 'completed' ? (
                                <div className="space-y-1">
                                    <div className="text-lg font-black text-cyan-400">
                                        +{formatCurrency(referral.reward_amount)}
                                    </div>
                                    <Badge variant="outline" className="text-[8px] font-black h-5 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 uppercase tracking-widest px-3">
                                        Rewarded
                                    </Badge>
                                </div>
                            ) : (
                                <Badge variant="outline" className="text-[8px] font-black h-5 bg-white/5 text-white/40 border-white/10 uppercase tracking-widest px-3">
                                    In Progress
                                </Badge>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
