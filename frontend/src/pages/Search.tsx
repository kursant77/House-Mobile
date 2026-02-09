import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, ArrowLeft, User, ShoppingBag, Clapperboard, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { socialService } from "@/services/api/social";
import { productService } from "@/services/api/products";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProductCard } from "@/components/products/ProductCard";
import { SkeletonProductCard } from "@/components/products/SkeletonProductCard";

export default function Search() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const initialTab = searchParams.get("type") || "users";

    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync tab with URL
    useEffect(() => {
        const newParams = new URLSearchParams(searchParams);
        if (query) newParams.set("q", query);
        else newParams.delete("q");

        newParams.set("type", activeTab);
        setSearchParams(newParams, { replace: true });
    }, [query, activeTab]);

    // --- Queries ---

    const { data: users = [], isLoading: usersLoading } = useQuery({
        queryKey: ["search-users", query],
        queryFn: () => socialService.searchUsers(query),
        enabled: activeTab === "users" && query.length > 0,
    });

    const { data: products = [], isLoading: productsLoading } = useQuery({
        queryKey: ["search-products", query],
        queryFn: productService.getProducts, // Fetches all, filter locally or update API for search
        enabled: activeTab === "products" && query.length > 0,
        select: (data) => {
            if (!Array.isArray(data)) return [];
            return data.filter(p =>
                p?.title?.toLowerCase().includes(query.toLowerCase()) ||
                p?.description?.toLowerCase().includes(query.toLowerCase())
            );
        }
    });

    const { data: reels = [], isLoading: reelsLoading } = useQuery({
        queryKey: ["search-reels", query],
        queryFn: productService.getReels,
        enabled: activeTab === "reels" && query.length > 0,
        select: (data) => {
            if (!Array.isArray(data)) return [];
            return data.filter(r =>
                r?.product?.title?.toLowerCase().includes(query.toLowerCase())
            );
        }
    });

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-background border-b border-border p-2 gap-2 flex items-center">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        autoFocus
                        placeholder="Qidirish..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9 pr-8 h-10 rounded-full bg-muted border-none"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-3 rounded-none bg-background border-b h-12 p-0">
                    <TabsTrigger value="users" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                        Users
                    </TabsTrigger>
                    <TabsTrigger value="products" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                        Products
                    </TabsTrigger>
                    <TabsTrigger value="reels" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                        Reels
                    </TabsTrigger>
                </TabsList>

                <div className="p-4">
                    {/* USERS TAB */}
                    <TabsContent value="users" className="space-y-4 m-0">
                        {usersLoading && (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex items-center gap-4 p-2 rounded-xl">
                                        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                            <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!usersLoading && query && users.length === 0 && (
                            <div className="text-center py-20 text-muted-foreground">Foydalanuvchilar topilmadi</div>
                        )}

                        {users.map(user => (
                            <div key={user.id} onClick={() => navigate(`/profile/${user.id}`)} className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted active:scale-98 transition cursor-pointer">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{user.username}</h3>
                                    <p className="text-sm text-muted-foreground">{user.fullName}</p>
                                </div>
                            </div>
                        ))}
                    </TabsContent>

                    {/* PRODUCTS TAB */}
                    <TabsContent value="products" className="m-0">
                        {productsLoading && (
                            <div className="grid grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => <SkeletonProductCard key={i} />)}
                            </div>
                        )}
                        {!productsLoading && query && products.length === 0 && (
                            <div className="text-center py-20 text-muted-foreground">Mahsulotlar topilmadi</div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </TabsContent>

                    {/* REELS TAB (YouTube Style List) */}
                    <TabsContent value="reels" className="m-0 space-y-4">
                        {reelsLoading && (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-40 aspect-video rounded-lg bg-muted animate-pulse" />
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-4 w-full bg-muted animate-pulse rounded" />
                                            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                                            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!reelsLoading && query && reels.length === 0 && (
                            <div className="text-center py-20 text-muted-foreground">Videolar topilmadi</div>
                        )}

                        {reels.map(reel => (
                            <div
                                key={reel.id}
                                onClick={() => navigate(`/reels?id=${reel.product.id}`)}
                                className="flex gap-3 cursor-pointer group"
                            >
                                {/* Thumbnail */}
                                <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                    <img src={reel.thumbnailUrl} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                                        Reel
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 py-1">
                                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">{reel.product.title}</h3>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                        <span>{reel.product.author?.fullName || "House Mobile"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{reel.likes} likes</span>
                                        <span>•</span>
                                        <span>{reel.product.views || 0} views</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
