import { Menu, Bell, Search, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
}

export const SellerHeader = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-50 flex w-full bg-card/80 backdrop-blur-xl border-b border-border shadow-sm">
            <div className="flex flex-grow items-center justify-between px-4 py-4 md:px-6 2xl:px-8">
                {/* Left Side: Menu Button + Search */}
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    {/* Search Bar */}
                    <div className="hidden md:block relative w-64 lg:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Qidirish..."
                            className="pl-10 h-10 rounded-xl bg-accent/50 border-border focus:bg-background transition-colors"
                        />
                    </div>
                </div>

                {/* Right Side: Actions */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-xl h-10 w-10"
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 relative">
                                <Bell className="h-5 w-5" />
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
                                >
                                    3
                                </Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <div className="p-3 border-b border-border">
                                <h4 className="font-bold text-sm">Bildirishnomalar</h4>
                                <p className="text-xs text-muted-foreground">3 ta yangi xabar</p>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                <DropdownMenuItem className="p-4 cursor-pointer">
                                    <div className="flex gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <Bell className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold">Yangi buyurtma</p>
                                            <p className="text-xs text-muted-foreground truncate">Sizga yangi buyurtma keldi</p>
                                            <p className="text-xs text-muted-foreground mt-1">5 daqiqa oldin</p>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="p-4 cursor-pointer">
                                    <div className="flex gap-3">
                                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <Bell className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold">To'lov tasdiqlandi</p>
                                            <p className="text-xs text-muted-foreground truncate">50,000 UZS hisobingizga o'tkazildi</p>
                                            <p className="text-xs text-muted-foreground mt-1">1 soat oldin</p>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="p-4 cursor-pointer">
                                    <div className="flex gap-3">
                                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                            <Bell className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold">Yangi sharh</p>
                                            <p className="text-xs text-muted-foreground truncate">Mahsulotingizga 5 yulduzli baho berildi</p>
                                            <p className="text-xs text-muted-foreground mt-1">3 soat oldin</p>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            </div>
                            <div className="p-2 border-t border-border">
                                <Button variant="ghost" className="w-full" size="sm">
                                    Barchasini ko'rish
                                </Button>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Quick Add Button */}
                    <Button
                        onClick={() => navigate('/upload-product')}
                        size="sm"
                        className="hidden sm:flex rounded-xl font-semibold bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 transition-opacity"
                    >
                        Mahsulot qo'shish
                    </Button>
                </div>
            </div>
        </header>
    );
};
