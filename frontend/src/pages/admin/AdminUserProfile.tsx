import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { User, Mail, Calendar, MapPin, ShoppingBag, Eye, Heart, MessageSquare, Ban, CheckCircle, Shield, ArrowLeft, Loader2, Package, Film, Star, Send as SendIcon, Phone, Instagram, Facebook, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { authApi } from "@/services/api/auth";
import { notificationService } from "@/services/api/notifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SupabaseProfile, SupabaseProduct } from "@/types/api";

export default function AdminUserProfile() {
    const { id } = useParams();
    const [profile, setProfile] = useState<SupabaseProfile | null>(null);
    const [products, setProducts] = useState<SupabaseProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, [id]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            const [profileRes, productsRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', id).single(),
                supabase.from('products').select('*').eq('seller_id', id).order('id', { ascending: false })
            ]);

            if (profileRes.error) throw profileRes.error;
            setProfile(profileRes.data);
            setProducts(productsRes.data || []);
        } catch (error) {
            const err = error as Error;
            toast.error("Ma'lumotlarni yuklashda xatolik: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleBlock = async () => {
        if (!profile) return;
        try {
            await authApi.toggleBlock(profile.id, !profile.is_blocked);
            toast.success(profile.is_blocked ? "Foydalanuvchi blokdan chiqarildi" : "Foydalanuvchi bloklandi");
            fetchUserData();
        } catch (error) {
            const err = error as Error;
            toast.error("Xatolik: " + err.message);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) {
            toast.error("Xabar matnini kiriting");
            return;
        }

        setIsSending(true);
        try {
            await notificationService.sendNotification({
                title: "Admin xabari",
                message: message.trim(),
                type: 'info',
                target: 'all',
                user_id: id,
            });
            toast.success("Xabar yuborildi");
            setMessage("");
            setDialogOpen(false);
        } catch (error) {
            const err = error as Error;
            toast.error("Xatolik: " + err.message);
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 text-[#3C50E0] animate-spin" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading Profile...</p>
            </div>
        );
    }

    if (!profile) return <div className="p-10 text-center">Profil topilmadi</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/admin/users">
                    <Button variant="ghost" size="icon" className="h-10 w-10 md:h-11 md:w-11 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h2 className="text-2xl font-black text-zinc-800 dark:text-white uppercase tracking-tighter">Foydalanuvchi Profili</h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-[#3C50E0] to-[#80CAEE]" />
                        <div className="px-6 pb-6 text-center">
                            <div className="relative -mt-16 mb-4 inline-block">
                                <div className="h-32 w-32 rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-xl mx-auto">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-16 w-16 text-zinc-300 m-auto mt-6" />
                                    )}
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-zinc-800 dark:text-white leading-none mb-1">{profile.full_name}</h3>
                            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest leading-none mb-4">{profile.role}</p>

                            <div className="flex items-center justify-center gap-2 mb-6">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    profile.is_blocked ? "bg-red-50 text-red-500 border-red-100" : "bg-green-50 text-green-500 border-green-100"
                                )}>
                                    {profile.is_blocked ? "Bloklangan" : "Aktiv"}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 py-6 border-y border-zinc-100 dark:border-zinc-800">
                                <div className="text-center">
                                    <p className="text-lg font-black text-zinc-800 dark:text-white leading-none">{products.length}</p>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">E'lonlar soni</p>
                                </div>
                            </div>

                            <div className="pt-6 space-y-4 text-left border-t border-zinc-100 dark:border-zinc-800">
                                {profile.username && (
                                    <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                                        <User className="h-4 w-4" />
                                        <span className="text-sm font-bold">@{profile.username}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                                    <Mail className="h-4 w-4" />
                                    <span className="text-sm font-bold">{profile.email || "Email kiritilmagan"}</span>
                                </div>
                                {profile.phone && (
                                    <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                                        <Phone className="h-4 w-4" />
                                        <span className="text-sm font-bold">{profile.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-sm font-bold">
                                        Qo'shilgan: {(() => {
                                            if (!profile.created_at) return "Noma'lum";
                                            const date = new Date(profile.created_at);
                                            return isNaN(date.getTime()) ? "Noma'lum" : date.toLocaleDateString();
                                        })()}
                                    </span>
                                </div>
                                {profile.address && (
                                    <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-sm font-bold">{profile.address}</span>
                                    </div>
                                )}
                            </div>

                            {profile.bio && (
                                <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-left">
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">BIO</p>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                                        {profile.bio}
                                    </p>
                                </div>
                            )}

                            {/* Social Links */}
                            <div className="mt-6 flex justify-center gap-4">
                                {profile.telegram && (
                                    <a href={`https://t.me/${profile.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors">
                                        <SendIcon className="h-5 w-5" />
                                    </a>
                                )}
                                {profile.instagram && (
                                    <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors">
                                        <Instagram className="h-5 w-5" />
                                    </a>
                                )}
                                {profile.facebook && (
                                    <a href={profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors">
                                        <Facebook className="h-5 w-5" />
                                    </a>
                                )}
                            </div>

                            <div className="mt-8 flex gap-3">
                                <Button onClick={toggleBlock} className={cn(
                                    "flex-1 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl",
                                    profile.is_blocked ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                                )}>
                                    {profile.is_blocked ? "Blokdan yechish" : "Bloklash"}
                                </Button>
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="flex-1 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl">
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Xabar yozish
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Foydalanuvchiga xabar yuborish</DialogTitle>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Textarea
                                                placeholder="Xabar matnini kiriting..."
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                className="min-h-[120px]"
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Bekor qilish</Button>
                                            <Button onClick={handleSendMessage} disabled={isSending} className="bg-[#3C50E0] hover:bg-[#3C50E0]/90">
                                                {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SendIcon className="h-4 w-4 mr-2" />}
                                                Yuborish
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 md:p-6">
                        <h4 className="text-lg font-black text-zinc-800 dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-[#3C50E0]" /> Foydalanuvchi mahsulotlari
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            {products.length === 0 ? (
                                <div className="col-span-full py-20 text-center opacity-30">
                                    <Package className="h-12 w-12 mx-auto mb-2" />
                                    <p className="font-bold uppercase tracking-widest text-xs">Mahsulotlar mavjud emas</p>
                                </div>
                            ) : (
                                products.map(p => (
                                    <Link key={p.id} to={`/product/${p.id}`} className="p-4 md:p-5 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:shadow-md hover:border-primary/20 transition-all group bg-white dark:bg-zinc-900">
                                        <div className="h-14 w-14 md:h-16 md:w-16 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-700 overflow-hidden">
                                            {p.images && p.images[0] ? (
                                                <img src={p.images[0]} className="h-full w-full object-cover" alt="" />
                                            ) : (
                                                <ShoppingBag className="h-8 w-8 text-zinc-200" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <h5 className="font-black text-zinc-800 dark:text-white truncate text-sm">{p.title}</h5>
                                            <p className="text-xs font-bold text-[#3C50E0]">{p.price?.toLocaleString()} {p.currency}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] text-zinc-400 font-bold">
                                                {(() => {
                                                    if (!p.created_at) return "";
                                                    const date = new Date(p.created_at);
                                                    return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
                                                })()}
                                            </span>
                                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-[#3C50E0] group-hover:bg-[#3C50E0]/10 transition-colors">
                                                <ArrowLeft className="h-4 w-4 rotate-180" />
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
