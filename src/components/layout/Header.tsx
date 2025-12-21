import { Menu, Search, ShoppingCart, User, Bell, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Header = () => {
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
                    <div className="flex w-full items-center space-x-2">
                        <div className="relative w-full">
                            <Input
                                type="search"
                                placeholder="Search"
                                className="w-full rounded-l-full rounded-r-none border-r-0 focus-visible:ring-0 pl-4 bg-muted/40"
                            />
                        </div>
                        <Button className="rounded-l-none rounded-r-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-l-0 px-6">
                            <Search className="h-5 w-5" />
                        </Button>
                    </div>

                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-1 md:gap-2">
                    <ThemeToggle />

                    <Button variant="ghost" size="icon" className="hidden md:flex rounded-full">
                        <Bell className="h-5 w-5" />
                    </Button>

                    <Link to="/cart">
                        <Button variant="ghost" size="icon" className="rounded-full relative">
                            <ShoppingCart className="h-5 w-5" />
                            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                        </Button>
                    </Link>

                    <Link to="/auth">
                        <Button variant="ghost" size="icon" className="rounded-full text-blue-600 font-medium w-auto px-2 md:px-4 gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="hidden md:inline">Sign in</span>
                        </Button>
                    </Link>
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
