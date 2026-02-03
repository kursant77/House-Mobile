import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Film, ShoppingBag, X, Bookmark, Eye, Heart } from "lucide-react";
import { cn, formatPriceNumber, formatCurrencySymbol } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useWatchLaterStore } from "@/store/watchLaterStore";

const WatchLater = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { items, isLoading, fetchItems, removeItem } = useWatchLaterStore();

    useEffect(() => {
        if (user) {
            fetchItems();
        }
    }, [user, fetchItems]);

    const handleRemove = async (e: React.MouseEvent, productId: string) => {
        e.stopPropagation();
        await removeItem(productId);
        toast.success("Ro'yxatdan olib tashlandi");
    };

    const handleItemClick = (productId: string, hasVideo: boolean) => {
        if (hasVideo) navigate(`/reels?id=${productId}`);
        else navigate(`/product/${productId}`);
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // Using shared utility function from utils

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-8">
            {/* Header */}
            <div className="sticky top-16 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2.5 rounded-xl">
                            <Clock className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Keyinroq ko'rish</h1>
                            <p className="text-sm text-muted-foreground">
                                {items.length} ta saqlangan
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {isLoading ? (
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
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-8 rounded-full mb-6">
                            <Bookmark className="h-16 w-16 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Ro'yxat bo'sh</h3>
                        <p className="text-muted-foreground max-w-md mb-6">
                            Keyinroq ko'rmoqchi bo'lgan videolarni bu yerga saqlang. Video ustidagi soat belgisini bosing.
                        </p>
                        <Button onClick={() => navigate("/")} className="gap-2">
                            <Film className="h-4 w-4" />
                            Videolarni ko'rish
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item) => (
                            <Card
                                key={item.id}
                                onClick={() => handleItemClick(item.id, !!item.videoUrl)}
                                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                            >
                                <div className="relative aspect-video overflow-hidden bg-muted">
                                    <img
                                        src={item.images && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=75'}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />

                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        onClick={(e) => handleRemove(e, item.id)}
                                        className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>

                                    <Badge
                                        className={cn(
                                            "absolute top-2 left-2 gap-1 z-10",
                                            item.videoUrl ? "bg-purple-500" : "bg-blue-500"
                                        )}
                                    >
                                        {item.videoUrl ? (
                                            <Film className="h-3 w-3" />
                                        ) : (
                                            <ShoppingBag className="h-3 w-3" />
                                        )}
                                        <span className="text-xs font-medium capitalize">
                                            {item.videoUrl ? "Video" : "Maxsulot"}
                                        </span>
                                    </Badge>

                                    {item.videoUrl && (
                                        <div className="absolute bottom-2 left-2 z-10">
                                            <div className="bg-amber-500 p-1.5 rounded-full shadow-lg">
                                                <Clock className="h-3 w-3 text-white" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                </div>

                                <div className="p-4">
                                    <h3 className="font-semibold text-sm line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h3>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-primary">
                                            {formatPriceNumber(item.price)} {formatCurrencySymbol(item.currency || "UZS")}
                                        </span>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-3.5 w-3.5" />
                                                <span>{formatNumber(item.views || 0)}</span>
                                            </div>
                                            {!!item.rating && (
                                                <div className="flex items-center gap-1">
                                                    <Heart className="h-3.5 w-3.5" />
                                                    <span>{item.rating}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WatchLater;
