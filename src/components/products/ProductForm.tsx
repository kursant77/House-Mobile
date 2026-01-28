import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categories } from "@/data/mockProducts";

interface ProductFormProps {
    formData: {
        title: string;
        description: string;
        price: string;
        category: string;
        currency: string;
    };
    onFormDataChange: (field: keyof ProductFormProps["formData"], value: string) => void;
}

export function ProductForm({ formData, onFormDataChange }: ProductFormProps) {
    return (
        <Card className="w-full border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 bg-card/95 dark:bg-card/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 sm:pb-4 md:pb-5 px-4 sm:px-5 md:px-6 pt-4 sm:pt-5 md:pt-6">
                <CardTitle className="text-base sm:text-lg md:text-xl font-bold">Ma'lumotlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 md:space-y-6 pb-5 sm:pb-6 px-4 sm:px-5 md:px-6">
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
                        className="h-11 md:h-12 lg:h-13 rounded-xl border-border/50 bg-muted/30 dark:bg-muted/20 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all duration-200 hover:border-border"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
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
                            className="h-10 sm:h-11 md:h-12 rounded-xl border-border/50 bg-muted/30 dark:bg-muted/20 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                        />
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
                                className="h-10 sm:h-11 md:h-12 rounded-xl border-border/50 bg-muted/30 dark:bg-muted/20 focus:ring-2 focus:ring-primary/50"
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
                            className="h-11 md:h-12 lg:h-13 rounded-xl border-border/50 bg-muted/30 dark:bg-muted/20 focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                            <SelectValue placeholder="Kategoriyani tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs sm:text-sm font-semibold text-foreground/80">
                        Tavsif <span className="text-destructive">*</span>
                    </Label>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-2.5 sm:p-3 rounded-xl text-[11px] sm:text-xs text-yellow-600 dark:text-yellow-400">
                        <strong>Maslahat:</strong> Qurilmaning texnik xususiyatlarini (xotira, kamera va h.k.) to'liq kiriting.
                    </div>
                    <Textarea
                        id="description"
                        placeholder="Mahsulot haqida batafsil ma'lumot bering..."
                        className="min-h-[120px] sm:min-h-[140px] md:min-h-[160px] resize-none rounded-xl border-border/50 bg-muted/30 dark:bg-muted/20 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all text-sm sm:text-base"
                        value={formData.description}
                        onChange={e => onFormDataChange("description", e.target.value)}
                        required
                        aria-required="true"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
