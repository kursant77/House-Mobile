import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { User, Mail, Calendar, MapPin, ShoppingBag, Eye, Heart, MessageSquare, Ban, CheckCircle, Shield, ArrowLeft, Loader2, Package, Film, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminUserProfile() {
    const { id } = useParams();
    const [profile, setProfile] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        } catch (error: any) {
            toast.error("Ma'lumotlarni yuklashda xatolik: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleBlock = async () => {
        if (!profile) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_blocked: !profile.is_blocked })
                .eq('id', profile.id);

            if (error) throw error;
            toast.success(profile.is_blocked ? "Foydalanuvchi blokdan chiqarildi" : "Foydalanuvchi bloklandi");
            fetchUserData();
        } catch (error: any) {
            toast.error("Xatolik: " + error.message);
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
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
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

                            <div className="pt-6 space-y-4 text-left">
                                <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                                    <Mail className="h-4 w-4" />
                                    <span className="text-sm font-bold">{profile.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-sm font-bold">Qo'shilgan: {new Date(profile.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-sm font-bold">O'zbekiston, Toshkent</span>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <Button onClick={toggleBlock} className={cn(
                                    "flex-1 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl",
                                    profile.is_blocked ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                                )}>
                                    {profile.is_blocked ? "Blokdan yechish" : "Bloklash"}
                                </Button>
                                <a href={`mailto:${profile.email}`} className="flex-1">
                                    <Button variant="outline" className="w-full font-black uppercase tracking-widest text-[10px] h-12 rounded-xl">Xabar yozish</Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
                        <h4 className="text-lg font-black text-zinc-800 dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-[#3C50E0]" /> Foydalanuvchi mahsulotlari
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {products.length === 0 ? (
                                <div className="col-span-full py-20 text-center opacity-30">
                                    <Package className="h-12 w-12 mx-auto mb-2" />
                                    <p className="font-bold uppercase tracking-widest text-xs">Mahsulotlar mavjud emas</p>
                                </div>
                            ) : (
                                products.map(p => (
                                    <div key={p.id} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:shadow-md transition-shadow group">
                                        <div className="h-16 w-16 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-700">
                                            <ShoppingBag className="h-8 w-8 text-zinc-200" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-black text-zinc-800 dark:text-white truncate text-sm">{p.title}</h5>
                                            <p className="text-xs font-bold text-[#3C50E0]">{p.price?.toLocaleString()} {p.currency}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] text-zinc-400 font-bold">{new Date(p.created_at || Date.now()).toLocaleDateString()}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 group-hover:text-[#3C50E0]">
                                                <ArrowLeft className="h-4 w-4 rotate-180" />
                                            </Button>
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
}
