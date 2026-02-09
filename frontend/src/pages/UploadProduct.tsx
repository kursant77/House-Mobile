import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, ArrowLeft, Save, Send, Film, X } from "lucide-react";
import { productService } from "@/services/api/products";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postService } from "@/services/api/posts";
import { marketingService } from "@/services/api/marketing";
import { handleError } from "@/lib/errorHandler";
import { productSchema } from "@/lib/validation";
import { useProductUpload } from "@/hooks/useProductUpload";
import { ProductMediaUpload } from "@/components/products/ProductMediaUpload";
import { ProductForm } from "@/components/products/ProductForm";

interface MediaFile {
    file?: File;
    preview: string;
    type: 'image' | 'video';
    existingUrl?: string;
}

const productFormSchema = z.object({
    title: productSchema.shape.title,
    description: productSchema.shape.description,
    // Keep price as string in the form, validate that it is a positive number
    price: z.string()
        .min(1, "Narx kiritilishi shart")
        .refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, "Narx musbat son bo'lishi kerak"),
    category: productSchema.shape.category,
    currency: productSchema.shape.currency,
});

type ProductFormInput = z.infer<typeof productFormSchema>;

export default function UploadProduct() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const defaultTab = searchParams.get('tab') || 'product';
    const { user } = useAuthStore();
    const canPostNews = user?.role === "super_admin" || user?.role === "blogger";
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

    const {
        watch,
        setValue,
        reset,
        handleSubmit: handleProductSubmit,
        formState: { errors },
    } = useForm<ProductFormInput>({
        resolver: async (values) => {
            const result = await productFormSchema.safeParseAsync(values);
            if (result.success) {
                return { values: result.data, errors: {} };
            }
            const formErrors: Record<string, { type: string; message: string }> = {};
            result.error.errors.forEach((err) => {
                const field = err.path[0] as keyof ProductFormInput;
                if (!field) return;
                formErrors[field] = { type: "validation", message: err.message };
            });
            return { values: {}, errors: formErrors };
        },
        defaultValues: {
            title: "",
            description: "",
            price: "",
            category: "",
            currency: "UZS",
        },
    });

    const formData = watch();

    // News form state
    const [newsTitle, setNewsTitle] = useState("");
    const [newsContent, setNewsContent] = useState("");
    const [newsMedia, setNewsMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' } | null>(null);
    const newsFileInputRef = useRef<HTMLInputElement>(null);
    const [isNewsSubmitting, setIsNewsSubmitting] = useState(false);

    // Story form state
    const [storyCaption, setStoryCaption] = useState("");
    const [storyMedia, setStoryMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' } | null>(null);
    const storyFileInputRef = useRef<HTMLInputElement>(null);
    const [isStorySubmitting, setIsStorySubmitting] = useState(false);

    useEffect(() => {
        if (editId) {
            const fetchProduct = async () => {
                setIsLoadingEdit(true);
                try {
                    const product = await productService.getProductById(editId);
                    if (product) {
                        reset({
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
    }, [editId, reset, setImages, setVideo]);

    const handleSubmit = handleProductSubmit(async (values: ProductFormInput) => {

        if (!user || !user.id) {
            toast.error("Iltimos, avval tizimga kiring");
            return;
        }

        if (editId) {
            try {
                setIsSubmitting(true);
                setUploadProgress(0);

                // Prepare media files (only new files, not existing URLs)
                const mediaUploads = [
                    ...images.filter(img => img.file).map(img => ({ file: img.file as File, type: 'image' as const })),
                    ...(video?.file ? [{ file: video.file, type: 'video' as const }] : [])
                ];

                await productService.updateProduct(
                    editId,
                    {
                        title: values.title.trim(),
                        description: values.description.trim(),
                        price: Number(values.price),
                        category: values.category,
                        currency: values.currency,
                        inStock: true,
                    },
                    mediaUploads.length > 0 ? mediaUploads : undefined,
                    (progress) => setUploadProgress(progress)
                );

                toast.success("Mahsulot muvaffaqiyatli yangilandi");
                navigate("/profile");
            } catch (error: unknown) {
                const appError = handleError(error, 'UpdateProduct');
                toast.error(appError.message);
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
            setUploadProgress(0);

            const mediaUploads = [
                ...images.filter(img => img.file).map(img => ({ file: img.file as File, type: 'image' as const })),
                ...(video.file ? [{ file: video.file, type: 'video' as const }] : [])
            ];

            await productService.createProduct(
                {
                    title: values.title.trim(),
                    description: values.description.trim(),
                    price: Number(values.price),
                    category: values.category,
                    currency: values.currency,
                    inStock: true,
                    sellerId: user.id
                },
                mediaUploads,
                (progress) => setUploadProgress(progress)
            );

            toast.success("Mahsulot muvaffaqiyatli yuklandi!");
            navigate("/profile");
        } catch (error: unknown) {
            const appError = handleError(error, 'CreateProduct');
            toast.error(appError.message);
        } finally {
            setIsSubmitting(false);
        }
    });

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
                // Note: Supabase storage limit still applies even for news videos (see SUPABASE_STORAGE_LIMIT)
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

    const handleStoryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const type = file.type.startsWith('video/') ? 'video' : 'image';
        setStoryMedia({
            file: file,
            preview: URL.createObjectURL(file),
            type: type as 'image' | 'video'
        });
    };

    const handleStorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storyMedia) {
            toast.error("Iltimos, rasm yoki video yuklang");
            return;
        }

        setIsStorySubmitting(true);
        setUploadProgress(0);
        try {
            // Re-use product media bucket as 'stories' bucket is missing
            const mediaUrl = await productService.uploadMedia(storyMedia.file, 'product-media', (progress) => setUploadProgress(progress), true);

            await marketingService.createStory(mediaUrl, storyMedia.type, storyCaption);

            toast.success("Hikoya muvaffaqiyatli joylandi!");
            setStoryCaption("");
            setStoryMedia(null);
            navigate("/");
        } catch (error: unknown) {
            console.error(error);
            toast.error("Hikoya joylashda xatolik");
        } finally {
            setIsStorySubmitting(false);
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
        <div className="relative w-full min-h-full flex flex-col bg-background">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.12),_transparent_50%)]" />
            {/* Full-width content area - fills viewport below header */}
            <div className="flex-1 w-full flex flex-col min-h-0">
                <Tabs defaultValue={defaultTab} className="w-full flex-1 flex flex-col min-h-0">
                    {/* Scrollable content - fills remaining viewport */}
                    <div className="flex-1 w-full min-h-0 overflow-auto">
                        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 md:py-6 lg:py-8">
                            <div className="w-full">
                                <TabsContent value="product" className="mt-0 w-full">
                                    <div className="w-full rounded-[32px] border border-border/60 bg-gradient-to-br from-background via-background/90 to-muted/20 dark:from-background dark:via-background/90 dark:to-muted/20 shadow-2xl shadow-black/30 p-4 sm:p-6 md:p-8 lg:p-10">
                                        <form onSubmit={handleSubmit} className="w-full">
                                            {/* Two-column layout on lg+: media left, form right. Single column on small screens. */}
                                            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr,0.85fr] gap-6 md:gap-8 lg:gap-10 xl:gap-12 w-full items-stretch">
                                                {/* Left: Media upload */}
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
                                                <div className="w-full min-h-0 lg:flex lg:flex-col lg:gap-6">
                                                    <div className="rounded-2xl border border-border/60 bg-card/80 dark:bg-card/70 shadow-lg shadow-black/20 backdrop-blur-sm p-4 sm:p-5">
                                                        <div className="flex items-start gap-3">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => navigate(-1)}
                                                                className="h-9 w-9 rounded-xl hover:bg-muted/80 transition-all duration-200 active:scale-95"
                                                            >
                                                                <ArrowLeft className="h-5 w-5" />
                                                            </Button>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                                                    {editId ? "Tahrirlash" : "Yangi e'lon"}
                                                                </p>
                                                                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                                                                    {editId ? "Mahsulotni tahrirlash" : "Mahsulot joylash"}
                                                                </h2>
                                                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                                                    {editId ? "Ma'lumotlarni yangilang va saqlang" : "Mahsulot yoki yangilik qo'shish"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {canPostNews && (
                                                            <div className="mt-4">
                                                                <TabsList className="w-full h-10 sm:h-11 bg-muted/20 dark:bg-muted/20 p-1 rounded-full border border-border/50">
                                                                    <TabsTrigger value="product" className="flex-1 rounded-full text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                                        Mahsulot
                                                                    </TabsTrigger>
                                                                    <TabsTrigger value="news" className="flex-1 rounded-full text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                                        Yangilik
                                                                    </TabsTrigger>
                                                                </TabsList>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="lg:flex-1 lg:min-h-0 lg:overflow-auto">
                                                        <ProductForm
                                                            formData={formData}
                                                            onFormDataChange={(field, value) =>
                                                                setValue(field as keyof ProductFormInput, value)
                                                            }
                                                            errors={errors}
                                                        />
                                                    </div>
                                                    <div className="rounded-2xl border border-border/60 bg-card/70 dark:bg-card/60 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="flex-1 h-11 sm:h-12 rounded-xl font-semibold border-2 border-border/70 bg-background/40 hover:bg-background/70 transition-all duration-200 active:scale-[0.98]"
                                                            onClick={() => navigate(-1)}
                                                        >
                                                            Bekor qilish
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            className="flex-1 h-11 sm:h-12 rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    </div>
                                </TabsContent>

                                <TabsContent value="news" className="mt-0 w-full">
                                    <div className="w-full rounded-[32px] border border-border/60 bg-gradient-to-br from-background via-background/90 to-muted/20 dark:from-background dark:via-background/90 dark:to-muted/20 shadow-2xl shadow-black/30 p-4 sm:p-6 md:p-8 lg:p-10">
                                        <div className="rounded-2xl border border-border/60 bg-card/80 dark:bg-card/70 shadow-lg shadow-black/20 backdrop-blur-sm p-4 sm:p-5 mb-6">
                                            <div className="flex items-start gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(-1)}
                                                    className="h-9 w-9 rounded-xl hover:bg-muted/80 transition-all duration-200 active:scale-95"
                                                >
                                                    <ArrowLeft className="h-5 w-5" />
                                                </Button>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Yangilik</p>
                                                    <h2 className="text-lg sm:text-xl font-bold text-foreground">Post joylash</h2>
                                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                                        Obunachilaringiz uchun yangilik ulashing.
                                                    </p>
                                                </div>
                                            </div>
                                            {canPostNews && (
                                                <div className="mt-4">
                                                    <TabsList className="w-full h-10 sm:h-11 bg-muted/20 dark:bg-muted/20 p-1 rounded-full border border-border/50">
                                                        <TabsTrigger value="product" className="flex-1 rounded-full text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                            Mahsulot
                                                        </TabsTrigger>
                                                        <TabsTrigger value="news" className="flex-1 rounded-full text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                            Yangilik
                                                        </TabsTrigger>
                                                        <TabsTrigger value="story" className="flex-1 rounded-full text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                            Hikoya
                                                        </TabsTrigger>
                                                    </TabsList>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-start justify-between gap-4 mb-6">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-2xl bg-primary/10">
                                                        <Send className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Asosiy sahifaga post</h2>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Obunachilaringiz uchun yangilik yoki qiziqarli ma'lumot ulashing.
                                                </p>
                                            </div>
                                        </div>
                                        <form onSubmit={handleNewsSubmit} className="space-y-5 md:space-y-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="newsTitle" className="text-sm font-semibold">Sarlavha</Label>
                                                <Input
                                                    id="newsTitle"
                                                    placeholder="Sarlavha kiriting..."
                                                    className="h-12 md:h-14 text-base rounded-2xl bg-muted/15 dark:bg-muted/15 border-border/60"
                                                    value={newsTitle}
                                                    onChange={(e) => setNewsTitle(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="newsContent" className="text-sm font-semibold">Tavsif</Label>
                                                <Textarea
                                                    id="newsContent"
                                                    placeholder="Nima yangiliklar?"
                                                    className="min-h-[160px] md:min-h-[200px] resize-none rounded-2xl bg-muted/15 dark:bg-muted/15 border-border/60 text-base p-4"
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
                                                        className="w-full h-44 sm:h-52 md:h-60 rounded-2xl border border-dashed border-border/60 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 transition-all duration-300 text-muted-foreground hover:text-primary group bg-muted/10"
                                                    >
                                                        <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                            <Film className="h-10 w-10 md:h-12 md:w-12" />
                                                        </div>
                                                        <p className="text-sm md:text-base font-semibold">Video yuklash <span className="text-destructive">*</span></p>
                                                        <p className="text-xs text-muted-foreground">MP4, max 50MB</p>
                                                    </button>
                                                ) : (
                                                    <div className="relative rounded-2xl overflow-hidden border border-border/50 aspect-video bg-muted/15 group">
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
                                                    className="w-full h-12 md:h-14 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
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
                                    </div>
                                </TabsContent>

                                <TabsContent value="story" className="mt-0 w-full">
                                    <div className="w-full rounded-[32px] border border-border/60 bg-gradient-to-br from-background via-background/90 to-muted/20 dark:from-background dark:via-background/90 dark:to-muted/20 shadow-2xl shadow-black/30 p-4 sm:p-6 md:p-8 lg:p-10">
                                        <div className="rounded-2xl border border-border/60 bg-card/80 dark:bg-card/70 shadow-lg shadow-black/20 backdrop-blur-sm p-4 sm:p-5 mb-6">
                                            <div className="flex items-start gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(-1)}
                                                    className="h-9 w-9 rounded-xl hover:bg-muted/80 transition-all duration-200 active:scale-95"
                                                >
                                                    <ArrowLeft className="h-5 w-5" />
                                                </Button>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Hikoya</p>
                                                    <h2 className="text-lg sm:text-xl font-bold text-foreground">Hikoya joylash</h2>
                                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                                        24 soat davomida ko'rinadigan qisqa video yoki rasm.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <TabsList className="w-full h-10 sm:h-11 bg-muted/20 dark:bg-muted/20 p-1 rounded-full border border-border/50">
                                                    <TabsTrigger value="product" className="flex-1 rounded-full text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                        Mahsulot
                                                    </TabsTrigger>
                                                    {canPostNews && (
                                                        <TabsTrigger value="news" className="flex-1 rounded-full text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                            Yangilik
                                                        </TabsTrigger>
                                                    )}
                                                    <TabsTrigger value="story" className="flex-1 rounded-full text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                        Hikoya
                                                    </TabsTrigger>
                                                </TabsList>
                                            </div>
                                        </div>

                                        <form onSubmit={handleStorySubmit} className="space-y-5 md:space-y-6">
                                            <div className="space-y-4">
                                                {!storyMedia ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const el = storyFileInputRef.current;
                                                            if (el) {
                                                                el.click();
                                                            }
                                                        }}
                                                        className="w-full h-64 sm:h-80 rounded-2xl border border-dashed border-border/60 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 transition-all duration-300 text-muted-foreground hover:text-primary group bg-muted/10"
                                                    >
                                                        <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                            <Upload className="h-8 w-8" />
                                                        </div>
                                                        <p className="text-sm md:text-base font-semibold">Rasm yoki Video tanlang</p>
                                                    </button>
                                                ) : (
                                                    <div className="relative rounded-2xl overflow-hidden border border-border/50 aspect-[9/16] bg-muted/15 group max-w-sm mx-auto">
                                                        {storyMedia.type === 'video' ? (
                                                            <video src={storyMedia.preview} className="w-full h-full object-cover" controls />
                                                        ) : (
                                                            <img src={storyMedia.preview} className="w-full h-full object-cover" alt="Preview" />
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setStoryMedia(null)}
                                                            className="absolute top-3 right-3 p-2 bg-black/70 rounded-full text-white hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                <input type="file" ref={storyFileInputRef} className="hidden" onChange={handleStoryFileSelect} accept="image/*,video/*" />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="storyCaption" className="text-sm font-semibold">Izoh (ixtiyoriy)</Label>
                                                <Input
                                                    id="storyCaption"
                                                    placeholder="Hikoya haqida..."
                                                    className="h-12 rounded-2xl bg-muted/15 dark:bg-muted/15 border-border/60"
                                                    value={storyCaption}
                                                    onChange={(e) => setStoryCaption(e.target.value)}
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={isStorySubmitting || !storyMedia}
                                                className="w-full h-12 md:h-14 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {isStorySubmitting ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        Yuklanmoqda {uploadProgress}%
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                                                        Hikoyani joylash
                                                    </>
                                                )}
                                            </Button>
                                        </form>
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
