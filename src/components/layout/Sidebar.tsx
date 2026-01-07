import { Home, Repeat, Flag, Mic2, Gamepad2, Trophy, Flame, Music2, Search, Menu, ShoppingBag, Heart, User, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";

const sidebarItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Repeat, label: "Reels", path: "/reels" },
    { icon: ShoppingBag, label: "Products", path: "/products" },
    { icon: ShoppingCart, label: "Cart", path: "/cart" },
    { icon: Heart, label: "Favorites", path: "/favorites" },
];

const secondaryItems = [
    { icon: User, label: "Profile", path: "/profile" },
];

export const Sidebar = () => {
    const location = useLocation();
    const { getItemCount } = useCartStore();
    const itemCount = getItemCount();

    return (
        <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-64px)] fixed top-16 left-0 overflow-y-auto border-r border-border bg-background pt-2 px-3">
            <div className="space-y-1 mb-6">
                {sidebarItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-4 h-12 text-base font-normal rounded-xl",
                                    isActive && "bg-accent font-medium"
                                )}
                            >
                                <item.icon className="h-6 w-6" />
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.label === "Cart" && itemCount > 0 && (
                                    <span className="bg-primary text-primary-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                                        {itemCount}
                                    </span>
                                )}
                            </Button>
                        </Link>
                    );
                })}
            </div>

            <div className="border-t border-border my-2 pt-2 space-y-1">
                <h3 className="px-4 py-2 text-base font-semibold">You</h3>
                {secondaryItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-4 h-12 text-base font-normal rounded-xl",
                                    isActive && "bg-accent font-medium"
                                )}
                            >
                                <item.icon className="h-6 w-6" />
                                {item.label}
                            </Button>
                        </Link>
                    );
                })}
            </div>

            <div className="border-t border-border my-2 pt-4 px-4">
                <p className="text-xs text-muted-foreground">
                    © 2024 House Mobile
                    <br />
                    Tashkent, Uzbekistan
                </p>
            </div>
        </aside>
    );
};
