import { useState } from "react";
import { LayoutDashboard, Users, ShoppingBag, Clapperboard, Settings, LogOut, BarChart3, Bell, ShieldCheck, Mail, MessageSquare, HelpCircle, X, Newspaper, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

const menuGroups = [
    {
        name: "MENU",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
            { icon: Users, label: "Foydalanuvchilar", path: "/admin/users" },
            { icon: FileText, label: "Arizalar", path: "/admin/applications" },
            { icon: ShoppingBag, label: "Buyurtmalar", path: "/admin/orders" },
            { icon: Newspaper, label: "Yangiliklar", path: "/admin/news" },
            { icon: ShoppingBag, label: "Mahsulotlar", path: "/admin/products" },
            { icon: Clapperboard, label: "Reels", path: "/admin/reels" },
            { icon: BarChart3, label: "Analitika", path: "/admin/analytics" },
            { icon: Bell, label: "Bildirishnomalar", path: "/admin/notifications" },
        ]
    },
    {
        name: "SUPPORT",
        items: [
            { icon: MessageSquare, label: "Xabarlar", path: "/admin/messages" },
            { icon: Mail, label: "Email", path: "/admin/email" },
            { icon: HelpCircle, label: "Yordam", path: "/admin/support" },
        ]
    },
    {
        name: "OTHERS",
        items: [
            { icon: Settings, label: "Sozlamalar", path: "/admin/settings" },
        ]
    }
];

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
}

export const AdminSidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
    const location = useLocation();
    const { logout, user } = useAuthStore();
    const [usersMenuOpen, setUsersMenuOpen] = useState(false);

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
                    "fixed left-0 top-0 z-[999] flex h-screen w-80 sm:w-72 flex-col overflow-y-hidden bg-white dark:bg-[#1c2434] duration-300 ease-linear lg:static lg:translate-x-0 shadow-2xl lg:shadow-none border-r border-zinc-200 dark:border-[#2e3a47]",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between gap-2 px-5 md:px-6 py-6 md:py-8 lg:py-10 border-b border-zinc-200 dark:border-[#2e3a47]">
                    <Link to="/admin" className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#3C50E0] flex items-center justify-center shrink-0 shadow-lg shadow-[#3C50E0]/20">
                            <ShieldCheck className="text-white h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-zinc-800 dark:text-white tracking-tight text-xl">House Admin</span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-widest -mt-1">Management</span>
                        </div>
                    </Link>

                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="block lg:hidden text-zinc-400 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Sidebar Content */}
                <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-4 py-6 md:py-8 duration-300 ease-linear">
                    <nav className="space-y-8">
                        {menuGroups.map((group) => (
                            <div key={group.name} className="space-y-1.5">
                                <h3 className="mb-4 ml-4 text-xs font-black text-zinc-400 dark:text-[#5c6e88] uppercase tracking-[3px]">
                                    {group.name}
                                </h3>
                                <ul className="space-y-1">
                                    {group.items.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        const isUsersMenu = item.label === "Foydalanuvchilar";

                                        if (isUsersMenu) {
                                            return (
                                                <li key={item.path}>
                                                    <div>
                                                        <button
                                                            onClick={() => setUsersMenuOpen(!usersMenuOpen)}
                                                            className={cn(
                                                                "w-full group relative flex items-center gap-4 rounded-lg px-4 py-3 font-medium transition-all duration-200",
                                                                isActive || usersMenuOpen
                                                                    ? "bg-blue-50 dark:bg-[#333a48] text-[#3C50E0] dark:text-white"
                                                                    : "text-zinc-600 dark:text-[#dee4ee] hover:bg-zinc-100 dark:hover:bg-[#333a48] hover:text-zinc-900 dark:hover:text-white"
                                                            )}
                                                        >
                                                            <item.icon className={cn("h-5 w-5 shrink-0 opacity-70 group-hover:opacity-100", (isActive || usersMenuOpen) && "text-[#3C50E0] opacity-100")} />
                                                            <span className="flex-1 text-left">{item.label}</span>
                                                            {usersMenuOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                        </button>

                                                        <div className={cn(
                                                            "overflow-hidden transition-all duration-300 ease-in-out pl-9 space-y-1",
                                                            usersMenuOpen ? "max-h-40 mt-1 opacity-100" : "max-h-0 opacity-0"
                                                        )}>
                                                            <Link
                                                                to="/admin/users"
                                                                className={cn(
                                                                    "block py-2 px-4 text-sm rounded-lg transition-colors",
                                                                    location.pathname === "/admin/users" ? "text-[#3C50E0] font-black" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                                                )}
                                                            >
                                                                Barcha
                                                            </Link>
                                                            <Link
                                                                to="/admin/users?role=blogger"
                                                                className={cn(
                                                                    "block py-2 px-4 text-sm rounded-lg transition-colors",
                                                                    location.search === "?role=blogger" ? "text-amber-600 font-black" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                                                )}
                                                            >
                                                                Bloggerlar
                                                            </Link>
                                                            <Link
                                                                to="/admin/users?role=seller"
                                                                className={cn(
                                                                    "block py-2 px-4 text-sm rounded-lg transition-colors",
                                                                    location.search === "?role=seller" ? "text-blue-600 font-black" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                                                )}
                                                            >
                                                                Sotuvchilar
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        }

                                        return (
                                            <li key={item.path}>
                                                <Link
                                                    to={item.path}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={cn(
                                                        "group relative flex items-center gap-4 rounded-lg px-4 py-3 font-medium transition-all duration-200",
                                                        isActive
                                                            ? "bg-blue-50 dark:bg-[#333a48] text-[#3C50E0] dark:text-white"
                                                            : "text-zinc-600 dark:text-[#dee4ee] hover:bg-zinc-100 dark:hover:bg-[#333a48] hover:text-zinc-900 dark:hover:text-white"
                                                    )}
                                                >
                                                    <item.icon className={cn("h-5 w-5 shrink-0 opacity-70 group-hover:opacity-100", isActive && "text-[#3C50E0] opacity-100")} />
                                                    {item.label}
                                                    {isActive && (
                                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#3C50E0] rounded-l-full shadow-[0_0_10px_#3C50E0]" />
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
                <div className="border-t border-zinc-200 dark:border-[#2e3a47] p-4 bg-zinc-50 dark:bg-[#1c2434]/50 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full border-2 border-[#3C50E0]/30 p-0.5 overflow-hidden">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <div className="h-full w-full rounded-full bg-[#3c50e0]/10 flex items-center justify-center text-sm font-black text-[#3c50e0]">
                                    {user?.name?.charAt(0) || "A"}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-zinc-800 dark:text-white truncate leading-none mb-1">{user?.name || "Admin"}</p>
                            <p className="text-[10px] text-zinc-500 dark:text-[#5c6e88] font-bold tracking-tight uppercase">Super Administrator</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            className="text-zinc-500 dark:text-[#5c6e88] hover:text-red-500 hover:bg-red-500/10 h-8 w-8"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    );
};
