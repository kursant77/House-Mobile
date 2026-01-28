import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Loader2, ArrowLeft, Save, Send, Film, X } from "lucide-react";
import { productService } from "@/services/api/products";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postService } from "@/services/api/posts";
import { handleError } from "@/lib/errorHandler";
import { postSchema, productSchema } from "@/lib/validation";
import { useProductUpload } from "@/hooks/useProductUpload";
import { ProductMediaUpload } from "@/components/products/ProductMediaUpload";
import { ProductForm } from "@/components/products/ProductForm";

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
    
    const {
        images,
        video,
        uploadProgress,
        setUploadProgress,
        imageInputRef,
        videoInputRef,
        handleImageSelect,
        handleVideoSelect,
        removeImage,
        removeVideo,
        setImages,
        setVideo,
    } = useProductUpload();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        category: "",
        currency: "UZS",
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
                            currency: product.currency || "UZS",
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !user.id) {
            toast.error("Iltimos, avval tizimga kiring");
            return;
        }

        if (editId) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/b052e248-b93d-4ae6-bcfc-4e1a4be8a219',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UploadProduct.tsx:109',message:'Product edit submit',data:{editId,hasNewImages:images.some(img=>img.file),hasNewVideo:video?.file,imageCount:images.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            try {
                setIsSubmitting(true);
                setUploadProgress(0);
                
                // Prepare media files (only new files, not existing URLs)
                const mediaUploads = [
                    ...images.filter(img => img.file).map(img => ({ file: img.file as File, type: 'image' as const })),
                    ...(video?.file ? [{ file: video.file, type: 'video' as const }] : [])
                ];

                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/b052e248-b93d-4ae6-bcfc-4e1a4be8a219',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UploadProduct.tsx:112',message:'Calling updateProduct',data:{editId,title:formData.title,mediaCount:mediaUploads.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/b052e248-b93d-4ae6-bcfc-4e1a4be8a219',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UploadProduct.tsx:129',message:'Before updateProduct call',data:{editId,formData:{title:formData.title,price:formData.price,currency:formData.currency},mediaCount:mediaUploads.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                await productService.updateProduct(
                    editId,
                    {
                        title: formData.title,
                        description: formData.description,
                        price: parseFloat(formData.price),
                        category: formData.category,
                        currency: formData.currency,
                        inStock: true,
                    },
                    mediaUploads.length > 0 ? mediaUploads : undefined,
                    (progress) => setUploadProgress(progress)
                );
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/b052e248-b93d-4ae6-bcfc-4e1a4be8a219',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UploadProduct.tsx:142',message:'After updateProduct call',data:{editId,success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/b052e248-b93d-4ae6-bcfc-4e1a4be8a219',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UploadProduct.tsx:120',message:'updateProduct succeeded',data:{editId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                toast.success("Mahsulot muvaffaqiyatli yangilandi");
                navigate("/profile");
            } catch (error: unknown) {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/b052e248-b93d-4ae6-bcfc-4e1a4be8a219',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UploadProduct.tsx:123',message:'updateProduct error',data:{error:String(error),editId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                const appError = handleError(error, 'UpdateProduct');
                toast.error(appError.message);
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        // Validate product data
        const productData = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            price: parseFloat(formData.price),
            category: formData.category,
            currency: formData.currency,
            inStock: true,
        };

        const productValidation = productSchema.safeParse(productData);
        if (!productValidation.success) {
            productValidation.error.errors.forEach(err => {
                toast.error(err.message);
            });
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
            setUploadProgress(0);

            const mediaUploads = [
                ...images.filter(img => img.file).map(img => ({ file: img.file as File, type: 'image' as const })),
                ...(video.file ? [{ file: video.file, type: 'video' as const }] : [])
            ];

            await productService.createProduct(
                {
                    ...productValidation.data,
                    sellerId: user.id
                },
                mediaUploads,
                (progress) => setUploadProgress(progress)
            );

            toast.success("Mahsulot muvaffaqiyatli yuklandi!");
            navigate("/profile");
        } catch (error: unknown) {
            const appError = handleError(error, 'CreateProduct');
            toast.error(appError.message, {
                action: {
                    label: 'Qayta urinish',
                    onClick: () => handleSubmit(e as React.FormEvent<HTMLFormElement>)
                }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNewsFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Only validate file type, not size (no limit for news videos)
        if (!file.type.startsWith('video/')) {
            toast.error("Iltimos, video fayl yuklang");
            return;
        }

        setNewsMedia({
            file: file,
            preview: URL.createObjectURL(file),
            type: 'video' as const
        });
    };

    const handleNewsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsTitle.trim() || !newsContent.trim() || !newsMedia || newsMedia.type !== 'video') {
            toast.error("Iltimos, sarlavha, tavsif va video yuklang (Video majburiy)");
            return;
        }

        setIsNewsSubmitting(true);
        setUploadProgress(0);
        try {
            let mediaUrl = "";
            if (newsMedia) {
                // Note: Supabase storage limit (50MB) still applies even for news videos
                // skipSizeValidation only skips client-side validation, not server limit
                mediaUrl = await productService.uploadMedia(newsMedia.file, 'product-media', (progress) => setUploadProgress(progress), true);
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
        } catch (error: unknown) {
            const appError = handleError(error, 'CreatePost');
            toast.error(appError.message);
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
        <div className="min-h-[100dvh] min-h-screen w-full flex flex-col bg-background pb-20 md:pb-0">
            <Header />
            <Sidebar />
            <BottomNav />

            {/* Full-width content area - fills viewport below header */}
            <div className="flex-1 w-full md:pl-64 pt-14 md:pt-16 lg:pt-20 flex flex-col min-h-0">
                <Tabs defaultValue="product" className="w-full flex-1 flex flex-col min-h-0">
                    {/* Sticky top bar: title + tabs */}
                    <div className="sticky top-14 md:top-16 lg:top-20 z-20 flex-shrink-0 w-full bg-background/95 dark:bg-background/90 backdrop-blur-md border-b border-border/60 shadow-sm">
                        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-3 sm:py-4 md:py-5">
                            <div className="w-full max-w-[1920px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => navigate(-1)}
                                        className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-xl hover:bg-muted/80 transition-all duration-200 active:scale-95 shrink-0"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight text-foreground truncate">
                                            {editId ? "Tahrirlash" : "Yangi e'lon"}
                                        </h1>
                                        <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                                            {editId ? "Mahsulot ma'lumotlarini o'zgartirish" : "Mahsulot yoki yangilik qo'shish"}
                                        </p>
                                    </div>
                                </div>
                                {(user?.role === 'super_admin' || user?.role === 'blogger') && (
                                    <div className="hidden lg:block w-full sm:w-auto sm:min-w-[280px] md:min-w-[320px]">
                                        <TabsList className="w-full sm:w-full h-10 md:h-11 bg-muted/60 dark:bg-muted/40 p-1 rounded-xl border border-border/50">
                                            <TabsTrigger value="product" className="flex-1 rounded-lg text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                                Mahsulot
                                            </TabsTrigger>
                                            <TabsTrigger value="news" className="flex-1 rounded-lg text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                                Yangilik
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Scrollable content - fills remaining viewport */}
                    <div className="flex-1 w-full min-h-0 overflow-auto">
                        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 md:py-6 lg:py-8">
                            <div className="w-full max-w-[1920px] mx-auto">
                                {(user?.role === 'super_admin' || user?.role === 'blogger') && (
                                    <div className="mb-4 md:mb-6 lg:hidden w-full">
                                        <TabsList className="w-full h-11 bg-muted/60 dark:bg-muted/40 p-1 rounded-xl border border-border/50">
                                            <TabsTrigger value="product" className="flex-1 rounded-lg text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Mahsulot</TabsTrigger>
                                            <TabsTrigger value="news" className="flex-1 rounded-lg text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Yangilik</TabsTrigger>
                                        </TabsList>
                                    </div>
                                )}

                                <TabsContent value="product" className="mt-0 w-full">
                                    <form onSubmit={handleSubmit} className="w-full">
                                        {/* Two-column layout on lg+: media left, form right. Single column on small screens. */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10 xl:gap-12 w-full">
                                            {/* Left: Media upload - full width on mobile, half on desktop */}
                                            <div className="w-full min-h-0 lg:min-h-[60vh] lg:flex lg:flex-col">
                                                <ProductMediaUpload
                                                    images={images}
                                                    video={video}
                                                    imageInputRef={imageInputRef}
                                                    videoInputRef={videoInputRef}
                                                    onImageSelect={handleImageSelect}
                                                    onVideoSelect={handleVideoSelect}
                                                    onRemoveImage={removeImage}
                                                    onRemoveVideo={removeVideo}
                                                />
                                            </div>

                                            {/* Right: Form + actions */}
                                            <div className="w-full min-h-0 lg:flex lg:flex-col lg:gap-4">
                                                <div className="lg:flex-1 lg:min-h-0 lg:overflow-auto">
                                                    <ProductForm
                                                        formData={formData}
                                                        onFormDataChange={(field, value) => setFormData({ ...formData, [field]: value })}
                                                    />
                                                </div>
                                                <div className="flex flex-col sm:flex-row gap-3 pt-4 md:pt-6 lg:pt-4 border-t border-border/50 mt-4 lg:mt-0 lg:flex-shrink-0">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="flex-1 h-11 sm:h-12 rounded-xl font-semibold border-2 transition-all duration-200 active:scale-[0.98]"
                                                        onClick={() => navigate(-1)}
                                                    >
                                                        Bekor qilish
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        className="flex-1 h-11 sm:h-12 rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                                        disabled={isSubmitting}
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                <span>{uploadProgress}%</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {editId ? <Save className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                                                                {editId ? "Saqlash" : "Yuklash"}
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </TabsContent>

                                <TabsContent value="news" className="mt-0 w-full">
                                    <div className="w-full max-w-2xl mx-auto lg:max-w-3xl">
                                        <Card className="w-full border border-border/50 shadow-lg rounded-2xl bg-card/90 dark:bg-card/80 backdrop-blur-sm overflow-hidden">
                                            <CardHeader className="pb-4 md:pb-5 px-4 sm:px-6 md:px-8">
                                                <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-primary/10">
                                                        <Send className="h-5 w-5 text-primary" />
                                                    </div>
                                                    Asosiy sahifaga post joylash
                                                </CardTitle>
                                                <CardDescription className="text-sm md:text-base mt-1">
                                                    Obunachilaringiz uchun yangilik yoki qiziqarli ma'lumot ulashing
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="px-4 sm:px-6 md:px-8 pb-6 md:pb-8">
                                                <form onSubmit={handleNewsSubmit} className="space-y-5 md:space-y-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="newsTitle" className="text-sm font-semibold">Sarlavha</Label>
                                                        <Input
                                                            id="newsTitle"
                                                            placeholder="Sarlavha kiriting..."
                                                            className="h-12 md:h-14 text-base rounded-xl bg-muted/30 dark:bg-muted/20 border-border/50"
                                                            value={newsTitle}
                                                            onChange={(e) => setNewsTitle(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="newsContent" className="text-sm font-semibold">Tavsif</Label>
                                                        <Textarea
                                                            id="newsContent"
                                                            placeholder="Nima yangiliklar?"
                                                            className="min-h-[140px] md:min-h-[180px] resize-none rounded-xl bg-muted/30 dark:bg-muted/20 border-border/50 text-base p-4"
                                                            value={newsContent}
                                                            onChange={(e) => setNewsContent(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        {!newsMedia ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const el = newsFileInputRef.current;
                                                                    if (el) {
                                                                        el.accept = "video/*";
                                                                        el.click();
                                                                    }
                                                                }}
                                                                className="w-full h-40 sm:h-48 md:h-56 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 transition-all duration-300 text-muted-foreground hover:text-primary group"
                                                            >
                                                                <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                                    <Film className="h-10 w-10 md:h-12 md:w-12" />
                                                                </div>
                                                                <p className="text-sm md:text-base font-semibold">Video yuklash <span className="text-destructive">*</span></p>
                                                                <p className="text-xs text-muted-foreground">MP4, max 50MB</p>
                                                            </button>
                                                        ) : (
                                                            <div className="relative rounded-2xl overflow-hidden border-2 border-border/50 aspect-video bg-muted/30 group">
                                                                <video src={newsMedia.preview} className="w-full h-full object-cover" controls />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setNewsMedia(null)}
                                                                    className="absolute top-3 right-3 p-2 bg-black/70 rounded-full text-white hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <input type="file" ref={newsFileInputRef} className="hidden" onChange={handleNewsFileSelect} accept="video/*" />
                                                        <Button
                                                            type="submit"
                                                            disabled={isNewsSubmitting || !newsTitle.trim() || !newsContent.trim() || !newsMedia || newsMedia.type !== 'video'}
                                                            className="w-full h-12 md:h-14 rounded-xl font-bold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                                                        >
                                                            {isNewsSubmitting ? (
                                                                <>
                                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                                    Yuklanmoqda {uploadProgress}%
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                                                                    Yangilikni ulashish
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </div>
                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
