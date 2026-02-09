import { useState, useEffect } from "react";
import type { FC } from "react";
import { postService, PublicPost } from "@/services/api/posts";
import { Newspaper, Trash2, Edit, Search, Save, Loader2, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const AdminNews: FC = () => {
    const [posts, setPosts] = useState<PublicPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingPost, setEditingPost] = useState<PublicPost | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const data = await postService.getPosts();
            setPosts(data);
        } catch (error) {
            const err = error as Error;
            toast.error("Yangiliklarni yuklashda xatolik: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Rostdan ham ushbu yangilikni o'chirmoqchimisiz?")) return;
        try {
            await postService.deletePost(id);
            toast.success("Yangilik o'chirildi");
            fetchPosts();
        } catch (error) {
            const err = error as Error;
            toast.error("O'chirishda xatolik: " + err.message);
        }
    };

    const handleEdit = (post: PublicPost) => {
        setEditingPost({ ...post });
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingPost) return;
        setIsSaving(true);
        try {
            await postService.updatePost(editingPost.id, {
                title: editingPost.title,
                content: editingPost.content,
                mediaUrl: editingPost.mediaUrl,
                mediaType: editingPost.mediaType,
                category: editingPost.category
            });
            toast.success("Yangilik yangilandi");
            setIsEditDialogOpen(false);
            fetchPosts();
        } catch (error) {
            const err = error as Error;
            toast.error("Yangilashda xatolik: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredPosts = posts.filter(p =>
        (p.content?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (p.author?.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (p.id?.toString() || "").includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-zinc-800 dark:text-white tracking-tight">Yangiliklar Boshqaruvi</h2>
                    <p className="text-zinc-500 text-sm font-medium">Barcha postlar va yangiliklarni tahrirlash yoki o'chirish</p>
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

            {/* Posts Grid / Table */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-[#f7f9fc] text-left dark:bg-zinc-800/50">
                                <th className="min-w-[150px] py-4 px-6 text-xs font-black text-zinc-500 uppercase tracking-[2px]">Sarlavha</th>
                                <th className="min-w-[300px] py-4 px-6 text-xs font-black text-zinc-500 uppercase tracking-[2px]">Post Mazmuni</th>
                                <th className="min-w-[150px] py-4 px-6 text-xs font-black text-zinc-500 uppercase tracking-[2px]">Muallif</th>
                                <th className="min-w-[120px] py-4 px-6 text-xs font-black text-zinc-500 uppercase tracking-[2px]">Statistika</th>
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
                            ) : filteredPosts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-24 px-6 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Newspaper className="h-12 w-12 text-zinc-400" />
                                            <p className="text-zinc-500 font-black uppercase tracking-[3px] text-[10px]">Yangiliklar topilmadi</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPosts.map((p) => (
                                    <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all group">
                                        <td className="py-5 px-6">
                                            <span className="text-sm font-black text-zinc-700 dark:text-zinc-300 truncate max-w-[150px] block">{p.title || "---"}</span>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-14 rounded-xl bg-[#f1f5f9] dark:bg-zinc-800 border-2 border-transparent group-hover:border-[#3C50E0]/30 transition-all flex items-center justify-center shrink-0 overflow-hidden">
                                                    {p.mediaUrl ? (
                                                        p.mediaType === 'video' ? (
                                                            <div className="h-full w-full bg-black flex items-center justify-center">
                                                                <Clock className="h-4 w-4 text-white" />
                                                            </div>
                                                        ) : (
                                                            <img src={p.mediaUrl} className="h-full w-full object-cover" alt="" />
                                                        )
                                                    ) : (
                                                        <Newspaper className="h-6 w-6 text-zinc-300" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-zinc-800 dark:text-white truncate max-w-[250px]">{p.content}</span>
                                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{new Date(p.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 md:py-5 px-4 md:px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                                    {p.author?.avatarUrl ? (
                                                        <img src={p.author.avatarUrl} className="h-full w-full object-cover" alt="" />
                                                    ) : (
                                                        <span className="text-[10px] font-bold">{p.author?.fullName?.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">{p.author?.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 md:py-5 px-4 md:px-6">
                                            <div className="flex items-center gap-3 text-zinc-500">
                                                <div className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    <span className="text-[10px] font-black">{p.views || 0}</span>
                                                </div>
                                            </div>
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
                <DialogContent className="sm:max-w-[600px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-zinc-800 dark:text-white uppercase tracking-tighter">Yangilikni tahrirlash</DialogTitle>
                    </DialogHeader>
                    {editingPost && (
                        <div className="grid gap-5 md:gap-6 py-6 font-medium max-h-[70vh] overflow-y-auto pr-2">
                            <div className="grid gap-2">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Sarlavha</label>
                                <Input
                                    value={editingPost.title || ""}
                                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                                    className="bg-[#f7f9fc] dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11 md:h-12 rounded-lg font-bold"
                                    placeholder="Post sarlavhasi"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Post mazmuni</label>
                                <textarea
                                    className="flex min-h-[140px] md:min-h-[160px] w-full rounded-lg border border-zinc-200 bg-[#f7f9fc] px-4 py-3 text-sm font-bold dark:bg-zinc-900 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#3C50E0]/20"
                                    value={editingPost.content}
                                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Media URL (Rasm yoki Video)</label>
                                <Input
                                    value={editingPost.mediaUrl || ""}
                                    onChange={(e) => setEditingPost({ ...editingPost, mediaUrl: e.target.value })}
                                    className="bg-[#f7f9fc] dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11 md:h-12 rounded-lg font-bold"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Media Turi</label>
                                    <select
                                        className="bg-[#f7f9fc] dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11 rounded-lg font-bold px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3C50E0]/20"
                                        value={editingPost.mediaType || "image"}
                                        onChange={(e) => setEditingPost({ ...editingPost, mediaType: e.target.value as 'image' | 'video' })}
                                    >
                                        <option value="image">Rasm (Image)</option>
                                        <option value="video">Video</option>
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Kategoriya</label>
                                    <Input
                                        value={editingPost.category || ""}
                                        onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                                        className="bg-[#f7f9fc] dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11 md:h-12 rounded-lg font-bold"
                                        placeholder="masalan: xabar, yangilik"
                                    />
                                </div>
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
};

export default AdminNews;
