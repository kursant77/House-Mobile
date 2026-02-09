import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
    MessageCircle,
    ChevronLeft,
    CheckCircle2,
    ArrowRight,
    Bell,
    ShieldCheck,
    Smartphone,
    ExternalLink,
    Zap,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { telegramService } from "@/services/api/telegram";
import { TelegramUser } from "@/types/marketing";

export default function TelegramHub() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await telegramService.getTelegramConnection();
            setTelegramUser(data);
        } catch (error) {
            console.error("Error loading telegram data:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleConnect = async () => {
        try {
            const link = await telegramService.getConnectLink();
            window.open(link, '_blank');
            toast.info("Bot ochilmoqda...");
        } catch (error) {
            toast.error("Telegramga ulanishda xatolik");
        }
    };

    const features = [
        {
            icon: Bell,
            title: "Tezkor bildirishnomalar",
            description: "Buyurtma holati o'zgarganda xabar olasiz",
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            icon: ShieldCheck,
            title: "Xavfsiz ulanish",
            description: "Hisobingiz xavfsizligi doimiy nazoratda",
            color: "text-green-500",
            bg: "bg-green-500/10"
        },
        {
            icon: Smartphone,
            title: "Oson boshqaruv",
            description: "Bot orqali sozlamalarni o'zgartiring",
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
        {
            icon: Zap,
            title: "Cheksiz imkoniyat",
            description: "Maxsus takliflar va yangiliklardan boxabar bo'ling",
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground animate-pulse">Yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-full shrink-0"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-lg font-bold">Telegram Hub</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-[#229ED9] to-[#0088cc] text-white shadow-xl shadow-[#229ED9]/20">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <MessageCircle size={120} />
                        </div>
                        <CardHeader className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4">
                                <MessageCircle className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-black">Telegram Integration</CardTitle>
                            <CardDescription className="text-white/80 text-base">
                                House Mobile xizmatlarini Telegram bot orqali boshqaring va tezkor xabarlarni qabul qiling.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            {telegramUser ? (
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                                    <div className="p-2 bg-green-500 rounded-full">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">Botga ulandingiz</p>
                                        <p className="text-xs text-white/60">@{telegramUser.telegram_username || 'user'}</p>
                                    </div>
                                    <Button disabled variant="outline" className="bg-white/10 border-white/20 text-white cursor-default">
                                        Ulandi
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleConnect}
                                    className="w-full bg-white text-[#229ED9] hover:bg-white/90 font-bold py-6 rounded-2xl group"
                                >
                                    Botga ulanish
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Integration Steps */}
                {!telegramUser && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="space-y-4"
                    >
                        <h3 className="text-lg font-bold px-1">Qanday ulash mumkin?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="border-border bg-card/50">
                                <CardHeader className="p-4 flex flex-row items-center gap-3 space-y-0">
                                    <div className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center font-bold">1</div>
                                    <CardTitle className="text-sm">Ulanish tugmasini bosing</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                                    Sizni avtomatik tarzda House Mobile botiga yo'naltiramiz.
                                </CardContent>
                            </Card>
                            <Card className="border-border bg-card/50">
                                <CardHeader className="p-4 flex flex-row items-center gap-3 space-y-0">
                                    <div className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center font-bold">2</div>
                                    <CardTitle className="text-sm">Start va Telefon raqam</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                                    Botga kirib "Start" tugmasini va "Telefon raqamni ulashish" tugmasini bosing.
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                )}

                {/* Features Grid */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold px-1">Imkoniyatlar</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index + 0.3, duration: 0.5 }}
                            >
                                <Card className="border-none bg-muted/30 hover:bg-muted/50 transition-colors cursor-default">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${feature.bg} ${feature.color}`}>
                                            <feature.icon size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm">{feature.title}</h4>
                                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Help Section */}
                <Card className="border-border bg-primary/5">
                    <CardContent className="p-4 flex items-start gap-4">
                        <div className="mt-1 text-primary">
                            <Info size={20} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-primary">Savollaringiz bormi?</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Agar ulanishda muammoga duch kelsangiz, yordam markazimiz bilan bog'laning.
                            </p>
                            <Button
                                variant="link"
                                className="p-0 h-auto text-xs text-primary font-bold hover:no-underline"
                                onClick={() => window.open('https://t.me/house_mobile_support', '_blank')}
                            >
                                Qo'llab-quvvatlash botiga o'tish
                                <ExternalLink className="ml-1 w-3 h-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
