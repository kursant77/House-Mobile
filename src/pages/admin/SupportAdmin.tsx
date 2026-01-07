import { MessageSquare, Mail, HelpCircle, Construction } from "lucide-react";

interface SupportAdminProps {
    type: 'messages' | 'email' | 'support' | 'settings';
}

export default function SupportAdmin({ type }: SupportAdminProps) {
    const configs = {
        messages: {
            title: "Xabarlar",
            subtitle: "Foydalanuvchilar bilan jonli muloqot",
            icon: MessageSquare,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        email: {
            title: "Email Marketing",
            subtitle: "Foydalanuvchilarga xabarlar yuborish",
            icon: Mail,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
        support: {
            title: "Yordam Markazi",
            subtitle: "Texnik qo'llab-quvvatlash va savollar",
            icon: HelpCircle,
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        },
        settings: {
            title: "Tizim Sozlamalari",
            subtitle: "Platforma va administrator sozlamalari",
            icon: Construction,
            color: "text-zinc-500",
            bg: "bg-zinc-500/10"
        }
    };

    const config = configs[type];
    const Icon = config.icon;

    return (
        <div className="h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
            <div className={`h-24 w-24 rounded-3xl ${config.bg} flex items-center justify-center shadow-xl`}>
                <Icon className={`h-12 w-12 ${config.color}`} />
            </div>

            <div className="space-y-2">
                <h2 className="text-3xl font-black text-zinc-800 dark:text-white uppercase tracking-tighter italic">
                    {config.title}
                </h2>
                <p className="text-zinc-500 font-bold max-w-sm mx-auto">
                    {config.subtitle}
                </p>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-900 px-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <Construction className="h-5 w-5 text-[#3C50E0] animate-bounce" />
                <span className="text-xs font-black uppercase tracking-widest text-[#3C50E0]">Tez orada ishga tushadi...</span>
            </div>
        </div>
    );
}
