import {
    Home,
    ShoppingBag,
    Heart,
    ShoppingCart,
    Film,
    X,
    History,
    Clock,
    ChevronRight,
    Settings,
    LayoutDashboard,
    User
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { socialService } from "@/services/api/social";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const mainItems = [
    { icon: Home, label: "Asosiy", path: "/" },
    { icon: Film, label: "Reels", path: "/reels" },
    { icon: ShoppingBag, label: "Mahsulotlar", path: "/products" },
];

const libraryItems = [
    { icon: ShoppingBag, label: "Buyurtmalarim", path: "/my-orders" },
    { icon: User, label: "Profil", path: "/profile" },
    { icon: History, label: "Tarix", path: "/history" },
    { icon: Clock, label: "Keyinroq ko'rish", path: "/watch-later" },
    { icon: Heart, label: "Sevimlilar", path: "/favorites" },
    { icon: ShoppingCart, label: "Savat", path: "/cart" },
    { icon: Settings, label: "Sozlamalar", path: "/settings" },
];



export const Sidebar = () => {
    const location = useLocation();
    const { getItemCount } = useCartStore();
    const { isOpen, isCollapsed, setOpen } = useSidebarStore();
    const { user } = useAuthStore();
    const itemCount = getItemCount();

    const isSeller = user?.role === 'blogger' || user?.role === 'seller';
    const sellerItems = isSeller ? [
        { icon: LayoutDashboard, label: "Sotuvchi kabineti", path: "/seller/dashboard" }
    ] : [];

    // Fetch followed profiles for "Obunalar" section
    const { data: following = [] } = useQuery({
        queryKey: ["following-profiles", user?.id],
        queryFn: () => socialService.getFollowedProfiles(),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!user?.id,
    });

    // Close drawer on navigation
    useEffect(() => {
        setOpen(false);
    }, [location.pathname, setOpen]);

    const NavItem = ({ item, collapsed }: { item: any, collapsed: boolean }) => {
        const isActive = location.pathname === item.path;
        return (
            <Link to={item.path} className="block">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full transition-all duration-200",
                        collapsed
                            ? "flex-col h-[74px] gap-1 px-1 py-1 text-[10px] justify-center items-center font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            : "justify-start gap-4 h-10 text-[14px] font-normal px-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        isActive && (collapsed ? "text-primary font-bold" : "bg-zinc-100 dark:bg-zinc-800 font-bold")
                    )}
                >
                    <item.icon className={cn("shrink-0", collapsed ? "h-6 w-6 mb-0.5" : "h-6 w-6", isActive && !collapsed && "text-primary")} />
                    <span className={cn("truncate", collapsed ? "w-full text-center text-[10px]" : "flex-1 text-left")}>
                        {item.label}
                    </span>
                    {!collapsed && item.label === "Savat" && itemCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                            {itemCount}
                        </span>
                    )}
                </Button>
            </Link>
        );
    };

    const SectionHeader = ({ title, link }: { title: string, link?: string }) => (
        <div className="px-3 pt-4 pb-1 group cursor-pointer">
            <div className="flex items-center justify-start gap-2 px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <span className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100">{title}</span>
                {link && <ChevronRight className="h-4 w-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
        </div>
    );

    const renderFullContent = () => (
        <div className="flex flex-col gap-1 pb-4">
            {/* Main Menu */}
            <div className="px-3 space-y-1">
                {mainItems.map(item => <NavItem key={item.path} item={item} collapsed={false} />)}
            </div>

            {isSeller && (
                <>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-3 mx-3" />
                    <div className="px-3 space-y-1">
                        {sellerItems.map(item => <NavItem key={item.path} item={item} collapsed={false} />)}
                    </div>
                </>
            )}

            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-3 mx-3" />

            {/* Library / "Siz" */}
            <SectionHeader title="Siz" link="/library" />
            <div className="px-3 space-y-1">
                {libraryItems.map(item => <NavItem key={item.path} item={item} collapsed={false} />)}
            </div>

            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-3 mx-3" />

            {/* Subscriptions / "Obunalar" */}
            <SectionHeader title="Obunalar" link="/subscriptions" />
            <div className="px-3 space-y-1">
                {following.slice(0, 7).map((profile) => (
                    <Link key={profile.id} to={`/profile/${profile.id}`}>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-4 h-10 text-[14px] font-normal px-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                            <Avatar size="sm" className="h-6 w-6">
                                <AvatarImage src={profile.avatarUrl} />
                                <AvatarFallback>{profile.fullName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="flex-1 text-left truncate">{profile.fullName}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                        </Button>
                    </Link>
                ))}
                {following.length > 7 && (
                    <Button variant="ghost" className="w-full justify-start gap-4 h-10 text-[14px] px-3">
                        <ChevronRight className="h-5 w-5 rotate-90" />
                        <span>Yana {following.length - 7} ta ko'rsatish</span>
                    </Button>
                )}
                {following.length === 0 && (
                    <p className="px-6 py-2 text-xs text-muted-foreground italic">Obunalar yo'q</p>
                )}
            </div>

            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-3 mx-3" />

            {/* Footer */}
            <div className="px-6 py-4 space-y-4">
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-[12px] font-medium text-zinc-500">
                    <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Haqida</a>
                    <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Matbuot</a>
                    <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Mualliflik huquqi</a>
                    <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Bog'lanish</a>
                    <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Bloggerlar</a>
                    <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Reklama</a>
                </div>
                <p className="text-[12px] text-zinc-400 font-bold">© 2024 House Mobile</p>
            </div>
        </div>
    );

    const renderMiniContent = () => (
        <div className="px-1 py-2 space-y-0">
            {mainItems.map(item => <NavItem key={item.path} item={item} collapsed={true} />)}
            {isSeller && sellerItems.map(item => <NavItem key={item.path} item={item} collapsed={true} />)}
            <NavItem item={{ icon: ShoppingBag, label: "Zakaz", path: "/my-orders" }} collapsed={true} />
            <NavItem item={{ icon: User, label: "Profil", path: "/profile" }} collapsed={true} />
            <NavItem item={{ icon: ShoppingCart, label: "Savat", path: "/cart" }} collapsed={true} />
        </div>
    );

    return (
        <>
            {/* 1. Desktop Mini Sidebar */}
            <aside className={cn(
                "hidden md:flex flex-col fixed top-16 left-0 bg-background h-[calc(100vh-64px)] z-30 transition-all duration-300 overflow-hidden",
                isCollapsed ? "w-[72px]" : "w-64 border-r border-border"
            )}>
                <div className="overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar">
                    {isCollapsed ? renderMiniContent() : renderFullContent()}
                </div>
            </aside>

            {/* 2. Full Overlay Sidebar (Drawer) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[100] animate-in fade-in duration-300"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside className={cn(
                "fixed top-0 left-0 h-full w-64 bg-background z-[110] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center px-4 gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full">
                        <X className="h-6 w-6" />
                    </Button>
                    <span className="font-bold text-xl tracking-tight">House Mobile</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {renderFullContent()}
                </div>
            </aside>
        </>
    );
};
