import { useState } from "react";
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
    Info
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

export default function Settings() {
    const { user, logout } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();

    // Local settings states
    const [notifications, setNotifications] = useState(true);
    const [biometrics, setBiometrics] = useState(false);
    const [language, setLanguage] = useState("uz");

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
                    <SettingItem
                        icon={Lock}
                        label="Xavfsizlik"
                        description="Parolni o'zgartirish va 2FA"
                        onClick={() => toast.info("Tez kunda!")}
                    />
                    <SettingItem
                        icon={Shield}
                        label="Maxfiylik"
                        description="Hisob ko'rinishi va bloklanganlar"
                        onClick={() => navigate("/blocked")}
                    />

                    {/* App Settings Section */}
                    <SectionHeader title="Ilova sozlamalari" />
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

                    {/* Support Section */}
                    <SectionHeader title="Qo'llab-quvvatlash" />
                    <SettingItem
                        icon={HelpCircle}
                        label="Yordam markazi"
                        description="Savollar va javoblar"
                        onClick={() => toast.info("Tez kunda!")}
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
        </div>
    );
}
