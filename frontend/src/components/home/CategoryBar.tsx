import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const categories = [
    { id: "all", label: "Hammasi" },
    { id: "smartphones", label: "Smartfonlar" },
    { id: "computers", label: "Kompyuterlar" },
    { id: "gadgets", label: "Gadjetlar" },
    { id: "accessories", label: "Aksessuarlar" },
    { id: "appliances", label: "Maishiy texnika" },
    { id: "audio", label: "Audio" },
    { id: "gaming", label: "Gaming" },
    { id: "cameras", label: "Kameralar" },
    { id: "tablets", label: "Planshetlar" },
    { id: "watches", label: "Soatlar" },
];

interface CategoryBarProps {
    selectedCategory: string;
    onSelectCategory: (id: string) => void;
    className?: string;
}

export function CategoryBar({
    selectedCategory,
    onSelectCategory,
    className
}: CategoryBarProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div className={cn(
            "sticky top-16 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 py-3",
            className
        )}>
            <div
                ref={scrollRef}
                className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 md:px-6 lg:px-10"
            >
                {categories.map((category) => (
                    <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "secondary"}
                        size="sm"
                        onClick={() => onSelectCategory(category.id)}
                        className={cn(
                            "rounded-lg px-4 py-1.5 h-auto text-sm font-medium whitespace-nowrap transition-all duration-200",
                            selectedCategory === category.id
                                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg scale-105"
                                : "bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        )}
                    >
                        {category.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}
