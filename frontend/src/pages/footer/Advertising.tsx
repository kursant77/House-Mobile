/**
 * Advertising Page — Reklama
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Megaphone, BarChart3, Target, Layers, Eye, Users, TrendingUp, CheckCircle, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const adFormats = [
    {
        icon: Layers,
        title: "Banner reklama",
        desc: "Bosh sahifa va mahsulotlar sahifasida premium banner joylashuvi.",
        price: "500,000 so'm/kun",
        features: ["Bosh sahifa top pozitsiya", "Responsiv dizayn", "Statistika hisoboti"],
    },
    {
        icon: Eye,
        title: "Mahsulot promosiya",
        desc: "Mahsulotingizni tavsiya qilingan ro'yxatda yuqori o'ringa chiqaring.",
        price: "200,000 so'm/hafta",
        features: ["Qidiruv natijalarida birinchi", "\"Tavsiya etilgan\" badge", "CTR statistikasi"],
    },
    {
        icon: Target,
        title: "Maqsadli reklama",
        desc: "Aniq auditoriyaga yo'naltirilgan reklama kampaniyalari.",
        price: "100,000 so'm dan",
        features: ["Yosh va jins bo'yicha targeting", "Shahar bo'yicha targeting", "A/B testing"],
    },
    {
        icon: Megaphone,
        title: "Reels reklama",
        desc: "Video kontentda native reklama joylashuvi.",
        price: "300,000 so'm/video",
        features: ["Organik ko'rinish", "Yuqori engagement", "Batafsil analitika"],
    },
];

const stats = [
    { label: "Oylik tashriflar", value: "500K+", icon: Eye },
    { label: "Faol foydalanuvchilar", value: "50K+", icon: Users },
    { label: "O'rtacha CTR", value: "4.8%", icon: TrendingUp },
    { label: "Brendlar bilan ishlash", value: "100+", icon: BarChart3 },
];

export default function Advertising() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        company: "",
        contact: "",
        email: "",
        phone: "",
        budget: "",
        message: "",
    });
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.company || !formData.email || !formData.message) {
            toast.error("Barcha kerakli maydonlarni to'ldiring");
            return;
        }

        setSubmitting(true);
        try {
            // Try Supabase first
            const { error } = await supabase
                .from('ad_requests')
                .insert({
                    company: formData.company,
                    contact_name: formData.contact || null,
                    email: formData.email,
                    phone: formData.phone || null,
                    budget: formData.budget || null,
                    message: formData.message,
                    created_at: new Date().toISOString(),
                });

            if (error) {
                // Fallback to localStorage
                const stored = JSON.parse(localStorage.getItem('ad_requests') || '[]');
                stored.push({ ...formData, created_at: new Date().toISOString() });
                localStorage.setItem('ad_requests', JSON.stringify(stored));
            }

            setSent(true);
            toast.success("Reklama so'rovingiz muvaffaqiyatli yuborildi! 24 soat ichida bog'lanamiz.");
            setFormData({ company: "", contact: "", email: "", phone: "", budget: "", message: "" });
            setTimeout(() => setSent(false), 4000);
        } catch {
            // Fallback to localStorage
            const stored = JSON.parse(localStorage.getItem('ad_requests') || '[]');
            stored.push({ ...formData, created_at: new Date().toISOString() });
            localStorage.setItem('ad_requests', JSON.stringify(stored));

            setSent(true);
            toast.success("Reklama so'rovingiz saqlandi!");
            setFormData({ company: "", contact: "", email: "", phone: "", budget: "", message: "" });
            setTimeout(() => setSent(false), 4000);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.08),transparent_50%)]" />
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
                            <Megaphone className="w-4 h-4" />
                            Reklama imkoniyatlari
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                            Brendingizni rivojlantiring
                        </h1>
                        <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
                            50,000+ faol foydalanuvchiga ega platformada reklama qiling va savdoni oshiring.
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
                        <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 text-center shadow-lg">
                            <stat.icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                            <p className="text-xl font-black">{stat.value}</p>
                            <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Ad Formats */}
                <section className="mb-14">
                    <h2 className="text-2xl font-black mb-6">Reklama formatlari</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {adFormats.map((fmt, i) => (
                            <motion.div
                                key={fmt.title}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/20 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <fmt.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                        {fmt.price}
                                    </span>
                                </div>
                                <h3 className="font-bold text-base mb-1.5">{fmt.title}</h3>
                                <p className="text-sm text-muted-foreground mb-3">{fmt.desc}</p>
                                <div className="space-y-1.5">
                                    {fmt.features.map((f) => (
                                        <div key={f} className="flex items-center gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-xs text-muted-foreground">{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Request Form */}
                <section className="mb-14">
                    <h2 className="text-2xl font-black mb-6">Reklama so'rovi</h2>
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        onSubmit={handleSubmit}
                        className="p-6 rounded-2xl border border-border bg-card space-y-4"
                    >
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Kompaniya nomi *</label>
                                <Input
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    placeholder="Kompaniya"
                                    className="rounded-xl h-11"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Kontakt shaxs</label>
                                <Input
                                    value={formData.contact}
                                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                    placeholder="To'liq ism"
                                    className="rounded-xl h-11"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email *</label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@company.uz"
                                    className="rounded-xl h-11"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Telefon</label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+998 90 123 45 67"
                                    className="rounded-xl h-11"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Byudjet</label>
                            <Input
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                placeholder="Taxminiy byudjet (so'm)"
                                className="rounded-xl h-11"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Xabar *</label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Reklama maqsadingiz va qo'shimcha ma'lumotlar..."
                                rows={4}
                                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={sent || submitting}
                            className="w-full h-12 rounded-xl font-bold text-base gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Yuborilmoqda...
                                </>
                            ) : sent ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    So'rov yuborildi!
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    So'rov yuborish
                                </>
                            )}
                        </Button>
                    </motion.form>
                </section>
            </div>
        </div>
    );
}
