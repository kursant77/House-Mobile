import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { History as HistoryIcon, Clock, Film, ShoppingBag, Image, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { historyService, ContentType } from "@/services/api/history";
import { toast } from "sonner";

type FilterType = "all" | ContentType;

const History = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<FilterType>("all");
    const [showClearDialog, setShowClearDialog] = useState(false);

    // Fetch history from API
    const { data: history = [], isLoading } = useQuery({
        queryKey: ["view-history", filter],
        queryFn: () => historyService.getHistory(filter),
    });

    // Clear history mutation
    const clearMutation = useMutation({
        mutationFn: () => historyService.clearHistory(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["view-history"] });
            toast.success("Tarix tozalandi");
            setShowClearDialog(false);
        },
        onError: () => {
            toast.error("Xatolik yuz berdi");
        },
    });



    const handleItemClick = (item: typeof history[0]) => {
        if (item.type === "reel") navigate(`/reels?id=${item.contentId}`);
        else if (item.type === "post") navigate(`/post/${item.contentId}`);
        else navigate(`/product/${item.contentId}`);
    };

    const filters: { value: FilterType; label: string; icon: any }[] = [
        { value: "all", label: "Hammasi", icon: HistoryIcon },
        { value: "reel", label: "Reels", icon: Film },
        { value: "post", label: "Postlar", icon: Image },
        { value: "product", label: "Mahsulotlar", icon: ShoppingBag },
    ];

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-8">
            {/* Header */}
            <div className="sticky top-16 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-xl">
                                <HistoryIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Tarix</h1>
                                <p className="text-sm text-muted-foreground">
                                    Ko'rilgan kontentlar
                                </p>
                            </div>
                        </div>
                        {history.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowClearDialog(true)}
                                className="gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Tozalash</span>
                            </Button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {filters.map((f) => {
                            const Icon = f.icon;
                            return (
                                <button
                                    key={f.value}
                                    onClick={() => setFilter(f.value)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap",
                                        filter === f.value
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                            : "bg-secondary hover:bg-secondary/80"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{f.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {isLoading ? (
                    // Loading skeleton
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="overflow-hidden animate-pulse">
                                <div className="aspect-video bg-muted" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-muted rounded w-3/4" />
                                    <div className="h-3 bg-muted rounded w-1/2" />
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : history.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 rounded-full mb-6">
                            <HistoryIcon className="h-16 w-16 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            Tarix bo'sh
                        </h3>
                        <p className="text-muted-foreground max-w-md mb-6">
                            Siz hali hech qanday kontent ko'rmadingiz. Reels, postlar va mahsulotlarni ko'rib chiqishni boshlang!
                        </p>
                        <Button onClick={() => navigate("/")} className="gap-2">
                            <HistoryIcon className="h-4 w-4" />
                            Asosiy sahifaga o'tish
                        </Button>
                    </div>
                ) : (
                    // History grid
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {history.map((item) => (
                            <Card
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                            >
                                <div className="relative aspect-video overflow-hidden bg-muted group-hover:bg-muted/80 transition-colors">
                                    {item.hasMedia ? (
                                        item.mediaType === 'video' ? (
                                            <video
                                                src={item.videoUrl}
                                                poster={item.thumbnail}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                muted
                                                playsInline
                                                onMouseOver={(e) => e.currentTarget.play()}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.pause();
                                                    e.currentTarget.currentTime = 0;
                                                }}
                                            />
                                        ) : (
                                            <img
                                                src={item.thumbnail}
                                                alt={item.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                onError={(e) => {
                                                    // On error, show text-based fallback
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) {
                                                        e.currentTarget.style.display = 'none';
                                                        const fallback = parent.querySelector('.text-fallback');
                                                        if (fallback) fallback.classList.remove('hidden');
                                                    }
                                                }}
                                            />
                                        )
                                    ) : null}

                                    {/* Text-based fallback (visible if hasMedia is false or image fails to load) */}
                                    <div className={cn(
                                        "text-fallback absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-zinc-800 to-zinc-900 transition-opacity duration-300",
                                        item.hasMedia ? "hidden" : "flex"
                                    )}>
                                        <div className="absolute top-0 left-0 w-full h-1 bg-primary/30" />
                                        <h4 className="font-bold text-sm text-white line-clamp-2 mb-2 px-2 uppercase tracking-tight">
                                            {item.title || 'Sarlahasiz'}
                                        </h4>
                                        {item.description && (
                                            <p className="text-[10px] text-zinc-400 line-clamp-3 leading-relaxed opacity-80">
                                                {item.description}
                                            </p>
                                        )}
                                        <div className="mt-4 p-1.5 rounded-full bg-white/5 border border-white/10">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Type badge */}
                                    <Badge
                                        className={cn(
                                            "absolute top-2 left-2 gap-1",
                                            item.type === "reel" && "bg-purple-500",
                                            item.type === "post" && "bg-blue-500",
                                            item.type === "product" && "bg-green-500"
                                        )}
                                    >
                                        {item.type === "reel" && <Film className="h-3 w-3" />}
                                        {item.type === "post" && <Image className="h-3 w-3" />}
                                        {item.type === "product" && <ShoppingBag className="h-3 w-3" />}
                                        <span className="text-xs font-medium capitalize">
                                            {item.type}
                                        </span>
                                    </Badge>

                                    {/* Duration for reels */}
                                    {item.duration && (
                                        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                                            {item.duration}
                                        </Badge>
                                    )}

                                    {/* Overlay gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <div className="p-4">
                                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h3>

                                    {item.author && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={item.author.avatar} />
                                                <AvatarFallback className="text-xs">
                                                    {item.author.name?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs text-muted-foreground font-medium">
                                                {item.author.name}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>
                                            {formatDistanceToNow(item.viewedAt, {
                                                addSuffix: true,
                                                locale: uz
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Clear History Dialog */}
            <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tarixni tozalash?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu amal barcha ko'rish tarixini o'chiradi. Bu amalni bekor qilib bo'lmaydi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => clearMutation.mutate()}
                            disabled={clearMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {clearMutation.isPending ? "Tozalanmoqda..." : "Tozalash"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default History;
