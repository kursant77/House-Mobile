import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCT_CATEGORIES as categories } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { FieldErrors } from "react-hook-form";

interface ProductFormProps {
    formData: {
        title: string;
        description: string;
        price: string;
        category: string;
        currency: string;
    };
    onFormDataChange: (field: keyof ProductFormProps["formData"], value: string) => void;
    errors?: FieldErrors<ProductFormProps["formData"]>;
}

export function ProductForm({ formData, onFormDataChange, errors }: ProductFormProps) {
    return (
        <div className="w-full rounded-3xl border border-border/60 bg-card/80 dark:bg-card/70 shadow-2xl shadow-black/25 backdrop-blur-sm p-4 sm:p-6 md:p-7">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Ma'lumotlar</span>
                <h3 className="text-lg sm:text-xl font-bold">Mahsulot tafsilotlari</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                    Majburiy maydonlarni to‘ldiring va mahsulotni aniq tasvirlab bering.
                </p>
            </div>

            <div className="mt-5 space-y-4 sm:space-y-5 md:space-y-6">
                <div className="space-y-2.5">
                    <Label htmlFor="title" className="text-sm md:text-base font-semibold text-foreground/80">
                        Nomi <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="title"
                        placeholder="Masalan: iPhone 15 Pro Max"
                        value={formData.title}
                        onChange={e => onFormDataChange("title", e.target.value)}
                        required
                        aria-required="true"
                        className={cn(
                            "h-12 rounded-2xl border-border/60 bg-muted/15 dark:bg-muted/15 hover:border-border focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all duration-200",
                            errors?.title && "border-destructive focus-visible:ring-destructive/40"
                        )}
                    />
                    {errors?.title && (
                        <p className="text-xs text-destructive mt-1 font-medium">{errors.title.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[2fr,1fr] gap-4 md:gap-5">
                    <div className="space-y-2.5">
                        <Label htmlFor="price" className="text-sm font-semibold text-foreground/80">
                            Narxi <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            placeholder="Narxi"
                            value={formData.price}
                            onChange={e => onFormDataChange("price", e.target.value)}
                            required
                            aria-required="true"
                            className={cn(
                                "h-12 rounded-2xl border-border/60 bg-muted/15 dark:bg-muted/15 hover:border-border focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all",
                                errors?.price && "border-destructive focus-visible:ring-destructive/40"
                            )}
                        />
                        {errors?.price && (
                            <p className="text-xs text-destructive mt-1 font-medium">{errors.price.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="currency" className="text-xs sm:text-sm font-semibold text-foreground/80">
                            Valyuta <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.currency}
                            onValueChange={val => onFormDataChange("currency", val)}
                        >
                            <SelectTrigger
                                aria-required="true"
                                className="h-12 rounded-2xl border-border/60 bg-muted/15 dark:bg-muted/15 hover:border-border focus:ring-2 focus:ring-primary/40"
                            >
                                <SelectValue placeholder="Valyutani tanlang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UZS">UZS (O'zbek so'mi)</SelectItem>
                                <SelectItem value="USD">USD (Amerika dollari)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2.5">
                    <Label htmlFor="category" className="text-sm md:text-base font-semibold text-foreground/80">
                        Kategoriya <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        value={formData.category}
                        onValueChange={val => onFormDataChange("category", val)}
                    >
                        <SelectTrigger
                            aria-required="true"
                            className={cn(
                                "h-12 rounded-2xl border-border/60 bg-muted/15 dark:bg-muted/15 hover:border-border focus:ring-2 focus:ring-primary/40 transition-all",
                                errors?.category && "border-destructive focus:ring-destructive/40"
                            )}
                        >
                            <SelectValue placeholder="Kategoriyani tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors?.category && (
                        <p className="text-xs text-destructive mt-1 font-medium">{errors.category.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs sm:text-sm font-semibold text-foreground/80">
                        Tavsif <span className="text-destructive">*</span>
                    </Label>
                    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-[11px] sm:text-xs text-yellow-600 dark:text-yellow-400">
                        <strong>Maslahat:</strong> Qurilmaning texnik xususiyatlarini (xotira, kamera va h.k.) to'liq kiriting.
                    </div>
                    <Textarea
                        id="description"
                        placeholder="Mahsulot haqida batafsil ma'lumot bering..."
                        className={cn(
                            "min-h-[140px] sm:min-h-[170px] resize-none rounded-2xl border-border/60 bg-muted/15 dark:bg-muted/15 hover:border-border focus-visible:ring-2 focus-visible:ring-primary/40 transition-all text-sm sm:text-base",
                            errors?.description && "border-destructive focus-visible:ring-destructive/40"
                        )}
                        value={formData.description}
                        onChange={e => onFormDataChange("description", e.target.value)}
                        required
                        aria-required="true"
                    />
                    {errors?.description && (
                        <p className="text-xs text-destructive mt-1 font-medium">{errors.description.message}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
