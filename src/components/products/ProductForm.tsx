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
    onFormDataChange: (field: keyof typeof formData, value: string) => void;
}

export function ProductForm({ formData, onFormDataChange }: ProductFormProps) {
    return (
        <Card className="border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl md:text-2xl font-bold">Ma'lumotlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 md:space-y-6">
                <div className="space-y-2.5">
                    <Label htmlFor="title" className="text-sm font-semibold text-foreground/80">
                        Nomi <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="title"
                        placeholder="Masalan: iPhone 15 Pro Max"
                        value={formData.title}
                        onChange={e => onFormDataChange("title", e.target.value)}
                        required
                        aria-required="true"
                        className="h-11 md:h-12 rounded-xl border-border/50 bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200 hover:border-border"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                            className="h-11 md:h-12 rounded-xl border-border/50 bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200 hover:border-border"
                        />
                    </div>

                    <div className="space-y-2.5">
                        <Label htmlFor="currency" className="text-sm font-semibold text-foreground/80">
                            Valyuta <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.currency}
                            onValueChange={val => onFormDataChange("currency", val)}
                        >
                            <SelectTrigger 
                                aria-required="true"
                                className="h-11 md:h-12 rounded-xl border-border/50 bg-muted/50 focus:ring-2 focus:ring-primary"
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
                    <Label htmlFor="category" className="text-sm font-semibold text-foreground/80">
                        Kategoriya <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        value={formData.category}
                        onValueChange={val => onFormDataChange("category", val)}
                    >
                        <SelectTrigger 
                            aria-required="true"
                            className="h-11 md:h-12 rounded-xl border-border/50 bg-muted/50 focus:ring-2 focus:ring-primary"
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

                <div className="space-y-2.5">
                    <Label htmlFor="description" className="text-sm font-semibold text-foreground/80">
                        Tavsif <span className="text-destructive">*</span>
                    </Label>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 md:p-4 rounded-xl text-xs md:text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                        <strong>Maslahat:</strong> Bioga qurilmaning barcha texnik xususiyatlarini (xotira, kamera, protsessor va h.k.) to'liq kiritishni unutmang. Bu xaridorlarga tanlashda yordam beradi.
                    </div>
                    <Textarea
                        id="description"
                        placeholder="Mahsulot haqida batafsil ma'lumot bering..."
                        className="min-h-[140px] md:min-h-[160px] resize-none rounded-xl border-border/50 bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200 hover:border-border"
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
