import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { Search, Filter, MoreVertical, Ban, CheckCircle, Shield, ShieldCheck, Mail, Calendar, UserPlus, ArrowRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UsersList() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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
        } catch (error: any) {
            toast.error("Foydalanuvchilarni yuklashda xatolik: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleBlock = async (id: string, isBlocked: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_blocked: !isBlocked })
                .eq('id', id);

            if (error) throw error;
            toast.success(isBlocked ? "Foydalanuvchi blokdan chiqarildi" : "Foydalanuvchi bloklandi");
            fetchUsers();
        } catch (error: any) {
            toast.error("Bloklashda xatolik: " + error.message);
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
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
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-[#f1f5f9] dark:bg-zinc-800 border-2 border-transparent group-hover:border-[#3C50E0]/30 transition-all flex items-center justify-center shrink-0 overflow-hidden">
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
                                                            : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                                                    )}>
                                                        {u.role}
                                                    </span>
                                                    {u.is_professional && (
                                                        <span className="bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border flex items-center gap-1">
                                                            <ShieldCheck className="h-3 w-3" /> PRO
                                                        </span>
                                                    )}
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
                                        <td className="py-5 px-6">
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
                                                    <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-xl p-1.5">
                                                        <DropdownMenuItem className="hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer px-4 py-2.5 text-sm font-bold flex items-center gap-3">
                                                            <UserPlus className="h-4 w-4 text-[#3C50E0]" /> Profilni ko'rish
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer px-4 py-2.5 text-sm font-bold flex items-center gap-3">
                                                            <Shield className="h-4 w-4 text-[#10B981]" /> Professional qilish
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800 my-1" />
                                                        <DropdownMenuItem
                                                            onClick={() => toggleBlock(u.id, u.is_blocked)}
                                                            className={cn(
                                                                "rounded-lg cursor-pointer px-4 py-2.5 text-sm font-black flex items-center gap-3",
                                                                u.is_blocked ? "text-green-600 hover:bg-green-50" : "text-red-600 hover:bg-red-50"
                                                            )}
                                                        >
                                                            {u.is_blocked ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                                            {u.is_blocked ? "Blokdan yechish" : "Bloklash"}
                                                        </DropdownMenuItem>
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
        </div>
    );
}
