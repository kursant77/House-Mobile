import { Menu, Search, ShoppingCart, User, Bell, MapPin, Settings, LogOut, PlusSquare, ShieldCheck, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
import { cn } from "@/lib/utils";

export const Header = () => {
    const { user, isAuthenticated, logout } = useAuthStore();
    const { notifications, unreadCount, fetchNotifications, markAsRead, subscribe } = useNotificationStore();
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            const unsubscribe = subscribe();
            return () => unsubscribe();
        }
    }, [isAuthenticated]);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">

                {/* Left Section: Menu & Logo */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="hidden md:flex">
                        <Menu className="h-6 w-6" />
                    </Button>
                    <Link to="/" className="flex items-center gap-1">
                        <div className="bg-primary/10 p-1.5 rounded-lg md:hidden">
                            <span className="text-xl font-bold text-primary">H</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent hidden md:block">
                            House Mobile
                        </span>
                        <span className="md:hidden text-lg font-bold">House Mobile</span>
                    </Link>
                </div>

                {/* Center Section: Search (Hidden on small mobile, visible on desktop) */}
                <div className="hidden md:flex items-center flex-1 max-w-2xl mx-8">
                    <form onSubmit={handleSearch} className="flex w-full items-center">
                        <div className="relative w-full">
                            <Input
                                type="search"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-l-full rounded-r-none border-r-0 focus-visible:ring-0 pl-4 bg-muted/40 focus:bg-background transition-colors"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="rounded-l-none rounded-r-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-l-0 px-6 shrink-0"
                        >
                            <Search className="h-5 w-5" />
                        </Button>
                    </form>
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-1 md:gap-2">
                    <ThemeToggle />

                    {isAuthenticated && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative rounded-full">
                                    <Bell className="h-5 w-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
                                <DropdownMenuLabel className="flex items-center justify-between">
                                    <span>Bildirishnomalar</span>
                                    {unreadCount > 0 && (
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-black">
                                            {unreadCount} yangi
                                        </span>
                                    )}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-500">
                                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Hozircha xabarlar yo'q</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 10).map((n) => (
                                        <DropdownMenuItem
                                            key={n.id}
                                            className={cn(
                                                "p-4 flex flex-col items-start gap-1 cursor-pointer focus:bg-zinc-50 dark:focus:bg-zinc-800/50",
                                                !n.read_by.includes(user?.id || '') && "bg-blue-50/30 dark:bg-primary/5"
                                            )}
                                            onClick={() => markAsRead(n.id)}
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full shrink-0",
                                                    n.type === 'info' && "bg-blue-500",
                                                    n.type === 'success' && "bg-green-500",
                                                    n.type === 'warning' && "bg-orange-500",
                                                    n.type === 'error' && "bg-red-500",
                                                )} />
                                                <span className="text-xs font-black uppercase tracking-tight truncate flex-1">{n.title}</span>
                                                <span className="text-[9px] font-bold text-zinc-400 whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: uz })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-medium text-zinc-500 line-clamp-2 pl-4">
                                                {n.message}
                                            </p>
                                        </DropdownMenuItem>
                                    ))
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="justify-center text-xs font-black uppercase tracking-widest text-primary cursor-pointer py-3">
                                    Barchasini ko'rish
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}


                    <Link to="/upload" className="hidden md:block">
                        <Button className="rounded-full gap-2 px-6">
                            <PlusSquare className="h-4 w-4" />
                            Post
                        </Button>
                    </Link>


                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full text-primary font-medium w-auto px-2 md:px-4 gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
                                        {user?.avatarUrl ? (
                                            <img src={user.avatarUrl} className="h-full w-full object-cover" alt="avatar" />
                                        ) : (
                                            <User className="h-5 w-5 text-primary" />
                                        )}
                                    </div>
                                    <span className="hidden md:inline">{user?.name}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="text-zinc-900 dark:text-white">Profile</DropdownMenuLabel>
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
                                        <span>Profile</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/settings" className="flex items-center">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link to="/auth">
                            <Button variant="ghost" size="icon" className="rounded-full text-blue-600 font-medium w-auto px-2 md:px-4 gap-2">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <span className="hidden md:inline">Sign in</span>
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

function Mic2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" />
            <circle cx="17" cy="7" r="5" />
        </svg>
    )
}
