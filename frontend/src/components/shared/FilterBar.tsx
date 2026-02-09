import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PRODUCT_CATEGORIES as categories } from "@/lib/constants";

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sortBy?: "newest" | "oldest" | "price_asc" | "price_desc" | "popular" | "rating";
}

interface FilterBarProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  totalResults?: number;
  className?: string;
}

export function FilterBar({
  filters,
  onFiltersChange,
  totalResults,
  className,
}: FilterBarProps) {
  const [tempFilters, setTempFilters] = useState<ProductFilters>(filters);
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== "" && key !== "sortBy"
  ).length;

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: ProductFilters = { sortBy: filters.sortBy };
    setTempFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const handleSortChange = (sortBy: ProductFilters["sortBy"]) => {
    onFiltersChange({ ...filters, sortBy });
  };

  const sortOptions = [
    { value: "newest", label: "Eng yangi" },
    { value: "oldest", label: "Eng eski" },
    { value: "price_asc", label: "Narx: arzon → qimmat" },
    { value: "price_desc", label: "Narx: qimmat → arzon" },
    { value: "popular", label: "Eng mashhur" },
    { value: "rating", label: "Eng yuqori reyting" },
  ];

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Filter Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[320px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Filterlar</SheetTitle>
            <SheetDescription className="sr-only">Mahsulotlarni saralash va qidirish uchun filterlar ro'yxati</SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <Label>Kategoriya</Label>
              <Select
                value={tempFilters.category || "all"}
                onValueChange={(value) =>
                  setTempFilters({ ...tempFilters, category: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Barcha kategoriyalar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                  {categories.filter(c => c.id !== "all").map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <Label>Narx oralig'i (UZS)</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={tempFilters.minPrice || ""}
                    onChange={(e) =>
                      setTempFilters({
                        ...tempFilters,
                        minPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <span className="text-muted-foreground self-center">-</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Max"
                    value={tempFilters.maxPrice || ""}
                    onChange={(e) =>
                      setTempFilters({
                        ...tempFilters,
                        maxPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Minimal reyting</Label>
                <span className="text-sm text-muted-foreground">
                  {tempFilters.minRating || 0}+ yulduz
                </span>
              </div>
              <Slider
                value={[tempFilters.minRating || 0]}
                onValueChange={([value]) =>
                  setTempFilters({ ...tempFilters, minRating: value || undefined })
                }
                max={5}
                step={1}
              />
            </div>

            {/* In Stock */}
            <div className="flex items-center justify-between">
              <Label>Faqat sotuvdagilar</Label>
              <Button
                variant={tempFilters.inStock ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setTempFilters({
                    ...tempFilters,
                    inStock: tempFilters.inStock ? undefined : true,
                  })
                }
              >
                {tempFilters.inStock ? "Ha" : "Yo'q"}
              </Button>
            </div>
          </div>

          <SheetFooter className="flex gap-2">
            <Button variant="outline" onClick={handleClearFilters} className="flex-1">
              Tozalash
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1">
              Qo'llash
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Sort Dropdown */}
      <Select value={filters.sortBy || "newest"} onValueChange={(v) => handleSortChange(v as ProductFilters["sortBy"])}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Saralash" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Active Filters Pills */}
      {filters.category && (
        <Badge variant="secondary" className="gap-1">
          {categories.find((c) => c.id === filters.category)?.name || filters.category}
          <button
            onClick={() => onFiltersChange({ ...filters, category: undefined })}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {(filters.minPrice || filters.maxPrice) && (
        <Badge variant="secondary" className="gap-1">
          {filters.minPrice?.toLocaleString() || "0"} - {filters.maxPrice?.toLocaleString() || "∞"} UZS
          <button
            onClick={() => onFiltersChange({ ...filters, minPrice: undefined, maxPrice: undefined })}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.minRating && (
        <Badge variant="secondary" className="gap-1">
          {filters.minRating}+ yulduz
          <button
            onClick={() => onFiltersChange({ ...filters, minRating: undefined })}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Results count */}
      {totalResults !== undefined && (
        <span className="text-sm text-muted-foreground ml-auto">
          {totalResults} ta natija
        </span>
      )}
    </div>
  );
}
