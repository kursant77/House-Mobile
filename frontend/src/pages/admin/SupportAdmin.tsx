import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon, Send as SendIcon, Inbox, Clock, CheckCircle, User, Plus, Search, Trash2, Edit, ToggleLeft, ToggleRight, Loader2, AlertCircle, X, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Import API services
import { messagesApi } from "@/services/api/messages";
import { emailCampaignsApi } from "@/services/api/emailCampaigns";
import { supportTicketsApi } from "@/services/api/supportTickets";
import { platformSettingsApi } from "@/services/api/platformSettings";

interface SupportAdminProps {
    type: 'messages' | 'email' | 'support' | 'settings';
}

export default function SupportAdmin({ type }: SupportAdminProps) {
    const queryClient = useQueryClient();

    // Messages Implementation with Real Data
    const MessagesPage = () => {
        const [messageText, setMessageText] = useState("");
        const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
        const [showSendForm, setShowSendForm] = useState(false);
        const [userSearchQuery, setUserSearchQuery] = useState("");

        const { data: stats, isLoading: statsLoading } = useQuery({
            queryKey: ['messages-stats'],
            queryFn: messagesApi.getStats
        });

        const { data: messages = [], isLoading } = useQuery({
            queryKey: ['admin-messages'],
            queryFn: messagesApi.getMessages
        });

        // Get all users for selection
        const { data: allUsers = [], isLoading: usersLoading } = useQuery({
            queryKey: ['all-users', userSearchQuery],
            queryFn: async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, username, avatar_url')
                    .or(`full_name.ilike.%${userSearchQuery}%,username.ilike.%${userSearchQuery}%`)
                    .limit(20);
                if (error) throw error;
                return data || [];
            },
            enabled: showSendForm
        });

        const sendMessageMutation = useMutation({
            mutationFn: (data: { toUserId: string; message: string }) => messagesApi.sendMessage(data.toUserId, data.message),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
                queryClient.invalidateQueries({ queryKey: ['messages-stats'] });
                toast.success("Xabar muvaffaqiyatli yuborildi!");
                setMessageText("");
                setSelectedUserId(null);
                setShowSendForm(false);
            },
            onError: (err: any) => toast.error(err.message || "Xabar yuborishda xatolik")
        });

        const handleSendMessage = () => {
            if (!selectedUserId || !messageText.trim()) {
                toast.error("Foydalanuvchi va xabar matnini kiriting");
                return;
            }
            sendMessageMutation.mutate({ toUserId: selectedUserId, message: messageText.trim() });
        };

        if (isLoading || statsLoading) {
            return (
                <div className="h-[60vh] flex items-center justify-center">
                    <Loader2 className="h-10 w-10 text-[#3C50E0] animate-spin" />
                </div>
            );
        }

        return (
            <div className="space-y-4 md:space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-zinc-800 dark:text-white tracking-tight">Xabarlar Markazi</h2>
                            <p className="text-zinc-500 text-xs md:text-sm font-medium">Foydalanuvchilar bilan real-time muloqot</p>
                        </div>
                        <Button
                            onClick={() => setShowSendForm(true)}
                            className="bg-[#3C50E0] hover:bg-[#2b3cb5] text-white font-semibold gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Yangi xabar yuborish
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {[
                            { icon: Inbox, label: "Jami Xabarlar", value: stats?.total || 0, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
                            { icon: Clock, label: "Kutayotgan", value: stats?.pending || 0, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
                            { icon: CheckCircle, label: "Javob Berilgan", value: stats?.replied || 0, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
                        ].map((stat, i) => (
                            <div key={i} className={cn("p-4 md:p-5 rounded-lg border border-zinc-100 dark:border-zinc-800", stat.bg)}>
                                <div className="flex items-center gap-3">
                                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", stat.bg)}>
                                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                                        <p className="text-xl font-black text-zinc-800 dark:text-white">{stat.value}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        {messages.length === 0 ? (
                            <div className="py-20 text-center opacity-30">
                                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-zinc-400" />
                                <p className="font-bold uppercase tracking-widest text-xs text-zinc-500">Xabarlar topilmadi</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={cn(
                                    "p-4 md:p-5 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 cursor-pointer transition-colors",
                                    msg.status === 'unread' && "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20"
                                )}>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                                                <User className="h-5 w-5 text-zinc-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-sm text-zinc-800 dark:text-white truncate">
                                                    {msg.from_user?.full_name || 'Unknown User'}
                                                </p>
                                                <p className="text-xs text-zinc-500 truncate">{msg.message}</p>
                                                {msg.source === 'telegram' && (
                                                    <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                        <SendIcon className="h-2.5 w-2.5" /> Telegram
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <span className="text-[10px] font-bold text-zinc-400">
                                                {new Date(msg.created_at).toLocaleDateString()}
                                            </span>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                                                msg.status === 'unread' && "bg-blue-100 text-blue-600",
                                                msg.status === 'replied' && "bg-green-100 text-green-600",
                                                msg.status === 'pending' && "bg-orange-100 text-orange-600"
                                            )}>{msg.status}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Send Message Dialog */}
                    <Dialog open={showSendForm} onOpenChange={setShowSendForm}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Foydalanuvchiga xabar yuborish</DialogTitle>
                                <DialogDescription>
                                    Bitta yoki bir nechta foydalanuvchiga xabar yuboring
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                {/* User Search */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Foydalanuvchini qidirish</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Ism, username yoki email bo'yicha qidirish..."
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>

                                    {/* User List */}
                                    <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                                        {usersLoading ? (
                                            <div className="p-8 text-center">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#3C50E0]" />
                                                <p className="text-xs text-muted-foreground">Qidirilmoqda...</p>
                                            </div>
                                        ) : allUsers.length === 0 ? (
                                            <div className="p-8 text-center text-muted-foreground">
                                                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Foydalanuvchi topilmadi</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y">
                                                {allUsers.map((u: { id: string; full_name: string | null; username: string | null; email?: string | null; avatar_url?: string | null }) => (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => setSelectedUserId(u.id)}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors",
                                                            selectedUserId === u.id && "bg-[#3C50E0]/10 border-l-4 border-[#3C50E0]"
                                                        )}
                                                    >
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={u.avatar_url || undefined} />
                                                            <AvatarFallback>
                                                                {u.full_name?.charAt(0) || u.username?.charAt(0) || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 text-left">
                                                            <p className="font-semibold text-sm">{u.username || u.full_name}</p>
                                                            <p className="text-xs text-muted-foreground">{u.email || ''}</p>
                                                        </div>
                                                        {selectedUserId === u.id && (
                                                            <Check className="h-5 w-5 text-[#3C50E0]" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Selected User Display */}
                                {selectedUserId && (
                                    <div className="p-3 bg-[#3C50E0]/10 rounded-lg border border-[#3C50E0]/20">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-[#3C50E0]" />
                                                <span className="text-sm font-medium">
                                                    Tanlangan: {allUsers.find((u: any) => u.id === selectedUserId)?.full_name || allUsers.find((u: any) => u.id === selectedUserId)?.username}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => setSelectedUserId(null)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Message Text */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Xabar matni</label>
                                    <Textarea
                                        placeholder="Xabar matnini kiriting..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        rows={6}
                                        className="resize-none"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowSendForm(false);
                                            setSelectedUserId(null);
                                            setMessageText("");
                                            setUserSearchQuery("");
                                        }}
                                    >
                                        Bekor qilish
                                    </Button>
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!selectedUserId || !messageText.trim() || sendMessageMutation.isPending}
                                        className="bg-[#3C50E0] hover:bg-[#2b3cb5]"
                                    >
                                        {sendMessageMutation.isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Yuborilmoqda...
                                            </>
                                        ) : (
                                            <>
                                                <SendIcon className="h-4 w-4 mr-2" />
                                                Xabarni yuborish
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        );
    };

    // Email Campaigns with Real Data
    const EmailPage = () => {
        const [title, setTitle] = useState("");
        const [content, setContent] = useState("");
        const [targetAudience, setTargetAudience] = useState<'all' | 'admin' | 'seller' | 'premium'>('all');

        const { data: campaigns = [], isLoading } = useQuery({
            queryKey: ['email-campaigns'],
            queryFn: emailCampaignsApi.getCampaigns
        });

        const createMutation = useMutation({
            mutationFn: emailCampaignsApi.createCampaign,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
                toast.success("Kampaniya yaratildi!");
                setTitle("");
                setContent("");
            },
            onError: () => toast.error("Xatolik yuz berdi")
        });

        const sendMutation = useMutation({
            mutationFn: emailCampaignsApi.sendCampaign,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
                toast.success("Kampaniya yuborildi!");
            },
            onError: () => toast.error("Yuborishda xatolik")
        });

        const handleCreate = () => {
            if (!title || !content) {
                toast.error("Barcha maydonlarni to'ldiring");
                return;
            }
            createMutation.mutate({ title, content, target_audience: targetAudience });
        };

        if (isLoading) {
            return (
                <div className="h-[60vh] flex items-center justify-center">
                    <Loader2 className="h-10 w-10 text-[#3C50E0] animate-spin" />
                </div>
            );
        }

        return (
            <div className="space-y-4 md:space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-zinc-800 dark:text-white tracking-tight">Email Marketing</h2>
                            <p className="text-zinc-500 text-xs md:text-sm font-medium">Email kampaniyalarini boshqarish</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-black text-sm uppercase tracking-widest text-zinc-500">Yangi Email Yaratish</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 mb-1.5 block">Mavzu</label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Email mavzusini kiriting..."
                                        className="bg-[#f7f9fc] dark:bg-zinc-950"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 mb-1.5 block">Maqsad Auditoriya</label>
                                    <select
                                        value={targetAudience}
                                        onChange={(e) => setTargetAudience(e.target.value as any)}
                                        className="flex h-11 w-full rounded-lg border border-zinc-200 bg-[#f7f9fc] px-3 text-sm font-medium dark:bg-zinc-950 dark:border-zinc-800"
                                    >
                                        <option value="all">Barcha foydalanuvchilar</option>
                                        <option value="admin">Faqat adminlar</option>
                                        <option value="seller">Sellers</option>
                                        <option value="premium">Premium users</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 mb-1.5 block">Xabar</label>
                                    <textarea
                                        rows={6}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Email mazmunini yozing..."
                                        className="flex min-h-[120px] w-full rounded-lg border border-zinc-200 bg-[#f7f9fc] px-4 py-3 text-sm font-medium dark:bg-zinc-950 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#3C50E0]/20"
                                    />
                                </div>
                                <Button
                                    onClick={handleCreate}
                                    disabled={createMutation.isPending}
                                    className="w-full bg-[#3C50E0] hover:bg-[#2b3cb5] h-11 font-black uppercase text-xs"
                                >
                                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SendIcon className="h-4 w-4 mr-2" />}
                                    Yaratish
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-black text-sm uppercase tracking-widest text-zinc-500">Oxirgi Kampaniyalar</h3>
                            <div className="space-y-2">
                                {campaigns.length === 0 ? (
                                    <div className="py-20 text-center opacity-30">
                                        <AlertCircle className="h-12 w-12 mx-auto mb-2 text-zinc-400" />
                                        <p className="font-bold uppercase tracking-widest text-xs text-zinc-500">Kampaniyalar topilmadi</p>
                                    </div>
                                ) : (
                                    campaigns.map((campaign) => (
                                        <div key={campaign.id} className="p-4 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <p className="font-black text-sm text-zinc-800 dark:text-white">{campaign.title}</p>
                                                    <p className="text-xs text-zinc-500 mt-1">
                                                        {campaign.sent_count} ta • {new Date(campaign.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase px-2 py-1 rounded",
                                                        campaign.status === 'sent' ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                                                    )}>{campaign.status}</span>
                                                    {campaign.status === 'draft' && (
                                                        <Button
                                                            onClick={() => sendMutation.mutate(campaign.id)}
                                                            disabled={sendMutation.isPending}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                        >
                                                            <SendIcon className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Support Tickets with Real Data
    const SupportPage = () => {
        const [selectedFilter, setSelectedFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');

        const { data: tickets = [], isLoading } = useQuery({
            queryKey: ['support-tickets', selectedFilter],
            queryFn: () => supportTicketsApi.getTickets(selectedFilter === 'all' ? undefined : selectedFilter as any)
        });

        const deleteMutation = useMutation({
            mutationFn: supportTicketsApi.deleteTicket,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
                toast.success("Tiket o'chirildi!");
            },
            onError: () => toast.error("Xatolik yuz berdi")
        });

        if (isLoading) {
            return (
                <div className="h-[60vh] flex items-center justify-center">
                    <Loader2 className="h-10 w-10 text-[#3C50E0] animate-spin" />
                </div>
            );
        }

        return (
            <div className="space-y-4 md:space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-zinc-800 dark:text-white tracking-tight">Yordam Markazi</h2>
                            <p className="text-zinc-500 text-xs md:text-sm font-medium">Support tiketlarini boshqarish</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {['all', 'open', 'pending', 'resolved'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setSelectedFilter(filter as any)}
                                    className={cn(
                                        "text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition-all",
                                        selectedFilter === filter
                                            ? "bg-[#3C50E0] text-white"
                                            : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto -mx-4 md:mx-0">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-[#f7f9fc] dark:bg-zinc-800/50">
                                    <th className="py-3 px-4 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">ID</th>
                                    <th className="py-3 px-4 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">Foydalanuvchi</th>
                                    <th className="py-3 px-4 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">Muammo</th>
                                    <th className="py-3 px-4 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">Muhimlik</th>
                                    <th className="py-3 px-4 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">Holat</th>
                                    <th className="py-3 px-4 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center opacity-30">
                                            <AlertCircle className="h-12 w-12 mx-auto mb-2 text-zinc-400" />
                                            <p className="font-bold uppercase tracking-widest text-xs text-zinc-500">Tiketlar topilmadi</p>
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                                            <td className="py-4 px-4 text-sm font-black text-[#3C50E0]">{ticket.ticket_number}</td>
                                            <td className="py-4 px-4 text-sm font-bold text-zinc-800 dark:text-white">
                                                {ticket.user?.full_name || 'Unknown'}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-zinc-600 dark:text-zinc-400">{ticket.issue_title}</td>
                                            <td className="py-4 px-4">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase px-2 py-1 rounded",
                                                    ticket.priority === 'urgent' && "bg-red-100 text-red-600",
                                                    ticket.priority === 'high' && "bg-orange-100 text-orange-600",
                                                    ticket.priority === 'medium' && "bg-yellow-100 text-yellow-600",
                                                    ticket.priority === 'low' && "bg-blue-100 text-blue-600"
                                                )}>{ticket.priority}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase px-2 py-1 rounded",
                                                    ticket.status === 'open' && "bg-blue-100 text-blue-600",
                                                    ticket.status === 'pending' && "bg-orange-100 text-orange-600",
                                                    ticket.status === 'resolved' && "bg-green-100 text-green-600"
                                                )}>{ticket.status}</span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => deleteMutation.mutate(ticket.id)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // Platform Settings with Real Data
    const SettingsPage = () => {
        const { data: settings = [], isLoading, error } = useQuery({
            queryKey: ['platform-settings'],
            queryFn: platformSettingsApi.getSettings
        });

        const toggleMutation = useMutation({
            mutationFn: platformSettingsApi.toggleSetting,
            onSuccess: (data) => {
                queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
                toast.success(`${data.setting_key} ${data.is_enabled ? 'yoqildi' : 'o\'chirildi'}`);
            },
            onError: (err: any) => toast.error("Xatolik: " + err.message)
        });

        if (isLoading) {
            return (
                <div className="h-[60vh] flex items-center justify-center">
                    <Loader2 className="h-10 w-10 text-[#3C50E0] animate-spin" />
                </div>
            );
        }

        if (error) {
            const isTableMissing = (error as any).message?.includes("relation \"platform_settings\" does not exist");
            return (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 rounded-2xl text-center shadow-xl">
                    <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-black text-zinc-800 dark:text-white mb-3">Sozlamalarni yuklashda xatolik</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
                        {isTableMissing
                            ? "Ma'lumotlar bazasida 'platform_settings' jadvali topilmadi. Iltimos, 'supabase_migration.sql' faylidagi SQL kodini Supabase SQL Editor-da ishga tushiring."
                            : ((error as any).message || "Noma'lum xatolik yuz berdi. Internet aloqasi va tizim ruxsatlarini tekshiring.")}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['platform-settings'] })}
                            className="bg-[#3C50E0] hover:bg-[#2b3cb5] text-white px-8 h-12 rounded-xl font-bold uppercase tracking-wider transition-all"
                        >
                            Qayta urinish
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                            className="px-8 h-12 rounded-xl font-bold uppercase tracking-wider"
                        >
                            Supabase Dashboard
                        </Button>
                    </div>
                </div>
            );
        }

        // Group settings by category
        const groupedSettings = settings.reduce((acc, setting) => {
            if (!acc[setting.category]) {
                acc[setting.category] = [];
            }
            acc[setting.category].push(setting);
            return acc;
        }, {} as Record<string, typeof settings>);

        const categoryLabels: Record<string, string> = {
            'asosiy_sozlamalar': 'Asosiy Sozlamalar',
            'xavfsizlik': 'Xavfsizlik',
            'mahsulotlar': 'Mahsulotlar'
        };

        return (
            <div className="space-y-4 md:space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-xl md:text-2xl font-black text-zinc-800 dark:text-white tracking-tight flex items-center gap-2">
                            <SettingsIcon className="h-6 w-6 text-[#3C50E0]" />
                            Tizim Sozlamalari
                        </h2>
                        <p className="text-zinc-500 text-xs md:text-sm font-medium mt-1">
                            Platforma sozlamalari va konfiguratsiyasini boshqaring
                        </p>
                    </div>

                    <div className="space-y-8">
                        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
                            <div key={category} className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                                    <div className="h-1 w-1 rounded-full bg-[#3C50E0]" />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                                        {categoryLabels[category] || category}
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {categorySettings.map((setting) => (
                                        <div
                                            key={setting.id}
                                            className="flex items-center justify-between p-4 md:p-5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:shadow-sm transition-all duration-200"
                                        >
                                            <div className="flex-1 pr-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-sm md:text-base text-zinc-800 dark:text-white">
                                                        {setting.setting_key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                    </p>
                                                    {setting.is_enabled && (
                                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase rounded">
                                                            Faol
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                                    {setting.description || "Sozlama haqida ma'lumot"}
                                                </p>
                                                {setting.updated_at && (
                                                    <p className="text-[10px] text-zinc-400 mt-2">
                                                        Oxirgi yangilanish: {new Date(setting.updated_at).toLocaleString('uz-UZ')}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => toggleMutation.mutate(setting.setting_key)}
                                                disabled={toggleMutation.isPending}
                                                className="shrink-0 relative group"
                                                title={setting.is_enabled ? "O'chirish" : "Yoqish"}
                                            >
                                                {toggleMutation.isPending ? (
                                                    <Loader2 className="h-10 w-10 text-[#3C50E0] animate-spin" />
                                                ) : setting.is_enabled ? (
                                                    <div className="relative">
                                                        <ToggleRight className="h-11 w-11 text-[#3C50E0] group-hover:scale-110 transition-transform" />
                                                        <div className="absolute inset-0 bg-[#3C50E0]/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <ToggleLeft className="h-11 w-11 text-zinc-400 group-hover:text-zinc-500 group-hover:scale-110 transition-all" />
                                                        <div className="absolute inset-0 bg-zinc-400/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Settings Info */}
                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                    Sozlamalar haqida
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                    Sozlamalarni o'zgartirganda o'zgarishlar darhol kuchga kiradi. Ehtiyotkorlik bilan ishlating.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render appropriate page
    if (type === 'messages') return <MessagesPage />;
    if (type === 'email') return <EmailPage />;
    if (type === 'support') return <SupportPage />;
    if (type === 'settings') return <SettingsPage />;

    return null;
}
