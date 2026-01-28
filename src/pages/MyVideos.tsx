import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/api/products";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Film, Eye, Heart, MoreVertical, Trash2, Edit, Download, Share2, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";

interface Video {
    id: string;
    type: "reel";
    thumbnail: string;
    title: string;
    description: string;
    views: number;
    likes: number;
    duration: string;
    createdAt: Date;
}

const MyVideos = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: videos = [], isLoading } = useQuery({
        queryKey: ["my-videos", user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const products = await productService.getProductsByUserId(user.id);
            // Filter only products with videos
            const videoProducts = products.filter(p => p.videoUrl);
            
            // Batch fetch likes counts
            const productIds = videoProducts.map(p => p.id);
            const { data: likesData } = await supabase
                .from('product_likes')
                .select('product_id')
                .in('product_id', productIds);
            
            const likesCounts = new Map<string, number>();
            likesData?.forEach(like => {
                likesCounts.set(like.product_id, (likesCounts.get(like.product_id) || 0) + 1);
            });
            
            return videoProducts.map(p => ({
                id: p.id,
                type: "reel" as const,
                thumbnail: p.videoUrl || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "") || "",
                title: p.title || "",
                description: p.description || "",
                views: p.views || 0,
                likes: likesCounts.get(p.id) || 0,
                duration: "0:00", // Video duration not stored
                createdAt: new Date(p.createdAt || Date.now()),
            }));
        },
        enabled: !!user?.id,
    });

    const deleteMutation = useMutation({
        mutationFn: async (productId: string) => {
            await productService.deleteProduct(productId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-videos", user?.id] });
            toast.success("Video muvaffaqiyatli o'chirildi");
            setDeleteId(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Video o'chirishda xatolik");
        },
    });

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    const handleEdit = (id: string) => {
        navigate(`/upload?edit=${id}`);
    };

    const handleShare = async (id: string) => {
        try {
            const product = await productService.getProductById(id);
            if (product?.videoUrl) {
                await navigator.share({
                    title: product.title,
                    text: product.description,
                    url: `${window.location.origin}/product/${id}`,
                });
                toast.success("Video muvaffaqiyatli ulashildi");
            }
        } catch (error) {
            // User cancelled or share failed
            if (error instanceof Error && error.name !== 'AbortError') {
                toast.error("Ulashishda xatolik");
            }
        }
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-8">
            {/* Header */}
            <div className="sticky top-16 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 rounded-xl">
                                <Film className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Videolaringiz</h1>
                                <p className="text-sm text-muted-foreground">
                                    {videos.length} ta video
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => navigate("/upload")} className="gap-2">
                            <PlayCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">Yangi video</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {isLoading ? (
                    // Loading skeleton
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="space-y-2 animate-pulse">
                                <div className="aspect-[9/16] bg-muted rounded-lg" />
                                <div className="h-3 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : videos.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-8 rounded-full mb-6">
                            <Film className="h-16 w-16 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            Videolar yo'q
                        </h3>
                        <p className="text-muted-foreground max-w-md mb-6">
                            Siz hali hech qanday video yuklamagansiz. Birinchi videongizni yuklang va olamga ko'rsating!
                        </p>
                        <Button onClick={() => navigate("/upload")} className="gap-2">
                            <PlayCircle className="h-4 w-4" />
                            Video yuklash
                        </Button>
                    </div>
                ) : (
                    // Videos grid - Instagram style
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                        {videos.map((video) => (
                            <div key={video.id} className="group relative">
                                <Card
                                    onClick={() => navigate(`/product/${video.id}`)}
                                    className="overflow-hidden cursor-pointer border-0 shadow-none"
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${video.title} videoni ko'rish`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            navigate(`/product/${video.id}`);
                                        }
                                    }}
                                >
                                    <div className="relative aspect-[9/16] overflow-hidden bg-muted">
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title || video.description || "Video"}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />

                                        {/* Duration badge */}
                                        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white text-xs">
                                            {video.duration}
                                        </Badge>

                                        {/* Type indicator */}
                                        <div className="absolute top-2 right-2">
                                            <div className="bg-black/50 backdrop-blur-sm p-1.5 rounded-full">
                                                <Film className="h-3 w-3 text-white" />
                                            </div>
                                        </div>

                                        {/* Hover overlay with stats */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-4">
                                            <div className="flex items-center gap-4 text-white">
                                                <div className="flex items-center gap-1">
                                                    <Eye className="h-5 w-5" />
                                                    <span className="font-semibold">
                                                        {formatNumber(video.views)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Heart className="h-5 w-5" />
                                                    <span className="font-semibold">
                                                        {formatNumber(video.likes)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(video.id);
                                                    }}
                                                    className="gap-1 h-8"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                    <span className="text-xs">Tahrirlash</span>
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleShare(video.id)}>
                                                            <Share2 className="h-4 w-4 mr-2" />
                                                            Ulashish
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Yuklab olish
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteId(video.id)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            O'chirish
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Video info below thumbnail */}
                                <div className="mt-2 px-1">
                                    {(video.title || video.description) && (
                                        <p className="text-sm font-medium line-clamp-2 mb-1">
                                            {video.title || video.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(video.createdAt, {
                                            addSuffix: true,
                                            locale: uz
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Videoni o'chirish?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu video butunlay o'chiriladi. Bu amalni bekor qilib bo'lmaydi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && handleDelete(deleteId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default MyVideos;
