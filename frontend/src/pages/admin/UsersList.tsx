import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { authApi } from "@/services/api/auth";
import { Link, useSearchParams } from "react-router-dom";
import { Search, MoreVertical, Ban, CheckCircle, Shield, ShieldCheck, Mail, Calendar, UserPlus, ArrowRight, Users, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SupabaseProfile } from "@/types/api";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UsersList() {
    const [users, setUsers] = useState<SupabaseProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filterTab, setFilterTab] = useState<'all' | 'bloggers' | 'sellers'>('all');
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const role = searchParams.get('role');
        if (role === 'blogger') setFilterTab('bloggers');
        else if (role === 'seller') setFilterTab('sellers');
        else setFilterTab('all');
    }, [searchParams]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Selecting '*' to be resilient to missing columns
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Noma'lum xatolik";
            toast.error("Foydalanuvchilarni yuklashda xatolik: " + message);
        } finally {
            setLoading(false);
        }
    };

    const toggleBlock = async (id: string, isBlockedNow: boolean) => {
        try {
            await authApi.toggleBlock(id, !isBlockedNow);

            if (!isBlockedNow) {
                toast.success("Foydalanuvchi muvaffaqiyatli bloklandi");
            } else {
                toast.success("Foydalanuvchi blokdan chiqarildi");
            }

            fetchUsers();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Noma'lum xatolik";
            toast.error("Bloklashda xatolik: " + message);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            await authApi.updateUserRole(userId, newRole);
            toast.success("Foydalanuvchi roli muvaffaqiyatli yangilandi");
            fetchUsers();
        } catch (error: any) {
            toast.error("Rolni yangilashda xatolik: " + error.message);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            await authApi.deleteUser(userToDelete);

            toast.success("Foydalanuvchi muvaffaqiyatli o'chirildi");
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Noma'lum xatolik";
            toast.error("O'chirishda xatolik: " + message);
        } finally {
            setIsDeleting(false);
        }
    };

    const openDeleteDialog = (userId: string) => {
        setUserToDelete(userId);
        setDeleteDialogOpen(true);
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase());

        if (filterTab === 'bloggers') return matchesSearch && u.role === 'blogger';
        if (filterTab === 'sellers') return matchesSearch && u.role === 'seller';
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-zinc-800 dark:text-white tracking-tight">Foydalanuvchilar Paneli</h2>
                        <p className="text-zinc-500 text-sm font-medium">Platforma foydalanuvchilarini to'liq boshqarish va kuzatish</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[#f7f9fc] dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 pl-10 h-11 w-64 rounded-lg focus-visible:ring-[#3C50E0]/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Role Tabs */}
                <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg w-fit mt-2">
                    <Button
                        variant={filterTab === 'all' ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilterTab('all')}
                        className={cn("h-8 px-4 font-bold text-xs uppercase tracking-wider", filterTab === 'all' && "bg-[#3C50E0] hover:bg-[#3C50E0]/90")}
                    >
                        Barcha
                    </Button>
                    <Button
                        variant={filterTab === 'bloggers' ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilterTab('bloggers')}
                        className={cn("h-8 px-4 font-bold text-xs uppercase tracking-wider", filterTab === 'bloggers' && "bg-amber-500 hover:bg-amber-600")}
                    >
                        Bloggerlar
                    </Button>
                    <Button
                        variant={filterTab === 'sellers' ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilterTab('sellers')}
                        className={cn("h-8 px-4 font-bold text-xs uppercase tracking-wider", filterTab === 'sellers' && "bg-blue-600 hover:bg-blue-700")}
                    >
                        Sotuvchilar
                    </Button>
                </div>
            </div>

            {/* Users Table Card */}
            <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-[#f7f9fc] text-left dark:bg-zinc-800/50">
                                <th className="min-w-[220px] py-4 px-6 text-xs font-black text-zinc-500 uppercase tracking-[2px]">Foydalanuvchi</th>
                                <th className="min-w-[150px] py-4 px-6 text-xs font-black text-zinc-500 uppercase tracking-[2px]">Rol & Holat</th>
                                <th className="min-w-[120px] py-4 px-6 text-xs font-black text-zinc-500 uppercase tracking-[2px]">Sana</th>
                                <th className="py-4 px-6 text-right text-xs font-black text-zinc-500 uppercase tracking-[2px]">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="py-8 px-6 text-center text-zinc-300 dark:text-zinc-700 font-bold uppercase tracking-widest text-[10px]">Yuklanmoqda...</td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 px-6 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                            <Users className="h-10 w-10 text-zinc-300" />
                                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Foydalanuvchilar topilmadi</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                        <td className="py-4 md:py-5 px-4 md:px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-[#f1f5f9] dark:bg-zinc-800 border-2 border-transparent group-hover:border-[#3C50E0]/30 transition-all flex items-center justify-center shrink-0 overflow-hidden">
                                                    {u.avatar_url ? (
                                                        <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-xl font-black text-[#3C50E0]">{u.full_name?.charAt(0) || '?'}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-black text-zinc-800 dark:text-white truncate">{u.full_name}</span>
                                                    <span className="text-[11px] text-zinc-500 font-medium truncate flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> {u.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border",
                                                        u.role === 'super_admin'
                                                            ? "bg-[#3C50E0]/10 text-[#3C50E0] border-[#3C50E0]/20"
                                                            : u.role === 'blogger'
                                                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                                : u.role === 'seller'
                                                                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                                                    : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                                                    )}>
                                                        {u.role === 'blogger' ? 'Blogger 🌟' : u.role === 'seller' ? 'Sotuvchi 🏪' : u.role}
                                                    </span>
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                                                    u.is_blocked ? "text-red-500" : "text-green-500"
                                                )}>
                                                    <div className={cn("h-1.5 w-1.5 rounded-full", u.is_blocked ? "bg-red-500" : "bg-green-500")} />
                                                    {u.is_blocked ? "Bloklangan" : "Aktiv"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 md:py-5 px-4 md:px-6">
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span className="text-xs font-bold">
                                                    {new Date(u.created_at || Date.now()).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/admin/users/${u.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-[#3C50E0] hover:bg-[#3C50E0]/10 rounded-lg">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-xl p-1.5 rounded-xl">
                                                        <DropdownMenuItem asChild>
                                                            <Link to={`/admin/users/${u.id}`} className="hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer px-4 py-2.5 text-sm font-bold flex items-center gap-3">
                                                                <UserPlus className="h-4 w-4 text-[#3C50E0]" /> Profilni ko'rish
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800 my-1" />
                                                        <DropdownMenuItem
                                                            onClick={() => toggleBlock(u.id, u.is_blocked)}
                                                            className={cn(
                                                                "rounded-lg cursor-pointer px-4 py-2.5 text-sm font-black flex items-center gap-3",
                                                                u.is_blocked ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20" : "text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                                                            )}
                                                        >
                                                            {u.is_blocked ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                                            {u.is_blocked ? "Blokdan yechish" : "Bloklash"}
                                                        </DropdownMenuItem>
                                                        {u.role !== 'super_admin' && (
                                                            <>
                                                                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800 my-1" />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleUpdateRole(u.id, u.role === 'blogger' ? 'user' : 'blogger')}
                                                                    className={cn(
                                                                        "rounded-lg cursor-pointer px-4 py-2.5 text-sm font-black flex items-center gap-3",
                                                                        u.role === 'blogger' ? "text-red-600 hover:bg-red-50" : "text-amber-600 hover:bg-amber-50"
                                                                    )}
                                                                >
                                                                    <Shield className="h-4 w-4" />
                                                                    {u.role === 'blogger' ? "Bloggerlikdan olish" : "Blogger qilish"}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800 my-1" />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleUpdateRole(u.id, u.role === 'seller' ? 'user' : 'seller')}
                                                                    className={cn(
                                                                        "rounded-lg cursor-pointer px-4 py-2.5 text-sm font-black flex items-center gap-3",
                                                                        u.role === 'seller' ? "text-red-600 hover:bg-red-50" : "text-blue-600 hover:bg-blue-50"
                                                                    )}
                                                                >
                                                                    <ShieldCheck className="h-4 w-4" />
                                                                    {u.role === 'seller' ? "Sotuvchilikdan olish" : "Rasmiy sotuvchi qilish"}
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {u.role !== 'super_admin' && (
                                                            <>
                                                                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800 my-1" />
                                                                <DropdownMenuItem
                                                                    onClick={() => openDeleteDialog(u.id)}
                                                                    className="rounded-lg cursor-pointer px-4 py-2.5 text-sm font-black flex items-center gap-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    O'chirish
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Foydalanuvchini o'chirish
                        </AlertDialogTitle>
                        <AlertDialogDescription className="pt-2">
                            Ushbu amalni qaytarib bo'lmaydi. Foydalanuvchining barcha ma'lumotlari,
                            mahsulotlari, commentlari va boshqa bog'liq ma'lumotlar butunlay o'chib ketadi.
                            <br /><br />
                            <strong>Davom etasizmi?</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Bekor qilish
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    O'chirilmoqda...
                                </div>
                            ) : (
                                "O'chirish"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
