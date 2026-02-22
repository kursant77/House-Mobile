import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import {
    Gift, Plus, Percent, Tag, TrendingUp, Zap,
    Loader2, Trash2, Check, Package, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/hooks/useCurrency";

interface SellerProduct {
    id: string;
    title: string;
    price: number;
    currency: string;
    category: string;
    in_stock: boolean;
    media?: { url: string }[];
}

interface Promotion {
    productId: string;
    productTitle: string;
    productImage?: string;
    originalPrice: number;
    discountedPrice: number;
    discountPercent: number;
    currency: string;
}

const PROMOTIONS_STORAGE_KEY = "seller_promotions";

function loadPromotions(): Promotion[] {
    try {
        const stored = localStorage.getItem(PROMOTIONS_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch { }
    return [];
}

function savePromotions(promotions: Promotion[]) {
    localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(promotions));
}

export default function SellerPromotions() {
    const { user } = useAuthStore();
    const { formatPrice } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<SellerProduct[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // New promotion form
    const [selectedProductId, setSelectedProductId] = useState("");
    const [discountPercent, setDiscountPercent] = useState("");

    useEffect(() => {
        if (!user) return;
        fetchProducts();
    }, [user]);

    const fetchProducts = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, title, price, currency, category, in_stock, media:product_media(url)')
                .eq('seller_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);

            // Load saved promotions
            const saved = loadPromotions();
            // Filter only promotions for current seller's products
            const productIds = new Set((data || []).map(p => p.id));
            setPromotions(saved.filter(p => productIds.has(p.productId)));
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePromotion = async () => {
        if (!selectedProductId || !discountPercent) {
            toast.error("Mahsulot va chegirma foizini tanlang");
            return;
        }

        const percent = parseInt(discountPercent);
        if (isNaN(percent) || percent < 1 || percent > 90) {
            toast.error("Chegirma foizi 1-90 orasida bo'lishi kerak");
            return;
        }

        // Check if product already has promotion
        if (promotions.some(p => p.productId === selectedProductId)) {
            toast.error("Bu mahsulotda allaqachon chegirma bor");
            return;
        }

        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;

        setSaving(true);

        try {
            const discountedPrice = Math.round(product.price * (1 - percent / 100));

            // Update product price in Supabase
            const { error } = await supabase
                .from('products')
                .update({ price: discountedPrice })
                .eq('id', product.id);

            if (error) throw error;

            const newPromotion: Promotion = {
                productId: product.id,
                productTitle: product.title,
                productImage: product.media?.[0]?.url,
                originalPrice: product.price,
                discountedPrice,
                discountPercent: percent,
                currency: product.currency || "UZS",
            };

            const updated = [...promotions, newPromotion];
            setPromotions(updated);
            savePromotions(updated);

            // Update local products list
            setProducts(prev => prev.map(p =>
                p.id === product.id ? { ...p, price: discountedPrice } : p
            ));

            toast.success(`${product.title} uchun ${percent}% chegirma qo'shildi`);
            setDialogOpen(false);
            setSelectedProductId("");
            setDiscountPercent("");
        } catch (error) {
            console.error("Error creating promotion:", error);
            toast.error("Chegirma yaratishda xatolik");
        } finally {
            setSaving(false);
        }
    };

    const handleRemovePromotion = async (promo: Promotion) => {
        setSaving(true);

        try {
            // Restore original price
            const { error } = await supabase
                .from('products')
                .update({ price: promo.originalPrice })
                .eq('id', promo.productId);

            if (error) throw error;

            const updated = promotions.filter(p => p.productId !== promo.productId);
            setPromotions(updated);
            savePromotions(updated);

            // Update local products list
            setProducts(prev => prev.map(p =>
                p.id === promo.productId ? { ...p, price: promo.originalPrice } : p
            ));

            toast.success("Chegirma o'chirildi, original narx qaytarildi");
        } catch (error) {
            console.error("Error removing promotion:", error);
            toast.error("Chegirmani o'chirishda xatolik");
        } finally {
            setSaving(false);
        }
    };

    // Products without active promotions
    const availableProducts = products.filter(
        p => !promotions.some(promo => promo.productId === p.id)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Helmet>
                <title>Aksiyalar va Marketing - House Mobile</title>
            </Helmet>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Aksiyalar va Marketing
                    </h1>
                    <p className="text-muted-foreground mt-1">Chegirmalar va reklama kampaniyalari</p>
                </div>
                <Button
                    className="rounded-lg font-semibold bg-gradient-to-r from-primary to-blue-600"
                    onClick={() => setDialogOpen(true)}
                    disabled={availableProducts.length === 0}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Yangi chegirma
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Faol chegirmalar</p>
                                <p className="text-3xl font-black mt-1">{promotions.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Percent className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Jami mahsulotlar</p>
                                <p className="text-3xl font-black mt-1">{products.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Package className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">O'rtacha chegirma</p>
                                <p className="text-3xl font-black mt-1">
                                    {promotions.length > 0
                                        ? Math.round(promotions.reduce((s, p) => s + p.discountPercent, 0) / promotions.length)
                                        : 0}%
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-amber-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Promotions */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Faol aksiyalar</CardTitle>
                    <CardDescription>Hozirda davom etayotgan chegirmalar</CardDescription>
                </CardHeader>
                <CardContent>
                    {promotions.length === 0 ? (
                        <div className="text-center py-16">
                            <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-bold mb-2">Hozircha aksiyalar yo'q</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Birinchi aksiyangizni yarating va savdolarni oshiring
                            </p>
                            <Button
                                className="bg-gradient-to-r from-primary to-blue-600"
                                onClick={() => setDialogOpen(true)}
                                disabled={availableProducts.length === 0}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Aksiya yaratish
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {promotions.map((promo) => (
                                <div
                                    key={promo.productId}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                                >
                                    <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0">
                                        {promo.productImage ? (
                                            <img src={promo.productImage} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <Package className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">{promo.productTitle}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm text-muted-foreground line-through">
                                                {formatPrice(promo.originalPrice)} {promo.currency}
                                            </span>
                                            <span className="text-sm font-bold text-emerald-600">
                                                {formatPrice(promo.discountedPrice)} {promo.currency}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20 font-bold">
                                        -{promo.discountPercent}%
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemovePromotion(promo)}
                                        disabled={saving}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Promotion Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yangi chegirma yaratish</DialogTitle>
                        <DialogDescription>
                            Mahsulotni tanlang va chegirma foizini kiriting
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Mahsulot</Label>
                            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Mahsulotni tanlang" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableProducts.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            <div className="flex items-center gap-2">
                                                <span className="truncate">{p.title}</span>
                                                <span className="text-muted-foreground text-xs">
                                                    ({formatPrice(p.price)} {p.currency || 'UZS'})
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Chegirma foizi (%)</Label>
                            <Input
                                type="number"
                                min="1"
                                max="90"
                                placeholder="Masalan: 20"
                                value={discountPercent}
                                onChange={(e) => setDiscountPercent(e.target.value)}
                            />
                        </div>

                        {selectedProductId && discountPercent && (
                            <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                <p className="text-sm text-muted-foreground">Yangi narx:</p>
                                <p className="text-lg font-black text-emerald-600">
                                    {(() => {
                                        const product = products.find(p => p.id === selectedProductId);
                                        const percent = parseInt(discountPercent) || 0;
                                        if (!product || percent < 1 || percent > 90) return "—";
                                        const newPrice = Math.round(product.price * (1 - percent / 100));
                                        return `${formatPrice(newPrice)} ${product.currency || 'UZS'}`;
                                    })()}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Bekor qilish
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-primary to-blue-600"
                            onClick={handleCreatePromotion}
                            disabled={saving || !selectedProductId || !discountPercent}
                        >
                            {saving ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yaratilmoqda...</>
                            ) : (
                                <><Check className="mr-2 h-4 w-4" /> Chegirma yaratish</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
