import { useState, useEffect } from "react";
import { applicationService } from "@/services/api/applications";
import {
    CheckCircle,
    XCircle,
    Search,
    Clock,
    Phone,
    Send,
    Instagram,
    FileText,
    BadgeCheck,
    X as CloseIcon,
    Store,
    Film
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";


export default function ApplicationsAdmin() {
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<any[]>([]);
    const [filteredApps, setFilteredApps] = useState<any[]>([]);
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const data = await applicationService.getAllApplications();
            setApplications(data);
            setFilteredApps(data);
        } catch (error) {
            console.error("Fetch apps error:", error);
            toast.error("Arizalarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = applications;

        if (searchQuery) {
            filtered = filtered.filter(app =>
                app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(app => app.status === statusFilter);
        }

        if (typeFilter !== "all") {
            filtered = filtered.filter(app => app.type === typeFilter);
        }

        setFilteredApps(filtered);
    }, [searchQuery, statusFilter, typeFilter, applications]);

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        try {
            toast.loading("O'zgartirilmoqda...", { id: "app-action" });
            await applicationService.updateApplicationStatus(id, status);
            toast.success(status === 'approved' ? "Ariza tasdiqlandi" : "Ariza rad etildi", { id: "app-action" });
            setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
            setDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Xatolik yuz berdi", { id: "app-action" });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-500 rounded-full">Tasdiqlandi</Badge>;
            case 'rejected': return <Badge variant="destructive" className="rounded-full">Rad etildi</Badge>;
            default: return <Badge variant="outline" className="text-amber-600 border-amber-600 rounded-full">Kutilmoqda</Badge>;
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Arizalar boshqaruvi</h1>
                    <p className="text-muted-foreground">Sotuvchi va Blogger bo'lish uchun kelib tushgan so'rovlar</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={fetchApplications} variant="outline" size="sm" className="rounded-full">
                        Yangilash
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4 flex flex-col md:flex-row gap-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur border-none shadow-sm rounded-2xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Ism, telefon yoki username bo'yicha qidirish..."
                        className="pl-10 h-10 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="h-10 px-4 rounded-xl border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Barcha holatlar</option>
                        <option value="pending">Kutilmoqda</option>
                        <option value="approved">Tasdiqlangan</option>
                        <option value="rejected">Rad etilgan</option>
                    </select>
                    <select
                        className="h-10 px-4 rounded-xl border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="all">Barcha turlar</option>
                        <option value="seller">Sotuvchilar</option>
                        <option value="blogger">Bloggerlar</option>
                    </select>
                </div>
            </Card>

            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Arizalar yuklanmoqda...</p>
                </div>
            ) : filteredApps.length === 0 ? (
                <Card className="p-20 text-center flex flex-col items-center gap-4 border-dashed bg-transparent shadow-none">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">Hozircha arizalar mavjud emas</p>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredApps.map((app) => (
                        <Card
                            key={app.id}
                            className="p-5 hover:shadow-lg transition-all border border-border/50 bg-white dark:bg-zinc-900 rounded-2xl cursor-pointer group"
                            onClick={() => { setSelectedApp(app); setDialogOpen(true); }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border-2 border-primary/10">
                                        <AvatarImage src={app.user?.avatarUrl} />
                                        <AvatarFallback>{app.fullName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-base group-hover:text-primary transition-colors">{app.fullName}</h3>
                                        <p className="text-xs text-muted-foreground">@{app.user?.username || 'user'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {getStatusBadge(app.status)}
                                    <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-widest px-2">
                                        {app.type === 'seller' ? 'Sotuvchi' : 'Blogger'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                    <Phone className="h-4 w-4" />
                                    <span>{app.phone}</span>
                                </div>
                                {app.telegram && (
                                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        <Send className="h-4 w-4" />
                                        <span>{app.telegram}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-xs line-clamp-2 italic text-muted-foreground">
                                "{app.reason}"
                            </div>

                            <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                                <span>{format(new Date(app.createdAt), "d-MMM, yyyy", { locale: uz })}</span>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold">
                                    Batafsil
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Application Detail Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    {selectedApp && (
                        <div className="flex flex-col">
                            <div className={cn(
                                "p-8 text-white",
                                selectedApp.type === 'seller' ? "bg-blue-600" : "bg-amber-500"
                            )}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-20 w-20 border-4 border-white/20 shadow-xl">
                                            <AvatarImage src={selectedApp.user?.avatarUrl} />
                                            <AvatarFallback className="text-2xl text-zinc-900 bg-white">{selectedApp.fullName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h2 className="text-2xl font-black">{selectedApp.fullName}</h2>
                                            <p className="opacity-80 font-medium">@{selectedApp.user?.username || 'user'}</p>
                                            <div className="mt-2 flex gap-2">
                                                <Badge className="bg-white/20 hover:bg-white/30 border-none text-white rounded-full">
                                                    {selectedApp.type === 'seller' ? <Store className="h-3 w-3 mr-1" /> : <Film className="h-3 w-3 mr-1" />}
                                                    {selectedApp.type === 'seller' ? 'Sotuvchi ariza' : 'Blogger ariza'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setDialogOpen(false)} className="text-white hover:bg-white/10 rounded-full">
                                        <CloseIcon className="h-6 w-6" />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-8 space-y-8 bg-white dark:bg-zinc-950">
                                {/* Contacts */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Telefon</p>
                                        <p className="font-bold flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-primary" />
                                            {selectedApp.phone}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Telegram</p>
                                        <p className="font-bold flex items-center gap-2">
                                            <Send className="h-4 w-4 text-blue-500" />
                                            {selectedApp.telegram || "Ko'rsatilmagan"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instagram</p>
                                        <p className="font-bold flex items-center gap-2">
                                            <Instagram className="h-4 w-4 text-pink-500" />
                                            {selectedApp.instagram || "Ko'rsatilmagan"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sana</p>
                                        <p className="font-bold flex items-center gap-2 text-zinc-500">
                                            <Clock className="h-4 w-4" />
                                            {format(new Date(selectedApp.createdAt), "d MMMM, yyyy", { locale: uz })}
                                        </p>
                                    </div>
                                </div>

                                {/* Type Specific Info */}
                                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl space-y-4 border border-border/50">
                                    {selectedApp.type === 'seller' ? (
                                        <>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Do'kon / Brend nomi</p>
                                                <p className="font-black text-lg text-primary">{selectedApp.businessName}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Nima sotmoqchi</p>
                                                <p className="text-sm leading-relaxed">{selectedApp.businessDescription || "Noma'lum"}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Mavzu</p>
                                                    <p className="font-black text-primary">{selectedApp.contentTheme}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Auditoriya</p>
                                                    <p className="font-black text-primary">{selectedApp.audienceSize || "Noma'lum"}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Reason / Letter */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ariza sababi / Maqsadi</p>
                                    <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 relative italic text-zinc-700 dark:text-zinc-300 leading-relaxed quote shadow-inner">
                                        "{selectedApp.reason}"
                                    </div>
                                </div>

                                {/* Actions */}
                                {selectedApp.status === 'pending' ? (
                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            variant="outline"
                                            className="flex-1 rounded-full h-14 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold gap-2"
                                            onClick={() => handleAction(selectedApp.id, 'rejected')}
                                        >
                                            <XCircle className="h-5 w-5" />
                                            Rad etish
                                        </Button>
                                        <Button
                                            className="flex-1 rounded-full h-14 bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 font-bold gap-2"
                                            onClick={() => handleAction(selectedApp.id, 'approved')}
                                        >
                                            <BadgeCheck className="h-5 w-5" />
                                            Tasdiqlash
                                        </Button>
                                    </div>
                                ) : (
                                    <div className={cn(
                                        "p-6 rounded-3xl flex items-center justify-center gap-3 font-black uppercase tracking-widest",
                                        selectedApp.status === 'approved' ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"
                                    )}>
                                        {selectedApp.status === 'approved' ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                                        {selectedApp.status === 'approved' ? "Ariza tasdiqlangan" : "Ariza rad etilgan"}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
