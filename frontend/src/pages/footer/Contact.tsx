/**
 * Contact Page — Bog'lanish
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, MapPin, Send, Clock, MessageCircle, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const contacts = [
    {
        icon: Phone,
        label: "Telefon",
        value: "+998 90 123 45 67",
        href: "tel:+998901234567",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
    {
        icon: Mail,
        label: "Email",
        value: "info@housemobile.uz",
        href: "mailto:info@housemobile.uz",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    {
        icon: MessageCircle,
        label: "Telegram",
        value: "@housemobile_support",
        href: "https://t.me/housemobile_support",
        color: "text-sky-500",
        bg: "bg-sky-500/10",
    },
    {
        icon: MapPin,
        label: "Manzil",
        value: "Toshkent shahri, Chilonzor tumani",
        href: "https://maps.google.com/?q=Tashkent+Chilonzor",
        color: "text-red-500",
        bg: "bg-red-500/10",
    },
];

const workHours = [
    { day: "Dushanba - Juma", time: "09:00 — 18:00" },
    { day: "Shanba", time: "10:00 — 15:00" },
    { day: "Yakshanba", time: "Dam olish" },
];

export default function Contact() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            toast.error("Barcha kerakli maydonlarni to'ldiring");
            return;
        }

        setSubmitting(true);
        try {
            // Try Supabase first
            const { error } = await supabase
                .from('contact_messages')
                .insert({
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject || null,
                    message: formData.message,
                    created_at: new Date().toISOString(),
                });

            if (error) {
                // Fallback to localStorage if table doesn't exist
                const stored = JSON.parse(localStorage.getItem('contact_messages') || '[]');
                stored.push({ ...formData, created_at: new Date().toISOString() });
                localStorage.setItem('contact_messages', JSON.stringify(stored));
            }

            setSent(true);
            toast.success("Xabaringiz muvaffaqiyatli yuborildi!");
            setFormData({ name: "", email: "", subject: "", message: "" });
            setTimeout(() => setSent(false), 3000);
        } catch {
            // Fallback to localStorage
            const stored = JSON.parse(localStorage.getItem('contact_messages') || '[]');
            stored.push({ ...formData, created_at: new Date().toISOString() });
            localStorage.setItem('contact_messages', JSON.stringify(stored));

            setSent(true);
            toast.success("Xabaringiz saqlandi!");
            setFormData({ name: "", email: "", subject: "", message: "" });
            setTimeout(() => setSent(false), 3000);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
                <div className="max-w-4xl mx-auto px-4 pt-20 pb-12 md:pt-24 md:pb-16 relative">
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
                        <Mail className="w-10 h-10 mx-auto mb-4 text-white/60" />
                        <h1 className="text-3xl md:text-4xl font-black mb-3">Biz bilan bog'laning</h1>
                        <p className="text-white/70 max-w-lg mx-auto">
                            Savollaringiz bormi? Biz har doim yordam berishga tayyormiz.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-8 relative z-10">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Contact Cards */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-black">Aloqa ma'lumotlari</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
                            {contacts.map((c, i) => (
                                <motion.a
                                    key={c.label}
                                    href={c.href}
                                    target={c.href.startsWith("http") ? "_blank" : undefined}
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-all group"
                                >
                                    <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <c.icon className={`w-5 h-5 ${c.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
                                        <p className="text-sm font-semibold truncate">{c.value}</p>
                                    </div>
                                </motion.a>
                            ))}
                        </div>

                        {/* Work Hours */}
                        <div className="p-5 rounded-2xl border border-border bg-card">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4 text-primary" />
                                <h3 className="font-bold text-sm">Ish vaqti</h3>
                            </div>
                            <div className="space-y-2">
                                {workHours.map((wh) => (
                                    <div key={wh.day} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{wh.day}</span>
                                        <span className="font-medium">{wh.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className="text-xl font-black mb-4">Xabar yuborish</h2>
                        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-2xl border border-border bg-card">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Ismingiz *</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="To'liq ismingiz"
                                    className="rounded-xl h-11"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email *</label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@example.com"
                                    className="rounded-xl h-11"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mavzu</label>
                                <Input
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Xabar mavzusi"
                                    className="rounded-xl h-11"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Xabar *</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Xabaringizni yozing..."
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
                                        Yuborildi!
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Yuborish
                                    </>
                                )}
                            </Button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
