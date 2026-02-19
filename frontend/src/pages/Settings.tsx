import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import {
    User,
    Lock,
    Bell,
    Moon,
    Database,
    Shield,
    HelpCircle,
    LogOut,
    ChevronRight,
    Smartphone,
    Languages,
    UserMinus,
    Trash2,
    ExternalLink,
    Info,
    ShoppingBag,
    Film,
    MessageCircle,
    DollarSign,
    RefreshCw,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCurrencyStore, POPULAR_CURRENCIES, getCurrencySymbol } from "@/store/currencyStore";


export default function Settings() {
    const { user, logout } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();

    // Local settings states
    const [notifications, setNotifications] = useState(true);
    const [biometrics, setBiometrics] = useState(false);
    const [language, setLanguage] = useState(() => localStorage.getItem("app-language") || "uz");

    // Dialog states
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [helpDialogOpen, setHelpDialogOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [telegramUser, setTelegramUser] = useState<any>(null);

    // Currency store
    const { selectedCurrency, setSelectedCurrency, fetchRates, rates, ratesLastFetched, isFetchingRates } = useCurrencyStore();
    const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
    const ratesDate = ratesLastFetched ? new Date(ratesLastFetched).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : null;

    useEffect(() => {
        // Load telegram connection status
        import("@/services/api/telegram").then(({ telegramService }) => {
            telegramService.getTelegramConnection().then(setTelegramUser);
        });
    }, []);

    const handleConnectTelegram = async () => {
        try {
            const { telegramService } = await import("@/services/api/telegram");
            const link = await telegramService.getConnectLink();
            window.open(link, '_blank');
        } catch (error) {
            toast.error("Telegramga ulanishda xatolik");
        }
    };

    useEffect(() => {
        localStorage.setItem("app-language", language);
    }, [language]);

    const queryClient = useQueryClient();

    const handleClearCache = () => {
        toast.promise(
            async () => {
                await new Promise((resolve) => setTimeout(resolve, 1500));
                // Clear React Query cache
                queryClient.clear();
                // Clear local storage (except auth which we might want to keep, but for "clear cache" we can be more aggressive or specific)
                const authSession = localStorage.getItem('sb-yymfscqmjnshytunrvms-auth-token');
                localStorage.clear();
                if (authSession) {
                    localStorage.setItem('sb-yymfscqmjnshytunrvms-auth-token', authSession);
                }
                sessionStorage.clear();
            },
            {
                loading: 'Kesh tozalanmoqda...',
                success: 'Kesh muvaffaqiyatli tozalandi',
                error: 'Xatolik yuz berdi',
            }
        );
    };

    const handleLogout = () => {
        logout();
        navigate("/auth");
        toast.success("Hisobdan chiqildi");
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Parollar mos kelmadi");
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast.success("Parol muvaffaqiyatli o'zgartirildi");
            setPasswordDialogOpen(false);
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error("Xatolik: " + error.message);
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const SettingItem = ({
        icon: Icon,
        label,
        description,
        onClick,
        rightElement,
        danger
    }: {
        icon: any,
        label: string,
        description?: string,
        onClick?: () => void,
        rightElement?: React.ReactNode,
        danger?: boolean
    }) => (
        <div
            onClick={onClick}
            className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors ${danger ? 'text-destructive' : ''}`}
        >
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${danger ? 'bg-destructive/10' : 'bg-primary/10'} `}>
                    <Icon className={`h-5 w-5 ${danger ? 'text-destructive' : 'text-primary'}`} />
                </div>
                <div>
                    <p className="font-medium text-sm">{label}</p>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
            </div>
            {rightElement !== undefined ? rightElement : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <h3 className="px-4 pt-6 pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {title}
        </h3>
    );

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-12">
            <div className="max-w-2xl mx-auto md:pt-8 md:px-4">
                <div className="px-4 py-8">
                    <h1 className="text-3xl font-black tracking-tight">Sozlamalar</h1>
                    <p className="text-muted-foreground">Ilovani o'zingizga moslashtiring</p>
                </div>

                {/* User Info Card */}
                {user && (
                    <div className="mx-4 mb-6 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback className="text-xl bg-primary text-primary-foreground font-bold">
                                    {user.name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h2 className="font-bold text-lg">{user.name}</h2>
                                    {(user.role === 'super_admin' || user.role === 'blogger') && (
                                        <VerifiedBadge size={14} />
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">@{user.username || 'user'}</p>
                                <div className="flex items-center mt-1">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase tracking-wider">
                                        {user.role === 'super_admin' ? 'Administrator' : user.role === 'blogger' ? 'Blogger' : 'Foydalanuvchi'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/profile")}>
                            <ExternalLink className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                )}

                <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border mx-4 md:mx-0">
                    {/* Account Section */}
                    <SectionHeader title="Hisob" />
                    <SettingItem
                        icon={User}
                        label="Profilni tahrirlash"
                        description="Ism, bio va ijtimoiy tarmoqlar"
                        onClick={() => navigate("/profile/edit")}
                    />

                    {/* Telegram Integration */}
                    <div onClick={() => navigate("/telegram")} className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-[#229ED9]/10">
                                <MessageCircle className="h-5 w-5 text-[#229ED9]" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Telegram Hub</p>
                                <p className="text-xs text-muted-foreground">
                                    {telegramUser ? `Ulandi: @${telegramUser.telegram_username || telegramUser.first_name}` : "Bot orqali akkauntni ulang"}
                                </p>
                            </div>
                        </div>
                        {telegramUser ? (
                            <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">Ulandiz</span>
                        ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                    <SettingItem
                        icon={Lock}
                        label="Xavfsizlik"
                        description="Parolni o'zgartirish va 2FA"
                        onClick={() => setPasswordDialogOpen(true)}
                    />
                    <SettingItem
                        icon={Shield}
                        label="Maxfiylik"
                        description="Hisob ko'rinishi va bloklanganlar"
                        onClick={() => navigate("/blocked")}
                    />

                    {/* App Settings Section */}
                    <SectionHeader title="Ilova sozlamalari" />

                    {/* Currency Setting */}
                    <div
                        onClick={() => { setCurrencyDialogOpen(true); if (Object.keys(rates).length === 0) fetchRates(); }}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <DollarSign className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Valyuta</p>
                                <p className="text-xs text-muted-foreground">
                                    {ratesDate ? `Yangilangan: ${ratesDate}` : "CBU kursi bo'yicha"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                                {selectedCurrency} {getCurrencySymbol(selectedCurrency)}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                    <SettingItem
                        icon={Moon}
                        label="Tungi rejim"
                        description="Mavzuni o'zgartirish"
                        rightElement={
                            <Switch
                                checked={theme === "dark"}
                                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                            />
                        }
                    />
                    <SettingItem
                        icon={Bell}
                        label="Bildirishnomalar"
                        description="Push bildirishnomalar"
                        rightElement={
                            <Switch
                                checked={notifications}
                                onCheckedChange={setNotifications}
                            />
                        }
                    />
                    <SettingItem
                        icon={Smartphone}
                        label="Biometriya"
                        description="FaceID yoki Barmoq izi"
                        rightElement={
                            <Switch
                                checked={biometrics}
                                onCheckedChange={setBiometrics}
                            />
                        }
                    />
                    <SettingItem
                        icon={Languages}
                        label="Til"
                        description="Ilova tilini tanlang"
                        rightElement={
                            <div className="flex items-center gap-1 text-xs font-bold text-primary">
                                {language === "uz" ? "O'zbekcha" : "English"}
                                <ChevronRight className="h-4 w-4" />
                            </div>
                        }
                        onClick={() => {
                            setLanguage(l => l === "uz" ? "en" : "uz");
                            toast.success(`Til ${language === "uz" ? "English" : "O'zbekcha"}ga o'zgartirildi`);
                        }}
                    />

                    {/* Storage Section */}
                    <SectionHeader title="Xotira va kesh" />
                    <SettingItem
                        icon={Database}
                        label="Keshni tozalash"
                        description="Ilova hajmini kamaytirish"
                        rightElement={<Trash2 className="h-4 w-4 text-muted-foreground" />}
                        onClick={handleClearCache}
                    />

                    {/* Partnership Section */}
                    <SectionHeader title="Hamkorlik" />
                    {user?.role !== 'seller' && user?.role !== 'super_admin' && (
                        <SettingItem
                            icon={ShoppingBag}
                            label="Sotuvchi bo'lish"
                            description="O'z mahsulotlaringizni platformamizda soting"
                            onClick={() => navigate("/apply/seller")}
                        />
                    )}
                    {user?.role !== 'blogger' && user?.role !== 'super_admin' && (
                        <SettingItem
                            icon={Film}
                            label="Blogger bo'lish"
                            description="Kreativ kontent yaratib pul toping"
                            onClick={() => navigate("/apply/blogger")}
                        />
                    )}

                    {/* Support Section */}
                    <SectionHeader title="Qo'llab-quvvatlash" />
                    <SettingItem
                        icon={HelpCircle}
                        label="Yordam markazi"
                        description="Savollar va javoblar"
                        onClick={() => setHelpDialogOpen(true)}
                    />
                    <SettingItem
                        icon={Info}
                        label="Ilova haqida"
                        description="Versiya: 1.0.4 (stable)"
                        onClick={() => toast.info("House Mobile v1.0.4. Barcha huquqlar himoyalangan.")}
                    />

                    {/* Sessions Section */}
                    <SectionHeader title="Sessiya" />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <div>
                                <SettingItem
                                    icon={LogOut}
                                    label="Hisobdan chiqish"
                                    danger
                                    rightElement={null}
                                />
                            </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Rostdan ham chiqmoqchimisiz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Hisobdan chiqsangiz, qaytadan kirishingizga to'g'ri keladi.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Chiqish
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <div>
                                <SettingItem
                                    icon={UserMinus}
                                    label="Hisobni o'chirish"
                                    danger
                                    description="Bu amalni ortga qaytarib bo'lmaydi"
                                    rightElement={null}
                                />
                            </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive">Hisobni o'chirish?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Barcha ma'lumotlaringiz, postlaringiz va mahsulotlaringiz butunlay o'chirib tashlanadi. Bu amalni ortga qaytarib bo'lmaydi!
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction onClick={() => toast.error("Xavfsizlik yuzasidan bu amal faqat admin orqali amalga oshiriladi")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    O'chirish
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                <div className="mt-8 text-center pb-12">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-50">
                        Made with ❤️ by House Mobile Team
                    </p>
                </div>
            </div>

            {/* Password Change Dialog */}
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Parolni o'zgartirish</DialogTitle>
                        <DialogDescription>
                            Yangi parolni kiriting va tasdiqlang.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Yangi parol</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="******"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Parolni tasdiqlang</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="******"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Bekor qilish</Button>
                        <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword}>
                            {isUpdatingPassword ? "Saqlanmoqda..." : "Saqlash"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Help Center Dialog */}
            <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Yordam markazi</DialogTitle>
                        <DialogDescription>
                            Ko'p beriladigan savollarga javoblar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Qanday qilib sotuvchi bo'lish mumkin?</AccordionTrigger>
                                <AccordionContent>
                                    Profil sozlamalaridan "Sotuvchi sifatida ro'yxatdan o'tish" tugmasini bosing yoki administrator bilan bog'laning.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Mahsulotni qanday qaytarsam bo'ladi?</AccordionTrigger>
                                <AccordionContent>
                                    Buyurtmalar tarixiga kiring, kerakli buyurtmani tanlang va "Qaytarish so'rovi" tugmasini bosing.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>House Mobile nima?</AccordionTrigger>
                                <AccordionContent>
                                    House Mobile - bu uy va maishiy texnika vositalari uchun ixtisoslashgan innovatsion savdo platformasi.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4">
                                <AccordionTrigger>To'lov xavfsizligi qanday ta'minlanadi?</AccordionTrigger>
                                <AccordionContent>
                                    Barcha to'lovlar platforma tomonidan nazorat qilinadi va mahsulot yetib bormaguncha pul sotuvchiga o'tkazilmaydi.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="text-sm font-semibold mb-2">Yana savollaringiz bormi?</p>
                            <p className="text-xs text-muted-foreground mb-4">Bizning jamoamiz sizga yordam berishga tayyor.</p>
                            <Button className="w-full" variant="outline" onClick={() => window.open('https://t.me/house_mobile_support', '_blank')}>
                                Telegram orqali bog'lanish
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Currency Selection Dialog */}
            <Dialog open={currencyDialogOpen} onOpenChange={setCurrencyDialogOpen}>
                <DialogContent className="sm:max-w-[420px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-emerald-500" />
                            Valyutani tanlang
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-2">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <p className="text-xs text-muted-foreground">
                                {ratesDate
                                    ? `CBU kursi: ${ratesDate} da yangilangan`
                                    : "CBU O'zbekiston Markaziy Banki kursi"}
                            </p>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={() => fetchRates()}
                                disabled={isFetchingRates}
                                title="Kurslarni yangilash"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isFetchingRates ? "animate-spin" : ""}`} />
                            </Button>
                        </div>

                        <div className="space-y-1.5">
                            {POPULAR_CURRENCIES.map((cur) => {
                                const isSelected = selectedCurrency === cur.code;
                                const rate = rates[cur.code];
                                const rateText = cur.code === "UZS"
                                    ? "Asosiy valyuta"
                                    : rate
                                        ? `1 ${cur.code} = ${Math.round(rate).toLocaleString("uz-UZ")} so'm`
                                        : isFetchingRates ? "Yuklanmoqda..." : "Kurs mavjud emas";

                                return (
                                    <button
                                        key={cur.code}
                                        onClick={() => {
                                            setSelectedCurrency(cur.code);
                                            toast.success(`Valyuta ${cur.code} ga o'zgartirildi`);
                                            setCurrencyDialogOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isSelected
                                            ? "bg-emerald-500/10 border border-emerald-500/30"
                                            : "hover:bg-muted/50 border border-transparent"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{cur.flag}</span>
                                            <div className="text-left">
                                                <p className={`text-sm font-semibold ${isSelected ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                                                    {cur.code} — {cur.symbol}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{cur.name}</p>
                                                <p className="text-[10px] text-muted-foreground/70">{rateText}</p>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <p className="text-[10px] text-muted-foreground/60 text-center mt-4 px-2">
                            Kurslar CBU (O'zbekiston Markaziy Banki) ma'lumotlari asosida, har 30 daqiqada yangilanadi.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}



