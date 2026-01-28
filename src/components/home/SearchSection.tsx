import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SearchSectionProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isSearchFocused: boolean;
    setIsSearchFocused: (focused: boolean) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export function SearchSection({
    searchQuery,
    setSearchQuery,
    isSearchFocused,
    setIsSearchFocused,
    activeTab,
    setActiveTab,
}: SearchSectionProps) {
    return (
        <div className="px-4 py-4 md:px-6 lg:px-10 sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b mb-4 md:hidden">
            <div className="max-w-3xl mx-auto flex flex-col gap-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder="Qidirish... (Foydalanuvchilar, Mahsulotlar, Postlar)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => {
                            if (!searchQuery) setIsSearchFocused(false);
                        }, 200)}
                        className="pl-12 pr-12 h-12 rounded-full bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
                        aria-label="Qidiruv maydoni"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-muted"
                            onClick={() => {
                                setSearchQuery("");
                                setIsSearchFocused(false);
                            }}
                            aria-label="Qidiruvni tozalash"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {(isSearchFocused || searchQuery) && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
                        <TabsList className="w-full h-10 bg-transparent p-0 gap-2 overflow-x-auto no-scrollbar justify-start">
                            <TabsTrigger
                                value="posts"
                                className="h-8 px-4 rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary transition-all whitespace-nowrap"
                            >
                                Postlar
                            </TabsTrigger>
                            <TabsTrigger
                                value="products"
                                className="h-8 px-4 rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary transition-all whitespace-nowrap"
                            >
                                Mahsulotlar
                            </TabsTrigger>
                            <TabsTrigger
                                value="users"
                                className="h-8 px-4 rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary transition-all whitespace-nowrap"
                            >
                                Foydalanuvchilar
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}
            </div>
        </div>
    );
}
