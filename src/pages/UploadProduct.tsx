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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postService } from "@/services/api/posts";
import { Send, ImageIcon } from "lucide-react";

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
    const [images, setImages] = useState<MediaFile[]>([]);
    const [video, setVideo] = useState<MediaFile | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        category: "",
    });

    // News form state
    const [newsTitle, setNewsTitle] = useState("");
    const [newsContent, setNewsContent] = useState("");
    const [newsMedia, setNewsMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' } | null>(null);
    const newsFileInputRef = useRef<HTMLInputElement>(null);
    const [isNewsSubmitting, setIsNewsSubmitting] = useState(false);

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

                        const existingImages: MediaFile[] = [];
                        if (product.images) {
                            product.images.forEach(url => existingImages.push({ preview: url, type: 'image', existingUrl: url }));
                        }
                        setImages(existingImages);

                        if (product.videoUrl) {
                            setVideo({ preview: product.videoUrl, type: 'video', existingUrl: product.videoUrl });
                        }
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

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB for images

        const newImages: MediaFile[] = files
            .filter(file => {
                if (file.size > MAX_SIZE) {
                    toast.error(`${file.name} juda katta. Maksimal hajm: 10MB`);
                    return false;
                }
                return file.type.startsWith('image/');
            })
            .map(file => ({
                file,
                preview: URL.createObjectURL(file),
                type: 'image',
            }));

        setImages(prev => [...prev, ...newImages]);
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE = 100 * 1024 * 1024; // 100MB for video
        if (file.size > MAX_SIZE) {
            toast.error("Video hajmi 100MB dan oshmasligi kerak");
            return;
        }

        if (!file.type.startsWith('video/')) {
            toast.error("Iltimos, video fayl yuklang");
            return;
        }

        setVideo({
            file,
            preview: URL.createObjectURL(file),
            type: 'video'
        });

        if (videoInputRef.current) videoInputRef.current.value = "";
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const updated = [...prev];
            if (updated[index].file) URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const removeVideo = () => {
        if (video?.file) URL.revokeObjectURL(video.preview);
        setVideo(null);
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

        if (images.length === 0) {
            toast.error("Iltimos, kamida bitta rasm yuklang");
            return;
        }

        if (!video) {
            toast.error("Video yuklash majburiy (Reels bo'limi uchun)");
            return;
        }

        try {
            setIsSubmitting(true);
            const mediaUploads = [
                ...images.filter(img => img.file).map(img => ({ file: img.file as File, type: 'image' as const })),
                ...(video.file ? [{ file: video.file, type: 'video' as const }] : [])
            ];

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

    const handleNewsFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const type = file.type.startsWith('video/') ? 'video' : 'image';
        setNewsMedia({
            file,
            preview: URL.createObjectURL(file),
            type: type as any
        });
    };

    const handleNewsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsTitle.trim() || !newsContent.trim() || !newsMedia || newsMedia.type !== 'video') {
            toast.error("Iltimos, sarlavha, tavsif va video yuklang (Video majburiy)");
            return;
        }

        setIsNewsSubmitting(true);
        try {
            let mediaUrl = "";
            if (newsMedia) {
                mediaUrl = await productService.uploadMedia(newsMedia.file);
            }

            await postService.createPost({
                title: newsTitle,
                content: newsContent,
                mediaUrl,
                mediaType: newsMedia?.type,
            });

            toast.success("Yangilik muvaffaqiyatli joylandi!");
            setNewsTitle("");
            setNewsContent("");
            setNewsMedia(null);
            navigate("/");
        } catch (error: any) {
            toast.error("Xatolik: " + error.message);
        } finally {
            setIsNewsSubmitting(false);
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
                                {editId ? "Mahsulot ma'lumotlarini o'zgartirish" : "Yangi mahsulot yoki yangilik ulashing"}
                            </p>
                        </div>
                    </div>

                    <Tabs defaultValue="product" className="w-full">
                        {(user?.role === 'super_admin' || user?.role === 'blogger') && (
                            <TabsList className="mb-8 w-full max-w-[400px] bg-muted/50 p-1 h-12 rounded-xl">
                                <TabsTrigger value="product" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold">
                                    Mahsulot
                                </TabsTrigger>
                                <TabsTrigger value="news" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold">
                                    Yangilik
                                </TabsTrigger>
                            </TabsList>
                        )}

                        <TabsContent value="product" className="mt-0">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    Mahsulot Rasmlari <span className="text-destructive">*</span>
                                                </CardTitle>
                                                <CardDescription>
                                                    Mahsulotning yuqori sifatli rasmlarini yuklang
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {images.map((img, index) => (
                                                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-border">
                                                            <img src={img.preview} className="h-full w-full object-cover" alt="preview" />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeImage(index)}
                                                                className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => imageInputRef.current?.click()}
                                                        className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                                                    >
                                                        <Plus className="h-6 w-6" />
                                                        <span className="text-[10px]">Rasm</span>
                                                    </button>
                                                </div>
                                                <input
                                                    type="file"
                                                    ref={imageInputRef}
                                                    onChange={handleImageSelect}
                                                    className="hidden"
                                                    multiple
                                                    accept="image/*"
                                                />
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    Reel Video <span className="text-destructive">*</span>
                                                </CardTitle>
                                                <CardDescription>
                                                    Qisqa video sharh (Reels uchun)
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {video ? (
                                                    <div className="relative aspect-[9/16] w-full max-w-[200px] rounded-xl overflow-hidden border border-border bg-black">
                                                        <video src={video.preview} className="h-full w-full object-cover" controls />
                                                        <button
                                                            type="button"
                                                            onClick={removeVideo}
                                                            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => videoInputRef.current?.click()}
                                                        className="w-full h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                                                    >
                                                        <Film className="h-8 w-8" />
                                                        <span className="text-sm font-medium">Video Yuklash</span>
                                                        <span className="text-xs text-muted-foreground">MP4, max 100MB</span>
                                                    </button>
                                                )}
                                                <input
                                                    type="file"
                                                    ref={videoInputRef}
                                                    onChange={handleVideoSelect}
                                                    className="hidden"
                                                    accept="video/*"
                                                />
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
                                                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                                                        <strong>Maslahat:</strong> Bioga qurilmaning barcha texnik xususiyatlarini (xotira, kamera, protsessor va h.k.) to'liq kiritishni unutmang. Bu xaridorlarga tanlashda yordam beradi.
                                                    </div>
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
                        </TabsContent>

                        <TabsContent value="news" className="mt-0">
                            <Card className="max-w-2xl border-none shadow-none md:shadow-md md:border">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <Send className="h-5 w-5 text-primary" />
                                        Asosiy sahifaga post joylash
                                    </CardTitle>
                                    <CardDescription>
                                        Obunachilaringiz uchun yangilik yoki qiziqarli ma'lumot ulashing
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleNewsSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="newsTitle" className="text-sm font-bold opacity-70">
                                                Sarlavha
                                            </Label>
                                            <Input
                                                id="newsTitle"
                                                placeholder="Sarlavha kiriting..."
                                                className="h-12 text-lg font-bold rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                                                value={newsTitle}
                                                onChange={(e) => setNewsTitle(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="newsContent" className="text-sm font-bold opacity-70">
                                                Tavsif (Description)
                                            </Label>
                                            <Textarea
                                                id="newsContent"
                                                placeholder="Nima yangiliklar?"
                                                className="min-h-[150px] resize-none border-none bg-zinc-50 dark:bg-zinc-900/50 focus-visible:ring-0 text-lg p-4 rounded-2xl"
                                                value={newsContent}
                                                onChange={(e) => setNewsContent(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            {!newsMedia ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (newsFileInputRef.current) {
                                                            newsFileInputRef.current.accept = "video/*";
                                                            newsFileInputRef.current.click();
                                                        }
                                                    }}
                                                    className="w-full h-40 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                                                >
                                                    <Film className="h-10 w-10" />
                                                    <div className="text-center">
                                                        <p className="text-sm font-bold">Video yuklash <span className="text-destructive">*</span></p>
                                                        <p className="text-xs opacity-60">MP4 formatda, max 100MB</p>
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 aspect-video group">
                                                    {newsMedia.type === 'image' ? (
                                                        <img src={newsMedia.preview} className="w-full h-full object-cover" alt="preview" />
                                                    ) : (
                                                        <video src={newsMedia.preview} className="w-full h-full object-cover" controls />
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewsMedia(null)}
                                                        className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="file"
                                                        ref={newsFileInputRef}
                                                        className="hidden"
                                                        onChange={handleNewsFileSelect}
                                                        accept="video/*"
                                                    />
                                                </div>

                                                <Button
                                                    type="submit"
                                                    disabled={isNewsSubmitting || !newsTitle.trim() || !newsContent.trim() || !newsMedia || newsMedia.type !== 'video'}
                                                    className="w-full h-12 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                                >
                                                    {isNewsSubmitting ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Send className="h-4 w-4 mr-2" />
                                                            Yangilikni ulashish
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    );
}
