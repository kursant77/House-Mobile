/**
 * About Page — Haqida
 */

import { motion } from "framer-motion";
import { ArrowLeft, Globe, Users, ShoppingBag, Smartphone, Target, Heart, Zap, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const stats = [
    { label: "Foydalanuvchilar", value: "50,000+", icon: Users },
    { label: "Mahsulotlar", value: "100,000+", icon: ShoppingBag },
    { label: "Shaharlar", value: "14", icon: Globe },
    { label: "Sotuvchilar", value: "2,000+", icon: Smartphone },
];

const values = [
    {
        icon: Target,
        title: "Maqsadimiz",
        desc: "O'zbekistondagi eng yirik onlayn elektronika bozori bo'lish va har bir foydalanuvchiga eng qulay xarid tajribasini taqdim etish.",
    },
    {
        icon: Heart,
        title: "Qadriyatlarimiz",
        desc: "Halollik, shaffoflik va mijozlarga hurmat — bizning asosiy qadriyatlarimiz. Har bir mahsulot sifat nazoratidan o'tadi.",
    },
    {
        icon: Zap,
        title: "Innovatsiya",
        desc: "AI texnologiyalari, real-vaqt tavsiyalar va zamonaviy dizayn — biz doimo yangiliklar bilan oldinga boramiz.",
    },
    {
        icon: Shield,
        title: "Xavfsizlik",
        desc: "Foydalanuvchilar ma'lumotlari va to'lov xavfsizligi bizning ustuvor vazifamiz. Barcha tranzaksiyalar himoyalangan.",
    },
];

const team = [
    { name: "Asadbek Jumanazarov", role: "Asoschisi & CEO", avatar: "A" },
    { name: "House Development", role: "Texnologiya jamoasi", avatar: "H" },
];

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
};

export default function About() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgY3g9IjMwIiBjeT0iMzAiIHI9IjIiLz48L2c+PC9zdmc+')] opacity-30" />
                <div className="max-w-4xl mx-auto px-4 pt-20 pb-12 md:pt-24 md:pb-20 relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="absolute top-4 left-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <motion.div {...fadeUp} className="text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
                            <Globe className="w-4 h-4" />
                            O'zbekiston №1 elektronika platformasi
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                            House Mobile
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                            Zamonaviy texnologiyalar va innovatsion yechimlar bilan O'zbekiston elektronika bozorini yangi bosqichga olib chiqamiz.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 relative z-10">
                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-8 mb-12"
                >
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-card border border-border rounded-2xl p-5 text-center shadow-lg"
                        >
                            <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                            <p className="text-2xl font-black text-foreground">{stat.value}</p>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Story */}
                <motion.section {...fadeUp} transition={{ delay: 0.3 }} className="mb-14">
                    <h2 className="text-2xl font-black mb-4">Bizning tarix</h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">House Mobile</strong> — 2024-yilda asos solingan O'zbekistonning eng zamonaviy elektronika savdo platformasi.
                            Biz smartfonlar, kompyuterlar, gadjetlar va aksessuarlarni eng qulay narxlarda taqdim etamiz.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Platformamiz sun'iy intellekt texnologiyalari bilan jihozlangan — <strong className="text-foreground">House AI</strong> yordamchisi
                            sizga mahsulot tanlashda, narxlarni solishtirishda va eng yaxshi takliflarni topishda yordam beradi.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Biz nafaqat onlayn do'kon, balki to'liq ekotizim yaratmoqdamiz: sotuvchilar uchun dashboard,
                            bloggerlar uchun maxsus imkoniyatlar, referal dastur va Telegram bot integratsiyasiga ega komil platformamiz bor.
                        </p>
                    </div>
                </motion.section>

                {/* Values */}
                <motion.section {...fadeUp} transition={{ delay: 0.4 }} className="mb-14">
                    <h2 className="text-2xl font-black mb-6">Qadriyatlarimiz</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {values.map((v, i) => (
                            <motion.div
                                key={v.title}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.1 }}
                                className="p-5 rounded-2xl border border-border bg-card hover:shadow-lg transition-shadow"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                    <v.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-bold text-base mb-1.5">{v.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Team */}
                <motion.section {...fadeUp} transition={{ delay: 0.5 }} className="mb-14">
                    <h2 className="text-2xl font-black mb-6">Jamoamiz</h2>
                    <div className="flex flex-wrap gap-4">
                        {team.map((member) => (
                            <div
                                key={member.name}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card min-w-[250px]"
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                    {member.avatar}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{member.name}</p>
                                    <p className="text-xs text-muted-foreground">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
