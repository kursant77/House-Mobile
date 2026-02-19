/**
 * Copyright Page — Mualliflik huquqi
 */

import { motion } from "framer-motion";
import { ArrowLeft, Shield, FileText, AlertTriangle, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const sections = [
    {
        icon: Shield,
        title: "Mualliflik huquqi",
        content: `House Mobile platformasidagi barcha kontent — shu jumladan dizayn, logotip, grafikalar, matnlar, dasturiy ta'minot kodi va foydalanuvchi interfeysi — House Mobile MChJ ning mulki hisoblanadi va O'zbekiston Respublikasining "Mualliflik huquqi va turdosh huquqlar to'g'risida"gi qonuni bilan himoyalangan.`,
    },
    {
        icon: FileText,
        title: "Foydalanuvchi kontenti",
        content: `Foydalanuvchilar tomonidan yuklangan mahsulot suratlari, tavsiflar va sharhlar ularning shaxsiy mulki bo'lib qoladi. Platformaga kontent yuklash orqali foydalanuvchi House Mobile'ga ushbu kontentni ko'rsatish, tarqatish va reklama qilish huquqini beradi.`,
    },
    {
        icon: AlertTriangle,
        title: "Mualliflik huquqi buzilishi",
        content: `Agar sizning mualliflik huquqingiz buzilganligiga ishonsangiz, quyidagi ma'lumotlarni taqdim etgan holda bizga murojaat qiling:
    
• Mualliflik huquqi buzilgan asar tavsifi
• Buzilgan kontentning aniq joylashuvi (URL)
• Sizning to'liq ismingiz va bog'lanish ma'lumotlari
• Huquq egasi ekanligingiz to'g'risidagi bayonot
• Elektron yoki fizik imzongiz`,
    },
    {
        icon: FileText,
        title: "Savdo belgilari",
        content: `"House Mobile", "House AI" va ular bilan bog'liq barcha logotiplar, grafik elementlar va shiorlar House Mobile MChJ ning ro'yxatdan o'tgan savdo belgilaridir. Ushbu savdo belgilaridan oldindan yozma ruxsatsiz foydalanish qat'iyan taqiqlanadi.`,
    },
];

export default function Copyright() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero */}
            <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 text-white">
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
                        <Shield className="w-10 h-10 mx-auto mb-4 text-white/60" />
                        <h1 className="text-3xl md:text-4xl font-black mb-3">Mualliflik huquqi</h1>
                        <p className="text-white/70 max-w-lg mx-auto">
                            Intellektual mulk va mualliflik huquqlari haqida to'liq ma'lumot.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-8">
                {/* Sections */}
                <div className="space-y-6">
                    {sections.map((section, i) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-2xl border border-border bg-card"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <section.icon className="w-4.5 h-4.5 text-primary" />
                                </div>
                                <h2 className="font-bold text-lg">{section.title}</h2>
                            </div>
                            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {section.content}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Contact */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 p-6 rounded-2xl border border-primary/20 bg-primary/5"
                >
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                            <h3 className="font-bold text-sm mb-1">Mualliflik huquqi bo'yicha murojaat</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                Mualliflik huquqi bilan bog'liq barcha savollar uchun:
                            </p>
                            <a href="mailto:legal@housemobile.uz" className="text-sm text-primary font-medium hover:underline">
                                legal@housemobile.uz
                            </a>
                        </div>
                    </div>
                </motion.div>

                {/* Last updated */}
                <p className="text-xs text-muted-foreground text-center mt-8">
                    Oxirgi yangilanish: 2024-yil, dekabr
                </p>
            </div>
        </div>
    );
}
