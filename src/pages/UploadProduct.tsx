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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20 md:pb-0">
            <Header />
            <Sidebar />
            <BottomNav />

            <div className="md:pl-64 pt-16 md:pt-20 w-full">
                <main className="w-full min-h-[calc(100vh-4rem)]">
                    {/* Sticky Header */}
                    <div className="sticky top-16 md:top-20 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10 py-4 md:py-5 mb-4 md:mb-6">
                        <div className="max-w-[1920px] mx-auto flex items-center gap-3 sm:gap-4">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => navigate(-1)}
                                className="h-10 w-10 md:h-11 md:w-11 hover:bg-muted transition-all duration-200 rounded-xl hover:scale-105 active:scale-95 shrink-0"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex-1 min-w-0 space-y-1">
                                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">
                                    {editId ? "Tahrirlash" : "Yangi e'lon"}
                                </h1>
                                <p className="text-xs sm:text-sm md:text-base text-muted-foreground truncate">
                                    {editId ? "Mahsulot ma'lumotlarini o'zgartirish" : "Yangi mahsulot yoki yangilik ulashing"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="product" className="w-full">
                        {(user?.role === 'super_admin' || user?.role === 'blogger') && (
                            <TabsList className="mb-6 md:mb-8 w-full max-w-[450px] bg-muted/50 dark:bg-muted/30 p-1 h-11 md:h-12 rounded-xl border border-border/50">
                                <TabsTrigger value="product" className="flex-1 rounded-lg text-sm md:text-base font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                    Mahsulot
                                </TabsTrigger>
                                <TabsTrigger value="news" className="flex-1 rounded-lg text-sm md:text-base font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                    Yangilik
                                </TabsTrigger>
                            </TabsList>
                        )}

                        <TabsContent value="product" className="mt-0">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
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

                                    <div className="space-y-5 md:space-y-6 lg:space-y-8">
                                        <ProductForm
                                            formData={formData}
                                            onFormDataChange={(field, value) => setFormData({ ...formData, [field]: value })}
                                        />

                                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 md:pt-5 border-t border-border/50">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1 h-11 md:h-12 lg:h-13 rounded-xl md:rounded-2xl font-semibold border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm md:text-base"
                                                onClick={() => navigate(-1)}
                                            >
                                                Bekor qilish
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="flex-1 h-11 md:h-12 lg:h-13 rounded-xl md:rounded-2xl font-bold gap-2 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                                                        <span className="text-xs md:text-sm font-medium">{uploadProgress}%</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {editId ? <Save className="h-4 w-4 md:h-5 md:w-5" /> : <Upload className="h-4 w-4 md:h-5 md:w-5" />}
                                                        <span>{editId ? "Saqlash" : "Yuklash"}</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </TabsContent>

                            <TabsContent value="news" className="mt-0">
                                <div className="max-w-[1920px] mx-auto">
                                    <Card className="w-full max-w-4xl mx-auto border border-border/50 shadow-md md:shadow-xl rounded-2xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                                <CardHeader className="pb-4 md:pb-5">
                                    <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-primary/10">
                                            <Send className="h-5 w-5 text-primary" />
                                        </div>
                                        Asosiy sahifaga post joylash
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm md:text-base mt-2">
                                        Obunachilaringiz uchun yangilik yoki qiziqarli ma'lumot ulashing
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleNewsSubmit} className="space-y-5 md:space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="newsTitle" className="text-sm md:text-base font-bold opacity-70">
                                                Sarlavha
                                            </Label>
                                            <Input
                                                id="newsTitle"
                                                placeholder="Sarlavha kiriting..."
                                                className="h-12 md:h-14 text-base md:text-lg font-bold rounded-xl md:rounded-2xl bg-muted/30 dark:bg-muted/20 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                                                value={newsTitle}
                                                onChange={(e) => setNewsTitle(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="newsContent" className="text-sm md:text-base font-bold opacity-70">
                                                Tavsif (Description)
                                            </Label>
                                            <Textarea
                                                id="newsContent"
                                                placeholder="Nima yangiliklar?"
                                                className="min-h-[140px] md:min-h-[160px] lg:min-h-[180px] resize-none border-border/50 bg-muted/30 dark:bg-muted/20 focus-visible:ring-2 focus-visible:ring-primary/50 text-base md:text-lg p-4 rounded-xl md:rounded-2xl transition-all"
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
                                                    className="w-full h-44 sm:h-48 md:h-56 lg:h-64 rounded-xl md:rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent transition-all duration-300 text-muted-foreground hover:text-primary group"
                                                >
                                                    <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                        <Film className="h-8 w-8 md:h-10 md:w-10" />
                                                    </div>
                                                    <div className="text-center space-y-1">
                                                        <p className="text-sm md:text-base font-bold">Video yuklash <span className="text-destructive">*</span></p>
                                                        <p className="text-xs md:text-sm opacity-60">MP4 formatda</p>
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="relative rounded-xl md:rounded-2xl overflow-hidden border-2 border-border/50 bg-muted/30 aspect-video group shadow-lg hover:shadow-xl transition-all duration-300">
                                                    {newsMedia.type === 'image' ? (
                                                        <img src={newsMedia.preview} className="w-full h-full object-cover" alt="preview" />
                                                    ) : (
                                                        <video src={newsMedia.preview} className="w-full h-full object-cover" controls />
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewsMedia(null)}
                                                        className="absolute top-3 right-3 p-2 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-black/90 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-4 pt-4 md:pt-5 border-t border-border/50">
                                                <input
                                                    type="file"
                                                    ref={newsFileInputRef}
                                                    className="hidden"
                                                    onChange={handleNewsFileSelect}
                                                    accept="video/*"
                                                />
                                                <Button
                                                    type="submit"
                                                    disabled={isNewsSubmitting || !newsTitle.trim() || !newsContent.trim() || !newsMedia || newsMedia.type !== 'video'}
                                                    className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl shadow-primary/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm md:text-base"
                                                >
                                                    {isNewsSubmitting ? (
                                                        <div className="flex items-center gap-3">
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                            <span className="text-sm md:text-base">Yuklanmoqda {uploadProgress}%</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Send className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                                                            <span className="text-sm md:text-base">Yangilikni ulashish</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    </div>
</div>
    );
}
