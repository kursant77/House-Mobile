import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShoppingBag, Trash2, Edit, Search, Filter, MoreVertical, ExternalLink, Package, Save, X, Loader2, ArrowRight, Tag, Boxes } from "lucide-react";
import { cn, formatCurrencySymbol } from "@/lib/utils";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export default function ProductsList() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error: any) {
            toast.error("Mahsulotlarni yuklashda xatolik: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Rostdan ham ushbu mahsulotni o'chirmoqchimisiz?")) return;

        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            toast.success("Mahsulot o'chirildi");
            fetchProducts();
        } catch (error: any) {
            toast.error("O'chirishda xatolik: " + error.message);
        }
    };

    const handleEdit = (product: any) => {
        setEditingProduct({ ...product });
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingProduct) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('products')
                .update({
                    title: editingProduct.title,
                    price: editingProduct.price,
                    description: editingProduct.description,
                    category: editingProduct.category,
                    in_stock: editingProduct.in_stock
                })
                .eq('id', editingProduct.id);

            if (error) throw error;
            toast.success("Mahsulot yangilandi");
            setIsEditDialogOpen(false);
            fetchProducts();
        } catch (error: any) {
            toast.error("Yangilashda xatolik: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStock = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ in_stock: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            toast.success("Statut yangilandi");
            fetchProducts();
        } catch (error: any) {
            toast.error("Xatolik: " + error.message);
        }
    };

    const filteredProducts = products.filter(p =>
        (p.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (p.category?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (p.id?.toString() || "").includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-zinc-800 dark:text-white tracking-tight">Mahsulotlar Ombori</h2>
                    <p className="text-zinc-500 text-sm font-medium">Platformadagi barcha e'lonlar va mahsulotlar boshqaruvi</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Qidirish..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#f7f9fc] dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 pl-10 h-11 w-64 rounded-lg focus-visible:ring-[#3C50E0]/20"
                        />
                    </div>
                </div>
            </div>

            {/* Products Grid / Table */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-[#f7f9fc] text-left dark:bg-zinc-800/50">
                                <th className="min-w-[250px] py-4 px-6 text-xs font-black text-zinc-500 uppercase tracking-[2px]">Mahsulot</th>
                                <th className="min-w-[150px] py-4 px-6 text-xs font-black text-zinc-500 uppercase tracking-[2px]">Kategoriyam & Narx</th>
                                <th className="min-w-[120px] py-4 px-6 text-xs font-black text-zinc-500 uppercase tracking-[2px]">Holat</th>
                                <th className="py-4 px-6 text-right text-xs font-black text-zinc-500 uppercase tracking-[2px]">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="py-10 px-6 text-center text-zinc-300 dark:text-zinc-700 font-bold uppercase tracking-widest text-[10px]">Ma'lumotlar olinmoqda...</td>
                                    </tr>
                                ))
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-24 px-6 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Package className="h-12 w-12 text-zinc-400" />
                                            <p className="text-zinc-500 font-black uppercase tracking-[3px] text-[10px]">Mahsulotlar topilmadi</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((p) => (
                                    <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all group">
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-14 rounded-xl bg-[#f1f5f9] dark:bg-zinc-800 border-2 border-transparent group-hover:border-[#3C50E0]/30 transition-all flex items-center justify-center shrink-0 overflow-hidden">
                                                    <ShoppingBag className="h-6 w-6 text-zinc-300" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-black text-zinc-800 dark:text-white truncate max-w-[200px]">{p.title}</span>
                                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest truncate">{p.id.slice(0, 12)}...</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 md:py-5 px-4 md:px-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-xs font-black text-[#3C50E0] dark:text-[#80CAEE] uppercase tracking-tighter flex items-center gap-1.5">
                                                    <Tag className="h-3 w-3" /> {p.category}
                                                </span>
                                                <span className="text-sm font-black text-zinc-800 dark:text-white">
                                                    {p.price?.toLocaleString()} {formatCurrencySymbol(p.currency || "UZS")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <button
                                                onClick={() => toggleStock(p.id, p.in_stock)}
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                                    p.in_stock
                                                        ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"
                                                        : "bg-red-500/10 text-red-500 border-red-500/20"
                                                )}
                                            >
                                                <div className={cn("h-1.5 w-1.5 rounded-full", p.in_stock ? "bg-[#10B981]" : "bg-red-500")} />
                                                {p.in_stock ? "Sotuvda" : "Tugagan"}
                                            </button>
                                        </td>
                                        <td className="py-4 md:py-5 px-4 md:px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    onClick={() => handleEdit(p)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 md:h-10 md:w-10 text-zinc-400 hover:text-[#3C50E0] hover:bg-[#3C50E0]/10 rounded-lg transition-colors"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleDelete(p.id)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 md:h-10 md:w-10 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-zinc-800 dark:text-white uppercase tracking-tighter">Mahsulotni tahrirlash</DialogTitle>
                    </DialogHeader>
                    {editingProduct && (
                        <div className="grid gap-5 md:gap-6 py-6 font-medium">
                            <div className="grid gap-2">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Mahsulot nomi</label>
                                <Input
                                    value={editingProduct.title}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                                    className="bg-[#f7f9fc] dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11 md:h-12 rounded-lg font-bold"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Narxi</label>
                                    <Input
                                        type="number"
                                        value={editingProduct.price}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                                        className="bg-[#f7f9fc] dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11 md:h-12 rounded-lg font-bold"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Kategoriya</label>
                                    <Input
                                        value={editingProduct.category}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                        className="bg-[#f7f9fc] dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11 md:h-12 rounded-lg font-bold"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Holati</label>
                                <div className="flex items-center gap-4">
                                    <Button
                                        type="button"
                                        variant={editingProduct.in_stock ? "default" : "outline"}
                                        onClick={() => setEditingProduct({ ...editingProduct, in_stock: true })}
                                        className="flex-1 h-10 rounded-lg font-bold"
                                    >
                                        Sotuvda
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={!editingProduct.in_stock ? "destructive" : "outline"}
                                        onClick={() => setEditingProduct({ ...editingProduct, in_stock: false })}
                                        className="flex-1 h-10 rounded-lg font-bold"
                                    >
                                        Tugagan
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Tavsif</label>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-lg border border-zinc-200 bg-[#f7f9fc] px-4 py-3 text-sm font-bold dark:bg-zinc-900 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#3C50E0]/20"
                                    value={editingProduct.description}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="font-black uppercase tracking-widest text-xs h-12 px-8 rounded-lg">Bekor qilish</Button>
                        <Button
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            className="bg-[#3C50E0] hover:bg-[#2b3cb5] text-white font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl shadow-lg shadow-[#3C50E0]/20 min-w-[140px]"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Saqlash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
