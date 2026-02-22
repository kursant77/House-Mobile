import { useMemo } from "react";
import { Search, X, Clock, TrendingUp, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { searchService } from "@/services/api/searchService";

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
    const { history, removeFromHistory, clearHistory } = useSearchHistory();
    const trending = useMemo(() => searchService.getTrendingSearches(), []);

    const handleSelectItem = (text: string) => {
        setSearchQuery(text);
        setIsSearchFocused(false);
    };

    const showDropdown = isSearchFocused && !searchQuery;

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
                        }, 300)}
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

                    {/* History + Trending Dropdown */}
                    {showDropdown && (history.length > 0 || trending.length > 0) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                            {/* Search History */}
                            {history.length > 0 && (
                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" />
                                            Qidiruv tarixi
                                        </span>
                                        <button
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                clearHistory();
                                            }}
                                            className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                                        >
                                            <Trash2 className="h-2.5 w-2.5" />
                                            Tozalash
                                        </button>
                                    </div>
                                    {history.slice(0, 5).map((item, i) => (
                                        <button
                                            key={i}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSelectItem(item);
                                            }}
                                            className="w-full flex items-center gap-3 px-2 py-2 text-sm rounded-lg hover:bg-muted transition-colors group"
                                        >
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                            <span className="flex-1 text-left truncate">{item}</span>
                                            <span
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    removeFromHistory(item);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-background rounded-full"
                                            >
                                                <X className="h-3 w-3 text-muted-foreground" />
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Trending */}
                            <div className="p-3 border-t border-border">
                                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                                    <TrendingUp className="h-3 w-3" />
                                    Trend qidiruvlar
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {trending.slice(0, 8).map((item, i) => (
                                        <button
                                            key={i}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSelectItem(item);
                                            }}
                                            className="px-2.5 py-1 text-xs rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
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
