import { Menu, Search, ShoppingCart, User, Bell, Settings, LogOut, PlusSquare, ShieldCheck, Info, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrencySymbol } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCartStore } from "@/store/cartStore";
import { socialService } from "@/services/api/social";
import { productService } from "@/services/api/products";
import { postService } from "@/services/api/posts";
import { useQuery } from "@tanstack/react-query";
import { VerifiedBadge } from "../ui/VerifiedBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Product } from "@/types/product";
import { PublicPost } from "@/services/api/posts";

import { useSidebarStore } from "@/store/sidebarStore";

export const Header = () => {
    const { user, isAuthenticated, logout } = useAuthStore();
    const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, subscribe, isLoading: notificationsLoading } = useNotificationStore();
    const [notificationOpen, setNotificationOpen] = useState(false);
    const { toggleOpen, toggleCollapsed } = useSidebarStore();
    const { getItemCount } = useCartStore();
    const cartCount = getItemCount();
    const isMobile = useIsMobile();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [activeSearchFilter, setActiveSearchFilter] = useState("all");
    const navigate = useNavigate();
    const location = useLocation();

    // Determine search context based on route
    const isReelsPage = location.pathname === "/reels";
    const isProductsPage = location.pathname === "/products" || location.pathname.startsWith("/product/");

    // Default context is 'users' (Global/Home)
    const searchContext = isReelsPage ? 'reels' : isProductsPage ? 'products' : 'users';

    const { data: userResults = [], isLoading: isSearchingUsers } = useQuery({
        queryKey: ["user-search", searchQuery],
        queryFn: () => socialService.searchUsers(searchQuery),
        enabled: searchQuery.trim().length > 0 && searchOpen,
        staleTime: 1000 * 30,
    });

    const { data: productResults = [], isLoading: isSearchingProducts } = useQuery({
        queryKey: ["product-search-header", searchQuery],
        queryFn: () => productService.getProducts({ limit: 50 }),
        enabled: searchQuery.trim().length > 0 && searchOpen,
        select: (data) => data.products.filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5),
        staleTime: 1000 * 30,
    });

    const { data: postResults = [], isLoading: isSearchingPosts } = useQuery({
        queryKey: ["post-search-header", searchQuery],
        queryFn: () => postService.getPosts(1, 40),
        enabled: searchQuery.trim().length > 0 && searchOpen,
        select: (data: PublicPost[]) => data.filter(p =>
            p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.content.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 8),
        staleTime: 1000 * 30,
    });

    const isSearching = isSearchingUsers || isSearchingProducts || isSearchingPosts;
    const hasAnyResults = userResults.length > 0 || productResults.length > 0 || postResults.length > 0;

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            const unsubscribe = subscribe();
            return () => unsubscribe();
        }
    }, [isAuthenticated]);

    // Clear search when navigating to a different page
    useEffect(() => {
        setSearchQuery("");
        setSearchOpen(false);
    }, [location.pathname]);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSearchOpen(false);

        if (!searchQuery.trim()) return;

        if (searchContext === 'reels') {
            navigate(`/reels?search=${encodeURIComponent(searchQuery.trim())}`);
        } else if (searchContext === 'products') {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            // Navigate to global search page
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=posts`);
        }
    };

    const handleUserClick = (userId: string) => {
        setSearchOpen(false);
        setSearchQuery("");
        navigate(`/profile/${userId}`);
    };

    const getSearchPlaceholder = () => {
        switch (searchContext) {
            case 'reels': return "Reels qidirish...";
            case 'products': return "Mahsulot qidirish...";
            default: return "Qidirish... (Foydalanuvchilar, Mahsulotlar, Postlar)";
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">

                {/* Left Section: Menu & Logo */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:flex rounded-full hover:bg-muted"
                        onClick={() => {
                            if (window.innerWidth >= 1312) {
                                toggleCollapsed();
                            } else {
                                toggleOpen();
                            }
                        }}
                        aria-label="Yon panelni ochish/yopish"
                        aria-expanded={!useSidebarStore.getState().isCollapsed}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                    <Link to="/" className="flex items-center gap-1">
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent hidden md:block">
                            House Mobile
                        </span>
                        <span className="md:hidden text-lg font-bold">House Mobile</span>
                    </Link>
                </div>

                {/* Center Section: Search (Hidden on small mobile, visible on desktop) */}
                <div className="hidden md:flex items-center flex-1 max-w-2xl mx-8 relative z-50">
                    <form onSubmit={handleSearch} className="flex w-full items-center relative" role="search" aria-label="Qidiruv">
                        <div className="relative w-full">
                            <Input
                                type="search"
                                placeholder={getSearchPlaceholder()}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setSearchOpen(true);
                                }}
                                onFocus={() => setSearchOpen(true)}
                                // We wait a bit before closing to allow clicking on results
                                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                                className="w-full rounded-l-full rounded-r-none border-r-0 focus-visible:ring-0 pl-4 bg-muted/40 focus:bg-background transition-colors"
                                aria-label="Qidiruv maydoni"
                                aria-expanded={searchOpen}
                                aria-controls="search-results"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="rounded-l-none rounded-r-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-l-0 px-6 shrink-0"
                            aria-label="Qidiruvni boshlash"
                        >
                            <Search className="h-5 w-5" />
                        </Button>
                    </form>

                    {/* Search Results Dropdown */}
                    {searchOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden max-h-[500px] flex flex-col z-[100]">
                            {/* Filter Bar */}
                            <div className="p-2 border-b bg-muted/20">
                                <Tabs value={activeSearchFilter} onValueChange={setActiveSearchFilter} className="w-full">
                                    <TabsList className="w-full h-9 bg-transparent p-0 gap-1 justify-start">
                                        <TabsTrigger value="all" className="h-7 px-3 text-[11px] rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Hammasi</TabsTrigger>
                                        <TabsTrigger value="posts" className="h-7 px-3 text-[11px] rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Postlar</TabsTrigger>
                                        <TabsTrigger value="products" className="h-7 px-3 text-[11px] rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Mahsulotlar</TabsTrigger>
                                        <TabsTrigger value="users" className="h-7 px-3 text-[11px] rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Foydalanuvchilar</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {isSearching ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                                        <p className="text-sm">Qidirilmoqda...</p>
                                    </div>
                                ) : hasAnyResults ? (
                                    <div className="p-2 space-y-2">
                                        {/* Posts Section */}
                                        {(activeSearchFilter === 'all' || activeSearchFilter === 'posts') && postResults.length > 0 && (
                                            <div>
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2">Postlar</h3>
                                                {postResults.map((post) => (
                                                    <button
                                                        key={post.id}
                                                        onClick={() => {
                                                            setSearchOpen(false);
                                                            setSearchQuery("");
                                                            navigate(`/post/${post.id}`);
                                                        }}
                                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                                                    >
                                                        <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0 border border-border/50">
                                                            {post.mediaUrl ? (
                                                                post.mediaType === 'video' ? (
                                                                    <video src={post.mediaUrl + "#t=0.1"} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <img src={post.mediaUrl} className="h-full w-full object-cover" onError={(e) => {
                                                                        // Fallback if image fails but we might want to try video if it was actually a video
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                    }} />
                                                                )
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center bg-primary/10">
                                                                    <Search className="h-4 w-4 text-primary" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold truncate">{post.title || "Post"}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{post.content}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Products Section */}
                                        {(activeSearchFilter === 'all' || activeSearchFilter === 'products') && productResults.length > 0 && (
                                            <div>
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2">Mahsulotlar</h3>
                                                {productResults.map((product: Product) => (
                                                    <button
                                                        key={product.id}
                                                        onClick={() => {
                                                            setSearchOpen(false);
                                                            setSearchQuery("");
                                                            navigate(`/product/${product.id}`);
                                                        }}
                                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                                                    >
                                                        <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0 border border-border/50">
                                                            {product.images && product.images.length > 0 ? (
                                                                <img src={product.images[0]} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center bg-primary/10">
                                                                    <ShoppingCart className="h-4 w-4 text-primary" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold truncate">{product.title}</p>
                                                            <p className="text-xs text-primary font-bold">{product.price.toLocaleString()} {formatCurrencySymbol(product.currency || "UZS")}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Users Section */}
                                        {(activeSearchFilter === 'all' || activeSearchFilter === 'users') && userResults.length > 0 && (
                                            <div>
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2">Foydalanuvchilar</h3>
                                                {userResults.map((userResult) => (
                                                    <button
                                                        key={userResult.id}
                                                        onClick={() => handleUserClick(userResult.id)}
                                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                                                    >
                                                        <Avatar size="md" showStatus={true} isOnline={true}>
                                                            <AvatarImage src={userResult.avatarUrl} />
                                                            <AvatarFallback>
                                                                {userResult.fullName?.charAt(0) || userResult.username?.charAt(0) || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1">
                                                                <p className="font-bold text-sm truncate">{userResult.username}</p>
                                                                {(userResult.role === 'super_admin' || userResult.role === 'blogger') && (
                                                                    <VerifiedBadge size={12} />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground truncate">{userResult.fullName}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {!isSearching && hasAnyResults && (
                                            <div className="sticky bottom-0 bg-background/80 backdrop-blur pb-2 px-2">
                                                <button
                                                    onClick={() => navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${activeSearchFilter === 'all' ? 'posts' : activeSearchFilter}`)}
                                                    className="w-full py-2 text-xs font-bold text-primary hover:bg-muted rounded-lg transition-colors"
                                                >
                                                    Barcha natijalarni ko'rish
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : searchQuery.trim() ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <p className="text-sm">Hech narsa topilmadi</p>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <p className="text-sm">Qidiruv so'zini kiriting (postlar, mahsulotlar, profillar)</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-1 md:gap-2">
                    {/* Mobile Search Icon - REMOVED AS REQUESTED */}

                    <ThemeToggle />

                    {/* Notifications Bell Icon */}
                    {isAuthenticated && (
                        <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative rounded-full hover:bg-muted transition-all hover:scale-105"
                                >
                                    <Bell className={cn(
                                        "h-5 w-5 transition-all",
                                        unreadCount > 0 && "animate-pulse"
                                    )} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background animate-bounce">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-80 md:w-96 max-h-[500px] overflow-y-auto p-0 bg-background border shadow-xl rounded-xl"
                            >
                                <div className="sticky top-0 bg-background border-b p-4 z-10 backdrop-blur-sm">
                                    <div className="flex items-center justify-between">
                                        <DropdownMenuLabel className="text-lg font-black text-foreground px-0">
                                            Bildirishnomalar
                                        </DropdownMenuLabel>
                                        {unreadCount > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await markAllAsRead();
                                                }}
                                                className="text-xs font-bold h-7 px-2 text-primary hover:text-primary/80"
                                            >
                                                Barchasini o'qildi deb belgilash
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="divide-y divide-border">
                                    {notificationsLoading ? (
                                        <div className="p-8 flex flex-col items-center gap-3">
                                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                            <p className="text-sm text-muted-foreground font-medium">Yuklanmoqda...</p>
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="p-12 flex flex-col items-center gap-3 text-center">
                                            <Bell className="h-12 w-12 text-muted-foreground/30" />
                                            <p className="text-sm font-bold text-muted-foreground">Bildirishnomalar yo'q</p>
                                            <p className="text-xs text-muted-foreground/70">Yangi xabarlar shu yerda ko'rinadi</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => {
                                            const isUnread = !notification.read_by?.includes(user?.id || '');
                                            const getTypeIcon = () => {
                                                switch (notification.type) {
                                                    case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
                                                    case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
                                                    case 'error': return <X className="h-5 w-5 text-red-500" />;
                                                    default: return <Info className="h-5 w-5 text-blue-500" />;
                                                }
                                            };
                                            const getTypeStyles = () => {
                                                switch (notification.type) {
                                                    case 'success': return "bg-green-50 dark:bg-green-950/20 text-green-500 border-green-100 dark:border-green-900";
                                                    case 'warning': return "bg-amber-50 dark:bg-amber-950/20 text-amber-500 border-amber-100 dark:border-amber-900";
                                                    case 'error': return "bg-red-50 dark:bg-red-950/20 text-red-500 border-red-100 dark:border-red-900";
                                                    default: return "bg-blue-50 dark:bg-blue-950/20 text-blue-500 border-blue-100 dark:border-blue-900";
                                                }
                                            };

                                            return (
                                                <DropdownMenuItem
                                                    key={notification.id}
                                                    onClick={async () => {
                                                        if (isUnread) {
                                                            await markAsRead(notification.id);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "p-4 cursor-pointer rounded-none border-l-4 border-transparent transition-all",
                                                        isUnread && "bg-muted/50 border-l-primary",
                                                        "hover:bg-muted focus:bg-muted"
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3 w-full">
                                                        <div className={cn(
                                                            "h-10 w-10 shrink-0 rounded-full flex items-center justify-center border-2 shadow-sm",
                                                            getTypeStyles()
                                                        )}>
                                                            {getTypeIcon()}
                                                        </div>
                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <h5 className="text-sm font-black text-foreground leading-tight">
                                                                    {notification.title}
                                                                </h5>
                                                                {isUnread && (
                                                                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-2">
                                                                {notification.message}
                                                            </p>
                                                            <span className="text-[10px] font-bold text-muted-foreground/70">
                                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: uz })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </DropdownMenuItem>
                                            );
                                        })
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Mobile Cart Icon */}
                    {isMobile && isAuthenticated && (
                        <Link to="/cart">
                            <Button variant="ghost" size="icon" className="relative">
                                <ShoppingCart className="h-5 w-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                                        {cartCount > 9 ? "9+" : cartCount}
                                    </span>
                                )}
                            </Button>
                        </Link>
                    )}

                    <Link to="/upload" className="hidden md:block">
                        <Button className="rounded-full gap-2 px-6">
                            <PlusSquare className="h-4 w-4" />
                            Post
                        </Button>
                    </Link>


                    {isAuthenticated ? (
                        <div className="hidden md:block">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full text-primary font-medium w-auto px-1 md:px-2 gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden shrink-0">
                                            {user?.avatarUrl ? (
                                                <img src={user.avatarUrl} className="h-full w-full object-cover" alt="avatar" />
                                            ) : (
                                                <User className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                        {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'blogger' || user?.role === 'seller') && (
                                            <VerifiedBadge size={14} className="shrink-0" />
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="text-zinc-900 dark:text-white">Profil</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {user?.role === 'super_admin' && (
                                        <>
                                            <Link to="/admin">
                                                <DropdownMenuItem className="cursor-pointer font-bold text-primary">
                                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                                    Admin Panel
                                                </DropdownMenuItem>
                                            </Link>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    <DropdownMenuItem asChild>
                                        <Link to="/profile" className="flex items-center">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profil</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/settings" className="flex items-center">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Sozlamalar</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Chiqish</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <Link to="/auth">
                            <Button variant="ghost" size="icon" className="rounded-full text-blue-600 font-medium w-auto px-2 md:px-4 gap-2">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <span className="hidden md:inline">Kirish</span>
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};
