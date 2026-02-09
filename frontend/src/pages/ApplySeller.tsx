import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { applicationService } from "@/services/api/applications";
import {
    ShoppingBag,
    ArrowLeft,
    CheckCircle,
    Briefcase,
    Phone,
    User,
    Mail,
    Send,
    ShieldCheck,
    Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ApplySeller() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const data = {
            type: 'seller' as const,
            fullName: formData.get('fullName') as string,
            phone: formData.get('phone') as string,
            email: formData.get('email') as string,
            telegram: formData.get('telegram') as string,
            businessName: formData.get('businessName') as string,
            businessDescription: formData.get('businessDescription') as string,
            reason: formData.get('reason') as string,
        };

        if (!data.fullName || !data.phone || !data.businessName || !data.reason) {
            toast.error("Iltimos, barcha majburiy maydonlarni to'ldiring");
            return;
        }

        try {
            setLoading(true);
            await applicationService.submitApplication(data);
            setSuccess(true);
            toast.success("Ariza muvaffaqiyatli topshirildi");
        } catch (error: any) {
            toast.error(error.message || "Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background pt-20 flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-6 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-border shadow-xl"
                >
                    <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black">Ariza qabul qilindi!</h2>
                        <p className="text-muted-foreground text-sm">
                            Sizning sotuvchi bo'lish haqidagi arizaingiz ko'rib chiqish uchun yuborildi.
                            Tez orada administratorlarimiz siz bilan bog'lanishadi.
                        </p>
                    </div>
                    <Button onClick={() => navigate("/settings")} className="w-full rounded-full h-12">
                        Sozlamalarga qaytish
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-20 pb-20 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Sotuvchi bo'lish</h1>
                        <p className="text-muted-foreground">O'z mahsulotlaringizni platformamizda soting</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Benefits Card */}
                    <div className="md:col-span-1 space-y-4">
                        <Card className="p-6 bg-primary text-primary-foreground rounded-3xl border-none shadow-lg shadow-primary/20">
                            <h3 className="font-bold text-lg mb-4">Afzalliklar:</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-sm">
                                    <ShieldCheck className="h-5 w-5 shrink-0 opacity-80" />
                                    <span>Xavfsiz to'lov tizimi</span>
                                </li>
                                <li className="flex gap-3 text-sm">
                                    <Store className="h-5 w-5 shrink-0 opacity-80" />
                                    <span>Shaxsiy do'kon sahifasi</span>
                                </li>
                                <li className="flex gap-3 text-sm">
                                    <Briefcase className="h-5 w-5 shrink-0 opacity-80" />
                                    <span>Batafsil statistika</span>
                                </li>
                            </ul>
                        </Card>

                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-border/50">
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                                "Sotuvchi sifatida ro'yxatdan o'tish orqali siz platformamiz qoidalariga rozilik bildirasiz."
                            </p>
                        </div>
                    </div>

                    {/* Application Form */}
                    <Card className="md:col-span-2 p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-border/50 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <ShoppingBag className="h-32 w-32" />
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">To'liq ism *</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="fullName" name="fullName" defaultValue={user?.name} className="pl-10 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50" placeholder="Ismingizni kiriting" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Telefon raqam *</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="phone" name="phone" defaultValue={user?.phone} className="pl-10 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50" placeholder="+998 00 000 00 00" required />
                                    </div>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" name="email" type="email" className="pl-10 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50" placeholder="example@gmail.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="telegram" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Telegram @username</Label>
                                    <div className="relative">
                                        <Send className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="telegram" name="telegram" defaultValue={user?.telegram} className="pl-10 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50" placeholder="@username" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="businessName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Brend yoki Do'kon nomi *</Label>
                                <Input id="businessName" name="businessName" className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50" placeholder="Masalan: Apple Store Tashkent" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="businessDescription" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nima sotmoqchisiz?</Label>
                                <Textarea id="businessDescription" name="businessDescription" className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 min-h-[100px]" placeholder="Sotadigan mahsulotlaringiz haqida qisqacha ma'lumot..." />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nega bizni tanladingiz? *</Label>
                                <Textarea id="reason" name="reason" className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 min-h-[100px]" placeholder="Maqsadingiz va niyatlaringiz..." required />
                            </div>

                            <Button type="submit" className="w-full h-12 rounded-full font-bold text-lg shadow-lg relative overflow-hidden group" disabled={loading}>
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-primary to-primary-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                                <span className="relative z-10">{loading ? "Yuborilmoqda..." : "Ariza topshirish"}</span>
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
