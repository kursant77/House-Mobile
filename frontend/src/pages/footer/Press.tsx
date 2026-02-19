/**
 * Press Page — Matbuot
 */

import { motion } from "framer-motion";
import { ArrowLeft, Newspaper, Download, ExternalLink, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pressReleases = [
    {
        date: "2024-12-15",
        title: "House Mobile AI yordamchisi ishga tushirildi",
        summary: "Sun'iy intellekt texnologiyasiga asoslangan mahsulot maslahatchisi — House AI barcha foydalanuvchilar uchun bepul.",
        tag: "AI",
    },
    {
        date: "2024-11-01",
        title: "50,000+ foydalanuvchi belgisi",
        summary: "House Mobile platformasi O'zbekistondagi 50 mingdan ortiq foydalanuvchiga xizmat ko'rsatmoqda.",
        tag: "Milestone",
    },
    {
        date: "2024-09-20",
        title: "Blogger dasturi ishga tushirildi",
        summary: "Bloggerlar va kontent yaratuvchilar uchun yangi hamkorlik dasturi — maxsus imkoniyatlar va daromad olish imkoni.",
        tag: "Dastur",
    },
    {
        date: "2024-08-10",
        title: "Telegram bot integratsiyasi",
        summary: "Foydalanuvchilar endi Telegram bot orqali buyurtma berish, mahsulot qidirish va narxlarni kuzatish imkoniga ega.",
        tag: "Texnologiya",
    },
    {
        date: "2024-06-01",
        title: "House Mobile platformasi ishga tushdi",
        summary: "O'zbekistonning eng zamonaviy elektronika savdo platformasi rasmiy ravishda ishga tushirildi.",
        tag: "Launch",
    },
];

const mediaAssets = [
    { name: "House Mobile Logo (PNG)", size: "2.4 MB", type: "Logo" },
    { name: "Brand Guidelines", size: "5.1 MB", type: "PDF" },
    { name: "Screenshots paketi", size: "12 MB", type: "ZIP" },
];

export default function Press() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero */}
            <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white">
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
                        <Newspaper className="w-10 h-10 mx-auto mb-4 text-white/60" />
                        <h1 className="text-3xl md:text-4xl font-black mb-3">Matbuot markazi</h1>
                        <p className="text-white/60 max-w-lg mx-auto">
                            House Mobile haqidagi eng so'nggi yangiliklar, press-relizlar va media materiallar.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-8 relative z-10">
                {/* Contact for press */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border bg-card p-6 mb-10"
                >
                    <h2 className="font-bold text-lg mb-2">Matbuot uchun aloqa</h2>
                    <p className="text-sm text-muted-foreground mb-3">
                        Jurnalistlar va media vakillari uchun maxsus aloqa kanali:
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <a href="mailto:press@housemobile.uz" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                            📧 press@housemobile.uz
                        </a>
                        <a href="https://t.me/housemobile_press" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 text-sm font-medium hover:bg-blue-500/20 transition-colors">
                            ✈️ Telegram: @housemobile_press
                        </a>
                    </div>
                </motion.div>

                {/* Press Releases */}
                <section className="mb-12">
                    <h2 className="text-2xl font-black mb-6">Press-relizlar</h2>
                    <div className="space-y-4">
                        {pressReleases.map((pr, i) => (
                            <motion.article
                                key={pr.title}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="group p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="secondary" className="text-[10px] font-bold">
                                                {pr.tag}
                                            </Badge>
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(pr.date).toLocaleDateString("uz-UZ", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-base mb-1.5 group-hover:text-primary transition-colors">
                                            {pr.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{pr.summary}</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </section>

                {/* Media Kit */}
                <section className="mb-12">
                    <h2 className="text-2xl font-black mb-6">Media materiallar</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {mediaAssets.map((asset) => (
                            <div
                                key={asset.name}
                                className="p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow cursor-pointer group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Download className="w-5 h-5 text-primary" />
                                </div>
                                <p className="font-bold text-sm mb-0.5">{asset.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {asset.type} · {asset.size}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
