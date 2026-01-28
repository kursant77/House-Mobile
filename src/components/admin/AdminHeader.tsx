import { Search, Bell, User, MessageSquare, Globe, Settings, LogOut, Menu, Moon, Sun, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface HeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
}

export const AdminHeader = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
    const { user, logout } = useAuthStore();

    return (
        <header className="sticky top-0 z-[80] flex w-full bg-[#ffffff] border-b border-zinc-200 dark:bg-zinc-950 dark:border-zinc-900 shadow-sm transition-colors duration-300">
            <div className="flex flex-grow items-center justify-between px-4 py-4 md:px-5 lg:px-6 2xl:px-8">
                {/* Mobile Hamburger & Logo */}
                <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSidebarOpen(!sidebarOpen);
                        }}
                        className="z-[100] block rounded-lg border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:hidden"
                    >
                        <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </button>

                    <Link className="block flex-shrink-0 lg:hidden" to="/admin">
                        <div className="h-9 w-9 rounded-lg bg-[#3C50E0] flex items-center justify-center">
                            <span className="text-white font-black text-xl">H</span>
                        </div>
                    </Link>
                </div>

                {/* Desktop Search - Hidden on mobile */}
                <div className="hidden md:block flex-1 max-w-[480px]">
                    <form action="#" method="POST">
                        <div className="relative group">
                            <button className="absolute left-0 top-1/2 -translate-y-1/2">
                                <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-[#3C50E0] transition-colors" />
                            </button>

                            <input
                                type="text"
                                placeholder="Type to search..."
                                className="w-full bg-transparent pl-9 pr-4 font-medium focus:outline-none dark:text-white text-sm"
                            />

                            <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 font-bold">
                                <Keyboard className="h-3 w-3" />
                                <span>⌘K</span>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 2x:gap-7">
                    <ul className="flex items-center gap-2 2x:gap-4 border-r border-zinc-100 dark:border-zinc-900 pr-4">
                        {/* Dark/Light Toggle */}
                        <li>
                            <ThemeToggle />
                        </li>

                        {/* Notifications */}
                        <li className="relative">
                            <Link to="/admin/notifications">
                                <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-[#f7f9fc] text-zinc-500 hover:text-[#3C50E0] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-[#3C50E0] transition-colors">
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950"></span>
                                </button>
                            </Link>
                        </li>

                        {/* Messages */}
                        <li className="relative hidden xsm:block">
                            <Link to="/admin/messages">
                                <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-[#f7f9fc] text-zinc-500 hover:text-[#3C50E0] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-[#3C50E0] transition-colors">
                                    <MessageSquare className="h-5 w-5" />
                                    <span className="absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-primary ring-2 ring-white dark:ring-zinc-950"></span>
                                </button>
                            </Link>
                        </li>
                    </ul>

                    {/* User Area */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-4 text-left outline-none">
                                <div className="hidden text-right lg:block">
                                    <span className="block text-sm font-black text-zinc-800 dark:text-white leading-none mb-0.5">
                                        {user?.name || "Admin User"}
                                    </span>
                                    <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                                        Super Admin
                                    </span>
                                </div>

                                <div className="h-11 w-11 rounded-full border border-zinc-200 dark:border-zinc-800 p-0.5">
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                            <User className="h-5 w-5 text-zinc-400" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60 mt-4 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 shadow-xl rounded-xl p-2">
                            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 mb-2">
                                <p className="text-sm font-black text-zinc-800 dark:text-white">{user?.name}</p>
                                <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
                            </div>
                            <Link to="/profile">
                                <DropdownMenuItem className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer">
                                    <User className="h-4 w-4" /> My Profile
                                </DropdownMenuItem>
                            </Link>
                            <Link to="/">
                                <DropdownMenuItem className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer">
                                    <Globe className="h-4 w-4" /> Visit Site
                                </DropdownMenuItem>
                            </Link>
                            <Link to="/admin/settings">
                                <DropdownMenuItem className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer">
                                    <Settings className="h-4 w-4" /> Account Settings
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-900 my-2" />
                            <DropdownMenuItem onClick={logout} className="flex items-center gap-3 px-4 py-3 text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer">
                                <LogOut className="h-4 w-4" /> Log Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};
