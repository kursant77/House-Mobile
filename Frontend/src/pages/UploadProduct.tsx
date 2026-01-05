import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, X, Upload, Film, Image as LucideImage, Loader2, ArrowLeft, Save } from "lucide-react";
import { productService } from "@/services/api/products";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { categories } from "@/data/mockProducts";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

interface MediaFile {
    file?: File;
    preview: string;
    type: 'image' | 'video';
    existingUrl?: string;
}

export default function UploadProduct() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const { user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [media, setMedia] = useState<MediaFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        category: "",
    });

    useEffect(() => {
        if (editId) {
            const fetchProduct = async () => {
                setIsLoadingEdit(true);
                try {
                    const product = await productService.getProductById(editId);
                    if (product) {
                        setFormData({
                            title: product.title,
                            description: product.description,
                            price: product.price.toString(),
                            category: product.category,
                        });

                        const existingMedia: MediaFile[] = [];
                        if (product.images) {
                            product.images.forEach(url => existingMedia.push({ preview: url, type: 'image', existingUrl: url }));
                        }
                        if (product.videoUrl) {
                            existingMedia.push({ preview: product.videoUrl, type: 'video', existingUrl: product.videoUrl });
                        }
                        setMedia(existingMedia);
                    }
                } catch (err) {
                    toast.error("Mahsulotni yuklashda xatolik");
                } finally {
                    setIsLoadingEdit(false);
                }
            };
            fetchProduct();
        }
    }, [editId]);

    const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB

        const filteredFiles = files.filter(file => {
            if (file.size > MAX_SIZE) {
                toast.error(`${file.name} juda katta. Maksimal hajm: 50MB`);
                return false;
            }
            return true;
        });

        const newMedia: MediaFile[] = filteredFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith('video/') ? 'video' : 'image',
        }));
        setMedia(prev => [...prev, ...newMedia]);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeMedia = (index: number) => {
        setMedia(prev => {
            const updated = [...prev];
            if (updated[index].file) {
                URL.revokeObjectURL(updated[index].preview);
            }
            updated.splice(index, 1);
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !user.id) {
            toast.error("Iltimos, avval tizimga kiring");
            return;
        }

        if (editId) {
            try {
                setIsSubmitting(true);
                await productService.updateProduct(editId, {
                    title: formData.title,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    currency: "so'm",
                    inStock: true,
                });
                toast.success("Mahsulot muvaffaqiyatli yangilandi");
                navigate("/profile");
            } catch (error) {
                toast.error("Xatolik yuz berdi");
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        if (media.length === 0) {
            toast.error("Iltimos, kamida bitta rasm yuklang");
            return;
        }

        if (!media.some(m => m.type === 'video')) {
            toast.error("Video yuklash majburiy (Reels bo'limi uchun)");
            return;
        }

        try {
            setIsSubmitting(true);
            const mediaUploads = media.filter(m => m.file).map(m => ({
                file: m.file as File,
                type: m.type
            }));

            await productService.createProduct(
                {
                    title: formData.title,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    currency: "so'm",
                    inStock: true,
                    sellerId: user.id
                },
                mediaUploads
            );

            toast.success("Mahsulot muvaffaqiyatli yuklandi!");
            navigate("/profile");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Mahsulotni yuklashda xatolik yuz berdi");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingEdit) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            <Header />
            <Sidebar />
            <BottomNav />

            <div className="md:pl-64 pt-16">
                <main className="max-w-4xl mx-auto p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">{editId ? "Tahrirlash" : "Yangi e'lon"}</h1>
                            <p className="text-muted-foreground">
                                {editId ? "Mahsulot ma'lumotlarini o'zgartirish" : "Mahsulotingizni soting va ko'proq mijoz toping"}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            Media <span className="text-destructive">*</span>
                                        </CardTitle>
                                        <CardDescription>
                                            Mahsulot rasmlari va <span className="font-bold text-primary italic">kamida bitta video (reel)</span> yuklang.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            {media.map((m, index) => (
                                                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-border">
                                                    {m.type === 'video' ? (
                                                        <video src={m.preview} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <img src={m.preview} className="h-full w-full object-cover" alt="preview" />
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMedia(index)}
                                                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded-md text-[10px] text-white flex items-center gap-1 backdrop-blur-sm">
                                                        {m.type === 'video' ? <Film className="h-3 w-3" /> : <LucideImage className="h-3 w-3" />}
                                                        {m.type === 'video' ? 'Reel' : 'Rasm'}
                                                    </div>
                                                </div>
                                            ))}

                                            {!editId && (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary group"
                                                >
                                                    <div className="p-3 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                                                        <Plus className="h-6 w-6" />
                                                    </div>
                                                    <span className="text-xs font-medium">Qo'shish</span>
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleMediaSelect}
                                            className="hidden"
                                            multiple
                                            accept="image/*,video/*"
                                        />
                                        {!media.some(m => m.type === 'video') && !editId && (
                                            <p className="text-xs text-destructive mt-3 flex items-center gap-1 font-medium italic">
                                                <Film className="h-3 w-3" />
                                                Video yuklash majburiy (Reels bo'limi uchun)
                                            </p>
                                        )}
                                        {editId && (
                                            <p className="text-xs text-muted-foreground mt-3 italic">
                                                Tahrirlash rejimida rasmlarni o'zgartirish hozircha mavjud emas.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Ma'lumotlar</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Nomi <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="title"
                                                placeholder="Masalan: iPhone 15 Pro Max"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="price">Narxi ($ yoki so'm) <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="price"
                                                type="number"
                                                placeholder="Narxi"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="category">Kategoriya <span className="text-destructive">*</span></Label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={val => setFormData({ ...formData, category: val })}
                                            >
                                                <SelectTrigger>
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
                                            <Label htmlFor="description">Tavsif <span className="text-destructive">*</span></Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Mahsulot haqida batafsil ma'lumot bering..."
                                                className="min-h-[120px]"
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => navigate(-1)}
                                    >
                                        Bekor qilish
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 gap-2"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            editId ? <Save className="h-4 w-4" /> : <Upload className="h-4 w-4" />
                                        )}
                                        {editId ? "Saqlash" : "Yuklash"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}
