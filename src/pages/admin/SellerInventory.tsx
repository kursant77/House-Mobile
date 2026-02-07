import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import {
    Package,
    Loader2,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle2,
    Plus,
    Download,
    Upload,
    MoreVertical,
    ArrowUpDown,
    PackageX,
    PackageCheck,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn, formatPriceNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Product {
    id: string;
    title: string;
    price: number;
    currency: string;
    category: string;
    in_stock: boolean;
    views: number;
    rating: number;
    review_count: number;
    created_at: string;
    updated_at: string;
    media?: { url: string }[];
}

interface ProductWithSales extends Product {
    totalSales: number;
    revenue: number;
}

export default function SellerInventory() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<ProductWithSales[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductWithSales[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [stockFilter, setStockFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<'title' | 'price' | 'sales' | 'views'>('title');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedProduct, setSelectedProduct] = useState<ProductWithSales | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

    // Stats
    const [stats, setStats] = useState({
        totalProducts: 0,
        inStock: 0,
        outOfStock: 0,
        totalValue: 0,
    });

    useEffect(() => {
        if (!user || (user.role !== 'blogger' && user.role !== 'super_admin' && user.role !== 'seller' && user.role !== 'admin')) {
            navigate("/");
            return;
        }

        fetchProducts();
    }, [user, navigate]);

    useEffect(() => {
        filterAndSortProducts();
    }, [products, searchQuery, categoryFilter, stockFilter, sortBy, sortOrder]);

    const fetchProducts = async () => {
        try {
            setLoading(true);

            // Fetch seller's products
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('*, media:product_media(url)')
                .eq('seller_id', user!.id)
                .order('created_at', { ascending: false });

            if (productsError) throw productsError;

            // Fetch order items to calculate sales
            const productIds = productsData?.map(p => p.id) || [];
            const { data: orderItems, error: orderItemsError } = await supabase
                .from('order_items')
                .select('product_id, quantity, price')
                .in('product_id', productIds);

            if (orderItemsError) throw orderItemsError;

            // Calculate sales for each product
            const productsWithSales: ProductWithSales[] = productsData?.map(product => {
                const items = orderItems?.filter(item => item.product_id === product.id) || [];
                const totalSales = items.reduce((acc, item) => acc + item.quantity, 0);
                const revenue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

                return {
                    ...product,
                    totalSales,
                    revenue,
                };
            }) || [];

            setProducts(productsWithSales);
            setFilteredProducts(productsWithSales);

            // Extract unique categories
            const uniqueCategories = Array.from(new Set(productsData?.map(p => p.category).filter(Boolean))) as string[];
            setCategories(uniqueCategories);

            // Calculate stats
            const inStock = productsWithSales.filter(p => p.in_stock).length;
            const outOfStock = productsWithSales.filter(p => !p.in_stock).length;
            const totalValue = productsWithSales.reduce((acc, p) => acc + (p.in_stock ? p.price : 0), 0);

            setStats({
                totalProducts: productsWithSales.length,
                inStock,
                outOfStock,
                totalValue,
            });

        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Mahsulotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortProducts = () => {
        let filtered = [...products];

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(product =>
                product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by category
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(product => product.category === categoryFilter);
        }

        // Filter by stock status
        if (stockFilter === 'in_stock') {
            filtered = filtered.filter(product => product.in_stock);
        } else if (stockFilter === 'out_of_stock') {
            filtered = filtered.filter(product => !product.in_stock);
        }

        // Sort
        filtered.sort((a, b) => {
            let compareValue = 0;
            switch (sortBy) {
                case 'title':
                    compareValue = a.title.localeCompare(b.title);
                    break;
                case 'price':
                    compareValue = a.price - b.price;
                    break;
                case 'sales':
                    compareValue = a.totalSales - b.totalSales;
                    break;
                case 'views':
                    compareValue = a.views - b.views;
                    break;
            }
            return sortOrder === 'desc' ? -compareValue : compareValue;
        });

        setFilteredProducts(filtered);
    };

    const toggleProductStock = async (productId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ in_stock: !currentStatus, updated_at: new Date().toISOString() })
                .eq('id', productId);

            if (error) throw error;

            toast.success(currentStatus ? "Mahsulot mavjud emas deb belgilandi" : "Mahsulot mavjud deb belgilandi");
            fetchProducts();
        } catch (error) {
            console.error("Error toggling stock:", error);
            toast.error("Xatolik yuz berdi");
        }
    };

    const deleteProduct = async () => {
        if (!selectedProduct) return;

        try {
            // Delete product media first
            const { error: mediaError } = await supabase
                .from('product_media')
                .delete()
                .eq('product_id', selectedProduct.id);

            if (mediaError) throw mediaError;

            // Delete product
            const { error: productError } = await supabase
                .from('products')
                .delete()
                .eq('id', selectedProduct.id);

            if (productError) throw productError;

            toast.success("Mahsulot o'chirildi");
            setDeleteDialogOpen(false);
            setSelectedProduct(null);
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Mahsulotni o'chirishda xatolik");
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-background via-background to-primary/5">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-semibold animate-pulse">Inventar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24 md:pb-12 pt-20">
            <Helmet>
                <title>Mahsulot Inventari - House Mobile</title>
            </Helmet>

            <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Mahsulot Inventari
                        </h1>
                        <p className="text-muted-foreground mt-1">Mahsulotlaringizni boshqaring va kuzating</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-lg font-semibold text-sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Import
                        </Button>
                        <Button variant="outline" className="rounded-lg font-semibold text-sm">
                            <Download className="mr-2 h-4 w-4" />
                            Eksport
                        </Button>
                        <Button
                            className="rounded-lg font-semibold text-sm bg-gradient-to-r from-primary to-blue-600"
                            onClick={() => navigate('/upload-product')}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Yangi mahsulot
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="border-l-4 border-l-primary shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <Package className="h-8 w-8 text-primary" />
                                <h3 className="text-3xl font-black">{stats.totalProducts}</h3>
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jami mahsulotlar</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <PackageCheck className="h-8 w-8 text-emerald-500" />
                                <h3 className="text-3xl font-black">{stats.inStock}</h3>
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mavjud</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-500 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <PackageX className="h-8 w-8 text-red-500" />
                                <h3 className="text-3xl font-black">{stats.outOfStock}</h3>
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tugagan</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="h-8 w-8 text-amber-500" />
                                <h3 className="text-2xl font-black">{formatPriceNumber(stats.totalValue)}</h3>
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Umumiy qiymat (UZS)</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="shadow-lg mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Mahsulot nomi yoki kategoriya bo'yicha qidirish..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 rounded-lg"
                                    />
                                </div>
                            </div>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full md:w-[200px] rounded-lg">
                                    <SelectValue placeholder="Kategoriya" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                                    {categories.map(category => (
                                        <SelectItem key={category} value={category}>{category}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={stockFilter} onValueChange={setStockFilter}>
                                <SelectTrigger className="w-full md:w-[180px] rounded-lg">
                                    <SelectValue placeholder="Mavjudlik" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Barchasi</SelectItem>
                                    <SelectItem value="in_stock">Mavjud</SelectItem>
                                    <SelectItem value="out_of_stock">Tugagan</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                                <SelectTrigger className="w-full md:w-[150px] rounded-lg">
                                    <SelectValue placeholder="Saralash" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="title">Nomi</SelectItem>
                                    <SelectItem value="price">Narxi</SelectItem>
                                    <SelectItem value="sales">Savdolar</SelectItem>
                                    <SelectItem value="views">Ko'rishlar</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-lg"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            >
                                <ArrowUpDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Table */}
                <Card className="shadow-lg">
                    <CardContent className="p-0">
                        {filteredProducts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Mahsulot</TableHead>
                                            <TableHead>Kategoriya</TableHead>
                                            <TableHead>Narxi</TableHead>
                                            <TableHead>Savdolar</TableHead>
                                            <TableHead>Ko'rishlar</TableHead>
                                            <TableHead>Reyting</TableHead>
                                            <TableHead>Mavjudlik</TableHead>
                                            <TableHead className="text-right">Amallar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProducts.map((product) => (
                                            <TableRow key={product.id} className="hover:bg-muted/50">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {product.media?.[0]?.url ? (
                                                            <img
                                                                src={product.media[0].url}
                                                                alt={product.title}
                                                                className="h-12 w-12 object-cover rounded-lg"
                                                            />
                                                        ) : (
                                                            <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                                                                <Package className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold max-w-[200px] truncate">{product.title}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatPriceNumber(product.revenue)} UZS tushum
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{product.category || 'Boshqa'}</Badge>
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatPriceNumber(product.price)} <span className="text-xs font-normal text-muted-foreground">{product.currency}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {product.totalSales > 0 ? (
                                                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                                                        ) : (
                                                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                        <span className="font-semibold">{product.totalSales}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                        <span>{product.views || 0}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {product.rating > 0 ? (
                                                        <Badge variant="outline" className="gap-1">
                                                            ⭐ {product.rating.toFixed(1)}
                                                            <span className="text-xs text-muted-foreground">({product.review_count})</span>
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Sharhlar yo'q</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={product.in_stock}
                                                            onCheckedChange={() => toggleProductStock(product.id, product.in_stock)}
                                                        />
                                                        <span className="text-xs font-semibold">
                                                            {product.in_stock ? (
                                                                <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 bg-emerald-500/10">
                                                                    Mavjud
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="border-red-500/50 text-red-600 bg-red-500/10">
                                                                    Tugagan
                                                                </Badge>
                                                            )}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="rounded-lg">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuLabel>Amallar</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => navigate(`/product/${product.id}`)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Ko'rish
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => navigate(`/upload-product?id=${product.id}`)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Tahrirlash
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => toggleProductStock(product.id, product.in_stock)}
                                                            >
                                                                {product.in_stock ? (
                                                                    <>
                                                                        <EyeOff className="mr-2 h-4 w-4" />
                                                                        Mavjud emas
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                        Mavjud qilish
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedProduct(product);
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                O'chirish
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-bold mb-2">Mahsulotlar topilmadi</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    {searchQuery || categoryFilter !== 'all' || stockFilter !== 'all'
                                        ? "Qidiruv kriteriyalariga mos mahsulotlar yo'q"
                                        : "Hozircha hech qanday mahsulot yo'q"}
                                </p>
                                {(searchQuery || categoryFilter !== 'all' || stockFilter !== 'all') ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setCategoryFilter("all");
                                            setStockFilter("all");
                                        }}
                                    >
                                        Filterni tozalash
                                    </Button>
                                ) : (
                                    <Button onClick={() => navigate('/upload-product')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Birinchi mahsulotni qo'shish
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mahsulotni o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{selectedProduct?.title}" mahsulotini o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteProduct} className="bg-red-600 hover:bg-red-700">
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
