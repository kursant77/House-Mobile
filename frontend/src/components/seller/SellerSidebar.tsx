import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    DollarSign,
    Star,
    Gift,
    Settings,
    LogOut,
    X,
    Store,
    BarChart3,
    MessageSquare,
    Upload,
    TrendingUp
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";

const menuGroups = [
    {
        name: "ASOSIY",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", path: "/seller/dashboard" },
            { icon: ShoppingBag, label: "Buyurtmalar", path: "/seller/orders", badge: "Yangi" },
            { icon: Package, label: "Inventar", path: "/seller/inventory" },
            { icon: DollarSign, label: "Moliya", path: "/seller/financial" },
        ]
    },
    {
        name: "MARKETING",
        items: [
            { icon: Gift, label: "Aksiyalar", path: "/seller/promotions" },
            { icon: BarChart3, label: "Analitika", path: "/seller/analytics" },
            { icon: Star, label: "Sharhlar", path: "/seller/reviews" },
        ]
    },
    {
        name: "BOSHQALAR",
        items: [
            { icon: MessageSquare, label: "Xabarlar", path: "/messages" },
            { icon: Upload, label: "Yuklash", path: "/upload-product" },
            { icon: Settings, label: "Sozlamalar", path: "/seller/settings" },
        ]
    }
];

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
}

export const SellerSidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();

    return (
        <>
            {/* Mobile Overlay - only show on mobile when sidebar is open */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed left-0 top-0 z-[999] flex h-screen w-80 sm:w-72 flex-col overflow-y-hidden bg-card duration-300 ease-linear lg:static lg:translate-x-0 shadow-2xl lg:shadow-none border-r border-border",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between gap-2 px-5 md:px-6 py-6 md:py-8 lg:py-10 border-b border-border bg-gradient-to-r from-primary/5 to-blue-500/5">
                    <Link to="/seller/dashboard" className="flex items-center gap-3 group">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all group-hover:scale-110">
                            <Store className="text-white h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-foreground tracking-tight text-xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                Sotuvchi
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest -mt-1">
                                Panel
                            </span>
                        </div>
                    </Link>

                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="block lg:hidden text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Quick Stats Banner */}
                <div className="mx-4 mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10 border border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground font-semibold">Oylik daromad</p>
                            <p className="text-lg font-black text-foreground">0 UZS</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Content */}
                <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-4 py-6 md:py-8 duration-300 ease-linear">
                    <nav className="space-y-8">
                        {menuGroups.map((group) => (
                            <div key={group.name} className="space-y-1.5">
                                <h3 className="mb-4 ml-4 text-xs font-black text-muted-foreground uppercase tracking-[3px]">
                                    {group.name}
                                </h3>
                                <ul className="space-y-1">
                                    {group.items.map((item) => {
                                        const isActive = location.pathname === item.path;

                                        return (
                                            <li key={item.path}>
                                                <Link
                                                    to={item.path}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={cn(
                                                        "group relative flex items-center gap-4 rounded-xl px-4 py-3.5 font-semibold transition-all duration-200",
                                                        isActive
                                                            ? "bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary shadow-sm"
                                                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                    )}
                                                >
                                                    <item.icon
                                                        className={cn(
                                                            "h-5 w-5 shrink-0 transition-all",
                                                            isActive ? "text-primary" : "opacity-60 group-hover:opacity-100"
                                                        )}
                                                    />
                                                    <span className="flex-1">{item.label}</span>
                                                    {item.badge && (
                                                        <Badge
                                                            variant="default"
                                                            className="text-[9px] px-2 py-0.5 h-5 bg-gradient-to-r from-emerald-500 to-teal-500 border-0"
                                                        >
                                                            {item.badge}
                                                        </Badge>
                                                    )}
                                                    {isActive && (
                                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-primary to-blue-600 rounded-l-full shadow-[0_0_10px_hsl(var(--primary))]" />
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Sidebar Footer / User Profile */}
                <div className="border-t border-border p-4 bg-accent/30 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full border-2 border-primary/30 p-0.5 overflow-hidden bg-gradient-to-br from-primary/10 to-blue-500/10">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-sm font-black text-white">
                                    {user?.name?.charAt(0) || user?.username?.charAt(0) || "S"}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-foreground truncate leading-none mb-1">
                                {user?.name || user?.username || "Sotuvchi"}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-semibold tracking-tight uppercase">
                                {user?.role === 'seller' ? 'Sotuvchi' : user?.role === 'blogger' ? 'Blogger' : 'Foydalanuvchi'}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-9 w-9 rounded-lg transition-all"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    );
};
