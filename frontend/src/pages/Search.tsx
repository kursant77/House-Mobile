import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search as SearchIcon,
    ArrowLeft,
    User,
    ShoppingBag,
    Clapperboard,
    X,
    Clock,
    TrendingUp,
    FileText,
    Trash2,
    Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProductCard } from "@/components/products/ProductCard";
import { SkeletonProductCard } from "@/components/products/SkeletonProductCard";
import { PostCard } from "@/components/social/PostCard";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { searchService } from "@/services/api/searchService";

export default function Search() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const initialTab = searchParams.get("type") || "products";

    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const debouncedQuery = useDebounce(query, 300);
    const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();
    const trending = useMemo(() => searchService.getTrendingSearches(), []);

    // Sync URL
    useEffect(() => {
        const newParams = new URLSearchParams(searchParams);
        if (debouncedQuery) newParams.set("q", debouncedQuery);
        else newParams.delete("q");
        newParams.set("type", activeTab);
        setSearchParams(newParams, { replace: true });
    }, [debouncedQuery, activeTab]);

    // Add to history when user actually searches
    useEffect(() => {
        if (debouncedQuery.length >= 2) {
            addToHistory(debouncedQuery);
        }
    }, [debouncedQuery, addToHistory]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Autocomplete suggestions
    const suggestions = useMemo(
        () => searchService.getAutocompleteSuggestions(query, history),
        [query, history]
    );

    const handleSelectSuggestion = (text: string) => {
        setQuery(text);
        setShowSuggestions(false);
        inputRef.current?.blur();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            addToHistory(query.trim());
            setShowSuggestions(false);
            inputRef.current?.blur();
        }
    };

    // --- Server-side Queries ---

    const { data: users = [], isLoading: usersLoading } = useQuery({
        queryKey: ["search-users", debouncedQuery],
        queryFn: () => searchService.searchUsers(debouncedQuery),
        enabled: activeTab === "users" && debouncedQuery.length >= 2,
    });

    const { data: productsResult, isLoading: productsLoading } = useQuery({
        queryKey: ["search-products", debouncedQuery],
        queryFn: () => searchService.searchProducts(debouncedQuery),
        enabled: activeTab === "products" && debouncedQuery.length >= 2,
    });
    const products = productsResult?.products || [];

    const { data: posts = [], isLoading: postsLoading } = useQuery({
        queryKey: ["search-posts", debouncedQuery],
        queryFn: () => searchService.searchPosts(debouncedQuery),
        enabled: activeTab === "posts" && debouncedQuery.length >= 2,
    });

    const { data: reels = [], isLoading: reelsLoading } = useQuery({
        queryKey: ["search-reels", debouncedQuery],
        queryFn: () => searchService.searchReels(debouncedQuery),
        enabled: activeTab === "reels" && debouncedQuery.length >= 2,
    });

    const isAnyLoading = usersLoading || productsLoading || postsLoading || reelsLoading;
    const hasQuery = debouncedQuery.length >= 2;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <form onSubmit={handleSubmit} className="sticky top-0 z-50 bg-background border-b border-border p-2 gap-2 flex items-center">
                <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        autoFocus
                        placeholder="Qidirish..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="pl-9 pr-8 h-10 rounded-full bg-muted border-none"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setShowSuggestions(false);
                                inputRef.current?.focus();
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    {/* Autocomplete / Suggestions Dropdown */}
                    {showSuggestions && query.length >= 1 && suggestions.length > 0 && (
                        <div
                            ref={suggestionsRef}
                            className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                        >
                            {suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(suggestion)}
                                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-muted transition-colors"
                                >
                                    <SearchIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{suggestion}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {isAnyLoading && hasQuery && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </form>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-4 rounded-none bg-background border-b h-12 p-0">
                    <TabsTrigger value="products" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm gap-1">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Mahsulotlar</span>
                        <span className="sm:hidden">Tovar</span>
                    </TabsTrigger>
                    <TabsTrigger value="posts" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Postlar</span>
                        <span className="sm:hidden">Post</span>
                    </TabsTrigger>
                    <TabsTrigger value="reels" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm gap-1">
                        <Clapperboard className="h-3.5 w-3.5" />
                        Reels
                    </TabsTrigger>
                    <TabsTrigger value="users" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm gap-1">
                        <User className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Foydalanuvchilar</span>
                        <span className="sm:hidden">User</span>
                    </TabsTrigger>
                </TabsList>

                <div className="p-4">
                    {/* ========== NO QUERY — Show History + Trending ========== */}
                    {!hasQuery && (
                        <div className="space-y-6 max-w-xl mx-auto">
                            {/* Search History */}
                            {history.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Qidiruv tarixi
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearHistory}
                                            className="text-xs text-muted-foreground hover:text-destructive h-7"
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            Tozalash
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        {history.slice(0, 10).map((item, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors group cursor-pointer"
                                                onClick={() => handleSelectSuggestion(item)}
                                            >
                                                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <span className="text-sm flex-1 truncate">{item}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFromHistory(item);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background rounded-full"
                                                >
                                                    <X className="h-3 w-3 text-muted-foreground" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Trending */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                                    <TrendingUp className="h-4 w-4" />
                                    Trend qidiruvlar
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {trending.map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSelectSuggestion(item)}
                                            className="px-3 py-1.5 text-sm rounded-full border border-border bg-muted/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========== PRODUCTS TAB ========== */}
                    <TabsContent value="products" className="m-0">
                        {hasQuery && productsLoading && (
                            <div className="grid grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => <SkeletonProductCard key={i} />)}
                            </div>
                        )}
                        {hasQuery && !productsLoading && products.length === 0 && (
                            <div className="text-center py-20">
                                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                <p className="text-muted-foreground">"{debouncedQuery}" bo'yicha mahsulotlar topilmadi</p>
                            </div>
                        )}
                        {hasQuery && !productsLoading && products.length > 0 && (
                            <>
                                <p className="text-xs text-muted-foreground mb-3">
                                    {productsResult?.total || products.length} ta natija topildi
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    {products.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* ========== POSTS TAB ========== */}
                    <TabsContent value="posts" className="m-0">
                        {hasQuery && postsLoading && (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex flex-col gap-3">
                                        <div className="aspect-video w-full rounded-xl bg-muted animate-pulse" />
                                        <div className="flex gap-3 px-1">
                                            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                                                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {hasQuery && !postsLoading && posts.length === 0 && (
                            <div className="text-center py-20">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                <p className="text-muted-foreground">"{debouncedQuery}" bo'yicha postlar topilmadi</p>
                            </div>
                        )}
                        {hasQuery && !postsLoading && posts.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-8 gap-x-4">
                                {posts.map(post => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ========== REELS TAB ========== */}
                    <TabsContent value="reels" className="m-0 space-y-4">
                        {hasQuery && reelsLoading && (
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
                        {hasQuery && !reelsLoading && reels.length === 0 && (
                            <div className="text-center py-20">
                                <Clapperboard className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                <p className="text-muted-foreground">"{debouncedQuery}" bo'yicha videolar topilmadi</p>
                            </div>
                        )}
                        {hasQuery && !reelsLoading && reels.map(reel => (
                            <div
                                key={reel.id}
                                onClick={() => navigate(`/reels?id=${reel.productId}`)}
                                className="flex gap-3 cursor-pointer group"
                            >
                                <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                    {reel.thumbnailUrl ? (
                                        <img src={reel.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Clapperboard className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                                        Reel
                                    </div>
                                </div>
                                <div className="flex-1 py-1">
                                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">
                                        {reel.title}
                                    </h3>
                                    {reel.authorName && (
                                        <p className="text-xs text-muted-foreground mb-1">
                                            {reel.authorName}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{reel.views} ko'rish</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </TabsContent>

                    {/* ========== USERS TAB ========== */}
                    <TabsContent value="users" className="space-y-4 m-0">
                        {hasQuery && usersLoading && (
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
                        {hasQuery && !usersLoading && users.length === 0 && (
                            <div className="text-center py-20">
                                <User className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                <p className="text-muted-foreground">"{debouncedQuery}" bo'yicha foydalanuvchilar topilmadi</p>
                            </div>
                        )}
                        {users.map((user: any) => (
                            <div
                                key={user.id}
                                onClick={() => navigate(`/profile/${user.id}`)}
                                className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted active:scale-[0.98] transition cursor-pointer"
                            >
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback>{user.fullName?.charAt(0) || user.username?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{user.username}</h3>
                                    <p className="text-sm text-muted-foreground">{user.fullName}</p>
                                </div>
                            </div>
                        ))}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
