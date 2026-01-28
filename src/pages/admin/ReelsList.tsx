import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Clapperboard, Trash2, Play, Eye, Heart, MessageSquare, ExternalLink, Loader2, ArrowUpRight, Film, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ReelsList() {
    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReels();
    }, []);

    const fetchReels = async () => {
        setLoading(true);
        try {
            // Correcting the query to find products that HAVE a video in product_media
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    profiles!seller_id(full_name, avatar_url),
                    product_media!inner(*)
                `)
                .eq('product_media.type', 'video')
                .order('id', { ascending: false });

            if (error) throw error;

            // Format data to expose videoUrl easily
            const formattedReels = data.map(p => {
                const mediaArray = Array.isArray(p.product_media) ? p.product_media : [p.product_media];
                const videoMedia = mediaArray.find((m: any) => m.type === 'video');
                const imageMedia = mediaArray.find((m: any) => m.type === 'image');

                return {
                    ...p,
                    video_url: videoMedia?.url || null,
                    thumbnail_url: imageMedia?.url || null  // Only use actual images, not video
                };
            });

            setReels(formattedReels || []);
        } catch (error: any) {
            toast.error("Reels yuklashda xatolik: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Rostdan ham ushbu reelni o'chirmoqchimisiz?")) return;

        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            toast.success("Reel o'chirildi");
            fetchReels();
        } catch (error: any) {
            toast.error("Xatolik: " + error.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-zinc-800 dark:text-white tracking-tight">Reels Boshqaruvi</h2>
                    <p className="text-zinc-500 text-sm font-medium">Platformadagi barcha qisqa videolar va ularning statistikasi</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={fetchReels} variant="outline" className="border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-widest text-[10px] h-10 px-6 rounded-lg">
                        Yangilash
                    </Button>
                </div>
            </div>

            {/* Reels Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-[9/16] rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse border border-zinc-200 dark:border-zinc-800">
                            <div className="h-full w-full flex items-center justify-center opacity-20">
                                <Film className="h-12 w-12" />
                            </div>
                        </div>
                    ))
                ) : reels.length === 0 ? (
                    <div className="col-span-full py-24 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        <div className="flex flex-col items-center gap-3 opacity-30">
                            <Clapperboard className="h-16 w-16 text-zinc-400" />
                            <p className="text-zinc-500 font-black uppercase tracking-[4px] text-xs">Reellar topilmadi</p>
                        </div>
                    </div>
                ) : (
                    reels.map((reel) => (
                        <div key={reel.id} className="group relative aspect-[9/16] rounded-xl md:rounded-2xl bg-zinc-900 overflow-hidden shadow-xl border border-white/10 transition-transform duration-500 hover:scale-[1.02]">
                            {/* Video / Thumbnail Overlay */}
                            <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-800 to-zinc-900">
                                {reel.thumbnail_url ? (
                                    <>
                                        <img
                                            src={reel.thumbnail_url}
                                            alt={reel.title}
                                            className="h-full w-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                                            onError={(e) => {
                                                // Fallback if image fails to load
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                                    </>
                                ) : reel.video_url ? (
                                    <>
                                        <video
                                            src={reel.video_url}
                                            className="h-full w-full object-cover opacity-60"
                                            muted
                                            playsInline
                                            preload="metadata"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                                    </>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <Film className="h-20 w-20 text-zinc-700 opacity-30" />
                                    </div>
                                )}
                            </div>

                            {/* Interaction Icons Overlay */}
                            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                                <div className="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2 text-white">
                                    <Eye className="h-4 w-4 text-[#3C50E0]" />
                                    <span className="text-xs font-black">{reel.views || 0}</span>
                                </div>
                            </div>

                            {/* Content Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 z-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 md:h-10 md:w-10 rounded-full border-2 border-[#3C50E0] p-0.5 overflow-hidden shadow-lg shadow-[#3C50E0]/20">
                                        {reel.profiles?.avatar_url ? (
                                            <img src={reel.profiles.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white uppercase">
                                                {reel.profiles?.full_name?.charAt(0) || "U"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-white truncate max-w-[150px] shadow-sm">{reel.profiles?.full_name || "Unknown"}</span>
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Content Creator</span>
                                    </div>
                                </div>

                                <p className="text-sm text-zinc-200 line-clamp-2 font-medium leading-relaxed">
                                    {reel.title}
                                </p>

                                <div className="pt-2 flex items-center gap-2">
                                    <a href={reel.video_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                        <Button className="w-full bg-white/10 hover:bg-[#3C50E0] text-white border-white/10 rounded-xl h-11 font-black uppercase tracking-widest text-[10px] backdrop-blur-md transition-all">
                                            <Play className="h-4 w-4 mr-2 fill-current" /> Ko'rish
                                        </Button>
                                    </a>
                                    <Button
                                        onClick={() => handleDelete(reel.id)}
                                        variant="ghost"
                                        className="h-11 w-11 p-0 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
