/**
 * Bloggers Page — Bloggerlar
 */

import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, DollarSign, Eye, Gift, Star, Users, Camera, CheckCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const benefits = [
    {
        icon: DollarSign,
        title: "Daromad olish",
        desc: "Har bir sotuvdan foiz oling. Qancha ko'p tavsiya qilsangiz, shuncha ko'p ishlaysiz.",
        color: "from-emerald-500 to-green-600",
    },
    {
        icon: Gift,
        title: "Bepul mahsulotlar",
        desc: "Top bloggerlar tekshirish uchun bepul mahsulot oladi va video obzor tayyorlaydi.",
        color: "from-violet-500 to-purple-600",
    },
    {
        icon: Eye,
        title: "Ko'rinish oshishi",
        desc: "Sizning profilingiz va kontentingiz platformamizda promosiya qilinadi.",
        color: "from-blue-500 to-cyan-600",
    },
    {
        icon: Star,
        title: "Maxsus imkoniyatlar",
        desc: "Bloggerlar uchun maxsus badge, early access va premium funksiyalar.",
        color: "from-amber-500 to-orange-600",
    },
];

const steps = [
    {
        num: "01",
        title: "Ariza topshiring",
        desc: "Platformaga ro'yxatdan o'ting va blogger bo'lish uchun ariza yuboring.",
    },
    {
        num: "02",
        title: "Tasdiqlash",
        desc: "Jamoamiz sizning arizangizni 24 soat ichida ko'rib chiqadi va tasdiqlaydi.",
    },
    {
        num: "03",
        title: "Kontent yarating",
        desc: "Mahsulotlar haqida obzorlar, taqqoslashlar va tavsiyalar yarating.",
    },
    {
        num: "04",
        title: "Daromad oling",
        desc: "Har bir sotuvdan foiz oling va maxsus imkoniyatlardan foydalaning.",
    },
];

const requirements = [
    "Kamida 1000 obunachilik auditoriya (Instagram, Telegram yoki YouTube)",
    "Texnologiya yoki gadjetlar sohasida kontent yaratish tajribasi",
    "Sifatli foto/video kontent tayyorlash imkoniyati",
    "O'zbek tilida yoki rus tilida sifatli kontent yaratish",
    "Muntazam ravishda kontent chiqarish (haftada kamida 2-3 post)",
];

export default function Bloggers() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-pink-600 via-rose-600 to-red-600 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
                <div className="max-w-4xl mx-auto px-4 pt-20 pb-12 md:pt-24 md:pb-20 relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="absolute top-4 left-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
                            <Camera className="w-4 h-4" />
                            Blogger dasturi
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                            Bloggerlar uchun imkoniyatlar
                        </h1>
                        <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
                            House Mobile bilan hamkorlik qiling, auditoriyangizni oshiring va daromad oling.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={() => navigate("/apply/blogger")}
                                className="bg-white text-rose-600 hover:bg-white/90 font-bold h-12 px-8 rounded-xl text-base shadow-xl"
                            >
                                Ariza topshirish
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => navigate("/profile")}
                                className="border border-white/30 text-white hover:bg-white/10 font-bold h-12 px-8 rounded-xl text-base"
                            >
                                Batafsil ma'lumot
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 relative z-10">
                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-3 gap-4 -mt-8 mb-12"
                >
                    {[
                        { label: "Faol bloggerlar", value: "200+", icon: Users },
                        { label: "O'rtacha daromad", value: "3M+", icon: TrendingUp },
                        { label: "Bepul mahsulotlar", value: "500+", icon: Gift },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-card border border-border rounded-2xl p-4 text-center shadow-lg"
                        >
                            <stat.icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                            <p className="text-xl font-black">{stat.value}</p>
                            <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Benefits */}
                <section className="mb-14">
                    <h2 className="text-2xl font-black mb-6">Afzalliklar</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {benefits.map((b, i) => (
                            <motion.div
                                key={b.title}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="p-5 rounded-2xl border border-border bg-card hover:shadow-lg transition-shadow group"
                            >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                    <b.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-bold text-base mb-1.5">{b.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Steps */}
                <section className="mb-14">
                    <h2 className="text-2xl font-black mb-6">Qanday boshlash mumkin?</h2>
                    <div className="space-y-4">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.num}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.1 }}
                                className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-card"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="font-black text-sm text-primary">{step.num}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-base mb-0.5">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Requirements */}
                <section className="mb-14">
                    <h2 className="text-2xl font-black mb-6">Talablar</h2>
                    <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
                        {requirements.map((req, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-muted-foreground">{req}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-center p-8 rounded-2xl bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20"
                >
                    <h3 className="text-xl font-black mb-2">Tayyor bo'lsangiz, boshlang!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Ariza topshiring va 24 soat ichida javob oling.
                    </p>
                    <Button
                        onClick={() => navigate("/apply/blogger")}
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg"
                    >
                        Blogger bo'lish
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
