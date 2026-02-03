import { useState } from "react";
import { Bell, Send as SendIcon, Trash2, Mail, Info, AlertTriangle, CheckCircle, Smartphone, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { notificationService } from "@/services/api/notifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";

export default function NotificationsAdmin() {
    const [activeTab, setActiveTab] = useState('all');
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
    const [target, setTarget] = useState<'all' | 'admin' | 'seller'>('all');

    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['admin-notifications'],
        queryFn: notificationService.getNotifications
    });

    const sendMutation = useMutation({
        mutationFn: notificationService.sendNotification,
        onSuccess: () => {
            toast.success("Bildirishnoma muvaffaqiyatli yuborildi!");
            setTitle("");
            setMessage("");
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        },
        onError: () => {
            toast.error("Xabar yuborishda xatolik yuz berdi");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: notificationService.deleteNotification,
        onSuccess: () => {
            toast.success("O'chirildi");
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        }
    });

    const handleSend = () => {
        if (!title || !message) {
            toast.error("Sarlavha va matnni to'ldiring");
            return;
        }
        sendMutation.mutate({ title, message, type, target });
    };


    // Filter and sort notifications based on activeTab
    type Notification = {
        id: string;
        title: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
        target: string;
        created_at: string;
        read_by?: string[];
    };

    const sortedNotifications: Notification[] = (notifications as Notification[])
        .filter((n) => {
            if (activeTab === 'all') return true;
            if (activeTab === 'unread') return !n.read_by || n.read_by.length === 0;
            if (activeTab === 'read') return n.read_by && n.read_by.length > 0;
            return true;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
                            <SendIcon className="h-4 w-4 text-[#3C50E0]" /> Yangi Xabar Yuborish
                        </h4>

                        <div className="space-y-4 font-medium">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Sarlavha</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Xabar mavzusi..."
                                    className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 h-11 md:h-12 rounded-lg font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Xabar matni</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Xabarni shu yerga yozing..."
                                    className="min-h-[110px] md:min-h-[130px] w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold dark:bg-zinc-950 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#3C50E0]/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Turi</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as any)}
                                        className="flex h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold dark:bg-zinc-950 dark:border-zinc-800 outline-none"
                                    >
                                        <option value="info">Ma'lumot (Info)</option>
                                        <option value="warning">Ogohlantirish</option>
                                        <option value="error">Xatolik</option>
                                        <option value="success">Muvaffaqiyat</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Maqsad</label>
                                    <select
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value as any)}
                                        className="flex h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold dark:bg-zinc-950 dark:border-zinc-800 outline-none"
                                    >
                                        <option value="all">Barcha foydalanuvchilar</option>
                                        <option value="admin">Faqat adminlar</option>
                                        <option value="seller">Sotuvchilar</option>
                                    </select>
                                </div>
                            </div>

                            <Button
                                onClick={handleSend}
                                disabled={sendMutation.isPending}
                                className="w-full bg-[#3C50E0] hover:bg-[#2b3cb5] text-white font-black uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-lg shadow-[#3C50E0]/20 mt-4 transition-all"
                            >
                                {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SendIcon className="h-4 w-4 mr-2" />}
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
                                            "text-[10px] font-bold uppercase tracking-wider px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-all border",
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
                            {isLoading ? (
                                <div className="p-20 flex flex-col items-center gap-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    <p className="text-zinc-500 font-bold">Yuklanmoqda...</p>
                                </div>
                            ) : sortedNotifications.length === 0 ? (
                                <div className="p-20 text-center">
                                    <p className="text-zinc-400 font-bold">Xabarlar topilmadi</p>
                                </div>
                            ) : sortedNotifications.map((n) => (
                                <div key={n.id} className={cn(
                                    "p-6 flex items-start gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all",
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
                                            <span className="text-[10px] font-bold text-zinc-400">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: uz })}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-zinc-500 leading-relaxed dark:text-zinc-400">{n.message}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[9px] font-black uppercase tracking-widest rounded">
                                                To: {n.target}
                                            </span>
                                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded">
                                                Views: {n.read_by?.length || 0}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => n.id && deleteMutation.mutate(n.id)}
                                        className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                    >
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
