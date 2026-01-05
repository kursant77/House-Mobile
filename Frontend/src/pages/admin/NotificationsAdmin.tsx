import { useState } from "react";
import { Bell, Search, Filter, Send, Trash2, Mail, Info, AlertTriangle, CheckCircle, MoreHorizontal, User, Smartphone, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const mockNotifications = [
    { id: 1, type: 'info', title: 'Tizim yangilanishi', message: 'Yangi versiya 2.4.0 muvaffaqiyatli o\'rnatildi.', date: '2 soat oldin', read: false },
    { id: 2, type: 'error', title: 'Server xatoligi', message: 'API serveri bilan ulanishda uzilish yuz berdi.', date: '5 soat oldin', read: false },
    { id: 3, type: 'success', title: 'Yangi foydalanuvchi', message: 'Sardorbek loyihaga qo\'shildi.', date: 'Kecha', read: true },
    { id: 4, type: 'warning', title: 'Xotira kam qoldi', message: 'Bazadagi disk maydoni 90% ga yetdi.', date: '2 kun oldin', read: true },
];

export default function NotificationsAdmin() {
    const [activeTab, setActiveTab] = useState('all');
    const [sending, setSending] = useState(false);

    const handleSend = () => {
        setSending(true);
        setTimeout(() => {
            setSending(false);
            toast.success("Bildirishnoma muvaffaqiyatli yuborildi!");
        }, 1500);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-zinc-800 dark:text-white tracking-tight">Xabarnomalar Markazi</h2>
                        <p className="text-zinc-500 text-sm font-medium">Tizim bildirishnomalarini yuborish va monitoring qilish</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* New Notification Form */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <h4 className="text-sm font-black text-zinc-800 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                            <Send className="h-4 w-4 text-[#3C50E0]" /> Yangi Xabar Yuborish
                        </h4>

                        <div className="space-y-4 font-medium">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Sarlavha</label>
                                <Input placeholder="Xabar mavzusi..." className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 h-11 rounded-lg font-bold" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Xabar matni</label>
                                <textarea
                                    placeholder="Xabarni shu yerga yozing..."
                                    className="min-h-[120px] w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold dark:bg-zinc-950 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#3C50E0]/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Turi</label>
                                    <select className="flex h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold dark:bg-zinc-950 dark:border-zinc-800 outline-none">
                                        <option>Ma'lumot (Info)</option>
                                        <option>Ogohlantirish</option>
                                        <option>Xatolik</option>
                                        <option>Muvaffaqiyat</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Maqsad</label>
                                    <select className="flex h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold dark:bg-zinc-950 dark:border-zinc-800 outline-none">
                                        <option>Barcha foydalanuvchilar</option>
                                        <option>Faqat adminlar</option>
                                        <option>Sotuvchilar</option>
                                    </select>
                                </div>
                            </div>

                            <Button
                                onClick={handleSend}
                                disabled={sending}
                                className="w-full bg-[#3C50E0] hover:bg-[#2b3cb5] text-white font-black uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-lg shadow-[#3C50E0]/20 mt-4 transition-all"
                            >
                                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                Xabarni yuborish
                            </Button>
                        </div>
                    </div>

                    {/* Delivery Channels */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <h4 className="text-sm font-black text-zinc-800 dark:text-white mb-4 uppercase tracking-widest">Yuborish Kanallari</h4>
                        <div className="space-y-3">
                            {[
                                { icon: Smartphone, label: 'Push Notifications', status: 'Active', color: 'text-[#10B981]' },
                                { icon: Mail, label: 'Email Integration', status: 'Paused', color: 'text-zinc-400' },
                                { icon: Globe, label: 'Web Socket', status: 'Active', color: 'text-[#10B981]' },
                            ].map((c, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50">
                                    <div className="flex items-center gap-3">
                                        <c.icon className="h-4 w-4 text-zinc-400" />
                                        <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">{c.label}</span>
                                    </div>
                                    <span className={cn("text-[10px] font-black uppercase", c.color)}>{c.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* History & Active Notifications */}
                <div className="xl:col-span-2">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                            <h4 className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <Bell className="h-4 w-4 text-orange-500" /> Oxirgi bildirishnomalar
                            </h4>
                            <div className="flex items-center gap-2">
                                {['all', 'unread', 'read'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all border",
                                            activeTab === tab
                                                ? "bg-[#3C50E0] text-white border-[#3C50E0]"
                                                : "text-zinc-500 border-transparent hover:bg-zinc-50"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {mockNotifications.map((n) => (
                                <div key={n.id} className={cn(
                                    "p-6 flex items-start gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all",
                                    !n.read && "bg-blue-50/20 dark:bg-[#3C50E0]/5"
                                )}>
                                    <div className={cn(
                                        "h-10 w-10 shrink-0 rounded-full flex items-center justify-center border-2 shadow-sm",
                                        n.type === 'info' && "bg-blue-50 text-blue-500 border-blue-100",
                                        n.type === 'error' && "bg-red-50 text-red-500 border-red-100",
                                        n.type === 'success' && "bg-green-50 text-green-500 border-green-100",
                                        n.type === 'warning' && "bg-orange-50 text-orange-500 border-orange-100",
                                    )}>
                                        {n.type === 'info' && <Info className="h-5 w-5" />}
                                        {n.type === 'error' && <AlertTriangle className="h-5 w-5" />}
                                        {n.type === 'success' && <CheckCircle className="h-5 w-5" />}
                                        {n.type === 'warning' && <Bell className="h-5 w-5" />}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-tight">{n.title}</h5>
                                            <span className="text-[10px] font-bold text-zinc-400">{n.date}</span>
                                        </div>
                                        <p className="text-sm font-medium text-zinc-500 leading-relaxed dark:text-zinc-400">{n.message}</p>
                                        {!n.read && (
                                            <span className="inline-block mt-2 px-2 py-0.5 bg-[#3C50E0] text-white text-[9px] font-black uppercase tracking-widest rounded">New</span>
                                        )}
                                    </div>

                                    <button className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 text-center border-t border-zinc-100 dark:border-zinc-800">
                            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-[3px] text-[#3C50E0] hover:bg-[#3C50E0]/5">
                                Arxivni ko'rish
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
