import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Upload, Loader2, ArrowLeft, Save, Send, Film, X, Check,
    ChevronRight, Eye, Smartphone, Laptop, Headphones, Watch,
    Cable, Tablet, Package, ImageIcon, Info, DollarSign, Tag,
    FileText, Sparkles
} from "lucide-react";
import { productService } from "@/services/api/products";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postService } from "@/services/api/posts";
import { marketingService } from "@/services/api/marketing";
import { handleError } from "@/lib/errorHandler";
import { productSchema } from "@/lib/validation";
import { useProductUpload } from "@/hooks/useProductUpload";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────
interface MediaFile {
    file?: File;
    preview: string;
    type: 'image' | 'video';
    existingUrl?: string;
}

// ── Schema ────────────────────────────────────────────────────
const productFormSchema = z.object({
    title: productSchema.shape.title,
    description: productSchema.shape.description,
    price: z.string()
        .min(1, "Narx kiritilishi shart")
        .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Narx musbat son bo'lishi kerak"),
    category: productSchema.shape.category,
    currency: productSchema.shape.currency,
});
type ProductFormInput = z.infer<typeof productFormSchema>;

// ── Categories with icons ─────────────────────────────────────
const CATEGORIES = [
    { id: "smartphones", label: "Smartfonlar", Icon: Smartphone, color: "from-blue-500 to-cyan-500" },
    { id: "laptops", label: "Noutbuklar", Icon: Laptop, color: "from-violet-500 to-purple-500" },
    { id: "audio", label: "Audio", Icon: Headphones, color: "from-pink-500 to-rose-500" },
    { id: "watches", label: "Soatlar", Icon: Watch, color: "from-amber-500 to-orange-500" },
    { id: "accessories", label: "Aksessuarlar", Icon: Cable, color: "from-green-500 to-emerald-500" },
    { id: "tablets", label: "Planshetlar", Icon: Tablet, color: "from-sky-500 to-blue-500" },
    { id: "other", label: "Boshqa", Icon: Package, color: "from-slate-500 to-zinc-500" },
];

// ── UZS formatter ─────────────────────────────────────────────
function formatUZS(value: string) {
    const num = value.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// ── Step indicator ─────────────────────────────────────────────
const STEPS = [
    { id: 1, label: "Media", icon: ImageIcon },
    { id: 2, label: "Ma'lumot", icon: FileText },
    { id: 3, label: "Ko'rib chiqish", icon: Eye },
];

function StepBar({ step }: { step: number }) {
    return (
        <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, idx) => {
                const done = step > s.id;
                const active = step === s.id;
                return (
                    <div key={s.id} className="flex items-center flex-1">
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 text-sm font-bold",
                                done && "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30",
                                active && "bg-background border-primary text-primary shadow-lg shadow-primary/20 scale-110",
                                !done && !active && "bg-muted/30 border-border text-muted-foreground"
                            )}>
                                {done ? <Check className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
                            </div>
                            <span className={cn(
                                "text-[11px] font-semibold whitespace-nowrap",
                                active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                            )}>{s.label}</span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={cn(
                                "flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all duration-500",
                                step > s.id ? "bg-primary" : "bg-border"
                            )} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Drag & Drop Zone ──────────────────────────────────────────
function DropZone({
    onFiles, accept, multiple = false, children, className
}: {
    onFiles: (files: File[]) => void;
    accept: string;
    multiple?: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    const [dragging, setDragging] = useState(false);
    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(f =>
            accept.split(",").some(a => f.type.match(a.trim().replace("*", ".*")))
        );
        if (files.length) onFiles(multiple ? files : [files[0]]);
    }, [accept, multiple, onFiles]);

    return (
        <div
            className={cn("transition-all duration-200", dragging && "scale-[1.02]", className)}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
        >
            {children}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────
export default function UploadProduct() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const defaultTab = searchParams.get('tab') || 'product';
    const { user } = useAuthStore();
    const canPostNews = user?.role === "super_admin" || user?.role === "blogger";

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [priceDisplay, setPriceDisplay] = useState("");

    const {
        images, video, uploadProgress, setUploadProgress,
        imageInputRef, videoInputRef,
        handleImageSelect, handleVideoSelect,
        removeImage, removeVideo, setImages, setVideo,
    } = useProductUpload();

    const {
        watch, setValue, reset,
        handleSubmit: handleProductSubmit,
        formState: { errors },
    } = useForm<ProductFormInput>({
        resolver: async (values) => {
            const result = await productFormSchema.safeParseAsync(values);
            if (result.success) return { values: result.data, errors: {} };
            const formErrors: Record<string, { type: string; message: string }> = {};
            result.error.errors.forEach(err => {
                const field = err.path[0] as keyof ProductFormInput;
                if (field) formErrors[field] = { type: "validation", message: err.message };
            });
            return { values: {}, errors: formErrors };
        },
        defaultValues: { title: "", description: "", price: "", category: "", currency: "UZS" },
    });

    const formData = watch();

    // News / Story state
    const [newsTitle, setNewsTitle] = useState("");
    const [newsContent, setNewsContent] = useState("");
    const [newsMedia, setNewsMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' } | null>(null);
    const newsFileInputRef = useRef<HTMLInputElement>(null);
    const [isNewsSubmitting, setIsNewsSubmitting] = useState(false);

    const [storyCaption, setStoryCaption] = useState("");
    const [storyMedia, setStoryMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' } | null>(null);
    const storyFileInputRef = useRef<HTMLInputElement>(null);
    const [isStorySubmitting, setIsStorySubmitting] = useState(false);

    // Load for edit
    useEffect(() => {
        if (!editId) return;
        const load = async () => {
            setIsLoadingEdit(true);
            try {
                const p = await productService.getProductById(editId);
                if (p) {
                    reset({ title: p.title, description: p.description, price: p.price.toString(), category: p.category, currency: p.currency || "UZS" });
                    setPriceDisplay(formatUZS(p.price.toString()));
                    const imgs: MediaFile[] = (p.images || []).map((url: string) => ({ preview: url, type: 'image', existingUrl: url }));
                    setImages(imgs);
                    if (p.videoUrl) setVideo({ preview: p.videoUrl, type: 'video', existingUrl: p.videoUrl });
                }
            } catch { toast.error("Mahsulotni yuklashda xatolik"); }
            finally { setIsLoadingEdit(false); }
        };
        load();
    }, [editId, reset, setImages, setVideo]);

    // Step 1 → 2 validation
    const goStep2 = () => {
        if (images.length === 0) { toast.error("Kamida 1 ta rasm yuklang"); return; }
        if (!video) { toast.error("Reel video majburiy"); return; }
        setStep(2);
    };
    const goStep3 = async () => {
        if (!formData.title.trim()) { toast.error("Mahsulot nomini kiriting"); return; }
        if (!formData.price || Number(formData.price) <= 0) { toast.error("Narxni kiriting"); return; }
        if (!formData.category) { toast.error("Kategoriyani tanlang"); return; }
        if (!formData.description.trim()) { toast.error("Tavsif kiriting"); return; }
        setStep(3);
    };

    const handleSubmit = handleProductSubmit(async (values: ProductFormInput) => {
        if (!user?.id) { toast.error("Iltimos, tizimga kiring"); return; }
        try {
            setIsSubmitting(true);
            setUploadProgress(0);
            const mediaUploads = [
                ...images.filter(i => i.file).map(i => ({ file: i.file as File, type: 'image' as const })),
                ...(video?.file ? [{ file: video.file, type: 'video' as const }] : []),
            ];
            const payload = {
                title: values.title.trim(),
                description: values.description.trim(),
                price: Number(values.price),
                category: values.category,
                currency: values.currency,
                inStock: true,
            };
            if (editId) {
                await productService.updateProduct(editId, payload, mediaUploads.length ? mediaUploads : undefined, p => setUploadProgress(p));
                toast.success("Mahsulot yangilandi!");
            } else {
                await productService.createProduct({ ...payload, sellerId: user.id }, mediaUploads, p => setUploadProgress(p));
                toast.success("Mahsulot yuklandi!");
            }
            navigate("/profile");
        } catch (error) {
            const appError = handleError(error, 'UploadProduct');
            toast.error(appError.message);
        } finally { setIsSubmitting(false); }
    });

    const handleImagesFromDrop = useCallback((files: File[]) => {
        const ev = { target: { files: Object.assign(files, { item: (i: number) => files[i] }) } } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleImageSelect(ev);
    }, [handleImageSelect]);

    const handleVideoFromDrop = useCallback((files: File[]) => {
        const dtFiles = files as unknown as FileList;
        const ev = { target: { files: dtFiles } } as React.ChangeEvent<HTMLInputElement>;
        handleVideoSelect(ev);
    }, [handleVideoSelect]);

    const handleNewsFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('video/')) { toast.error("Video fayl yuklang"); return; }
        setNewsMedia({ file, preview: URL.createObjectURL(file), type: 'video' });
    };

    const handleNewsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsTitle.trim() || !newsContent.trim() || !newsMedia || newsMedia.type !== 'video') {
            toast.error("Sarlavha, tavsif va video majburiy"); return;
        }
        setIsNewsSubmitting(true); setUploadProgress(0);
        try {
            const mediaUrl = await productService.uploadMedia(newsMedia.file, 'product-media', p => setUploadProgress(p), true);
            await postService.createPost({ title: newsTitle, content: newsContent, mediaUrl, mediaType: newsMedia.type });
            toast.success("Yangilik joylandi!");
            setNewsTitle(""); setNewsContent(""); setNewsMedia(null);
            navigate("/");
        } catch (err) { toast.error(handleError(err, 'CreatePost').message); }
        finally { setIsNewsSubmitting(false); }
    };

    const handleStorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storyMedia) { toast.error("Rasm yoki video yuklang"); return; }
        setIsStorySubmitting(true); setUploadProgress(0);
        try {
            const mediaUrl = await productService.uploadMedia(storyMedia.file, 'product-media', p => setUploadProgress(p), true);
            await marketingService.createStory(mediaUrl, storyMedia.type, storyCaption);
            toast.success("Hikoya joylandi!");
            setStoryCaption(""); setStoryMedia(null); navigate("/");
        } catch { toast.error("Hikoya joylashda xatolik"); }
        finally { setIsStorySubmitting(false); }
    };

    if (isLoadingEdit) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
            </div>
        </div>
    );

    const selCategory = CATEGORIES.find(c => c.id === formData.category);

    return (
        <div className="relative w-full min-h-full flex flex-col bg-background overflow-hidden">
            {/* Ambient background */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/6 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
            </div>

            <div className="flex-1 w-full flex flex-col">
                <Tabs defaultValue={defaultTab} className="w-full flex-1 flex flex-col">
                    <div className="flex-1 w-full overflow-auto">
                        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-5xl mx-auto">

                            {/* ── Product Tab ── */}
                            <TabsContent value="product" className="mt-0 w-full">
                                {/* Header card */}
                                <div className="mb-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 flex items-center gap-3 shadow-sm">
                                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}
                                        className="h-9 w-9 rounded-xl shrink-0">
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                            {editId ? "Tahrirlash" : "Yangi mahsulot"}
                                        </p>
                                        <h1 className="text-lg font-bold truncate">
                                            {editId ? "Mahsulotni tahrirlash" : "Mahsulot joylash"}
                                        </h1>
                                    </div>
                                    {canPostNews && (
                                        <TabsList className="h-9 bg-muted/20 p-1 rounded-full border border-border/50">
                                            <TabsTrigger value="product" className="rounded-full text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Mahsulot</TabsTrigger>
                                            <TabsTrigger value="news" className="rounded-full text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Yangilik</TabsTrigger>
                                            <TabsTrigger value="story" className="rounded-full text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Hikoya</TabsTrigger>
                                        </TabsList>
                                    )}
                                </div>

                                {/* Step bar */}
                                <StepBar step={step} />

                                {/* ── STEP 1: Media ── */}
                                {step === 1 && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        {/* Images */}
                                        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <ImageIcon className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">Rasmlar <span className="text-destructive">*</span></p>
                                                    <p className="text-xs text-muted-foreground">Kamida 1 ta, maksimal 6 ta rasm</p>
                                                </div>
                                                <Badge variant="secondary" className="ml-auto text-xs">{images.length}/6</Badge>
                                            </div>

                                            <DropZone accept="image/*" multiple onFiles={handleImagesFromDrop}>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                                                    {images.map((img, i) => (
                                                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-border/40 bg-muted/20">
                                                            <img src={img.preview} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
                                                            <button type="button" onClick={() => removeImage(i)}
                                                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                            {i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[10px] text-center py-0.5 font-semibold">Asosiy</div>}
                                                        </div>
                                                    ))}
                                                    {images.length < 6 && (
                                                        <button type="button" onClick={() => imageInputRef.current?.click()}
                                                            className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1.5 hover:border-primary hover:bg-primary/5 transition-all duration-200 text-muted-foreground hover:text-primary group">
                                                            <ImageIcon className="w-6 h-6" />
                                                            <span className="text-[10px] font-medium">Rasm qo'sh</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </DropZone>
                                            <input ref={imageInputRef} type="file" className="hidden" multiple accept="image/*" onChange={handleImageSelect} />

                                            {images.length === 0 && (
                                                <DropZone accept="image/*" multiple onFiles={handleImagesFromDrop}
                                                    className="mt-3 rounded-xl border-2 border-dashed border-border/40 hover:border-primary/60 hover:bg-primary/3 transition-all cursor-pointer p-8 text-center"
                                                >
                                                    <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full">
                                                        <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                                                            <Upload className="w-6 h-6 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-foreground">Rasm yuklash yoki tashlang</p>
                                                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP — max 10MB</p>
                                                    </button>
                                                </DropZone>
                                            )}
                                        </div>

                                        {/* Video */}
                                        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                                    <Film className="w-4 h-4 text-rose-500" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">Reel Video <span className="text-destructive">*</span></p>
                                                    <p className="text-xs text-muted-foreground">MP4 format, max 50MB, qisqa video</p>
                                                </div>
                                            </div>

                                            {video ? (
                                                <div className="relative aspect-video rounded-xl overflow-hidden border border-border/40 bg-black group">
                                                    <video src={video.preview} className="w-full h-full object-cover" controls />
                                                    <button type="button" onClick={removeVideo}
                                                        className="absolute top-3 right-3 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <DropZone accept="video/*" onFiles={handleVideoFromDrop}>
                                                    <button type="button" onClick={() => videoInputRef.current?.click()}
                                                        className="w-full h-44 rounded-xl border-2 border-dashed border-border/40 hover:border-rose-500/60 hover:bg-rose-500/3 transition-all flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-rose-500 group">
                                                        <div className="w-14 h-14 rounded-2xl bg-muted/30 group-hover:bg-rose-500/10 flex items-center justify-center transition-colors">
                                                            <Film className="w-7 h-7" />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-sm font-semibold">Video yuklash yoki tashlang</p>
                                                            <p className="text-xs mt-0.5">MP4 — max 50MB</p>
                                                        </div>
                                                    </button>
                                                </DropZone>
                                            )}
                                            <input ref={videoInputRef} type="file" className="hidden" accept="video/*" onChange={handleVideoSelect} />
                                        </div>

                                        <Button onClick={goStep2} className="w-full h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
                                            Davom etish <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}

                                {/* ── STEP 2: Ma'lumot ── */}
                                {step === 2 && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        {/* Title */}
                                        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-sm space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                    <Tag className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <p className="font-semibold text-sm">Asosiy ma'lumotlar</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mahsulot nomi *</Label>
                                                <Input
                                                    placeholder="Masalan: iPhone 16 Pro Max 256GB"
                                                    value={formData.title}
                                                    onChange={e => setValue("title", e.target.value)}
                                                    className={cn("h-12 rounded-xl bg-muted/10 border-border/50 focus-visible:ring-primary/30", errors?.title && "border-destructive")}
                                                />
                                                {errors?.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                                            </div>

                                            {/* Price */}
                                            <div className="grid grid-cols-[1fr,auto] gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Narxi *</Label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="0"
                                                            value={priceDisplay}
                                                            onChange={e => {
                                                                const raw = e.target.value.replace(/\D/g, "");
                                                                setPriceDisplay(formatUZS(raw));
                                                                setValue("price", raw);
                                                            }}
                                                            className={cn("h-12 rounded-xl bg-muted/10 border-border/50 pl-9 font-mono focus-visible:ring-primary/30", errors?.price && "border-destructive")}
                                                        />
                                                    </div>
                                                    {errors?.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valyuta</Label>
                                                    <div className="flex gap-2 h-12">
                                                        {["UZS", "USD"].map(cur => (
                                                            <button key={cur} type="button" onClick={() => setValue("currency", cur)}
                                                                className={cn(
                                                                    "flex-1 rounded-xl text-sm font-bold border-2 transition-all",
                                                                    formData.currency === cur
                                                                        ? "bg-primary/10 border-primary text-primary"
                                                                        : "border-border/40 text-muted-foreground hover:border-border"
                                                                )}>
                                                                {cur}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Category */}
                                        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                                    <Package className="w-4 h-4 text-violet-500" />
                                                </div>
                                                <p className="font-semibold text-sm">Kategoriya *</p>
                                            </div>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                                                {CATEGORIES.map(cat => {
                                                    const active = formData.category === cat.id;
                                                    return (
                                                        <button key={cat.id} type="button" onClick={() => setValue("category", cat.id)}
                                                            className={cn(
                                                                "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-center",
                                                                active
                                                                    ? "border-primary bg-primary/8 shadow-lg shadow-primary/15"
                                                                    : "border-border/40 bg-muted/10 hover:border-border hover:bg-muted/20"
                                                            )}>
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white transition-all",
                                                                active ? cat.color : "from-muted to-muted text-muted-foreground bg-none"
                                                            )}>
                                                                <cat.Icon className="w-5 h-5" />
                                                            </div>
                                                            <span className={cn("text-[11px] font-semibold leading-tight", active ? "text-primary" : "text-muted-foreground")}>
                                                                {cat.label}
                                                            </span>
                                                            {active && <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-primary-foreground" /></div>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {errors?.category && <p className="text-xs text-destructive mt-2">{errors.category.message}</p>}
                                        </div>

                                        {/* Description */}
                                        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-sm space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                    <FileText className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <p className="font-semibold text-sm">Tavsif *</p>
                                            </div>
                                            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/20">
                                                <Info className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                                <p className="text-xs text-amber-600 dark:text-amber-400">Xotira, kamera, batareya va boshqa texnik xususiyatlarni kiriting.</p>
                                            </div>
                                            <Textarea
                                                placeholder="Mahsulot haqida batafsil yozing: RAM, xotira, kamera sifati, batareya muddati..."
                                                value={formData.description}
                                                onChange={e => setValue("description", e.target.value)}
                                                className={cn("min-h-[150px] resize-none rounded-xl bg-muted/10 border-border/50 focus-visible:ring-primary/30 text-sm", errors?.description && "border-destructive")}
                                            />
                                            <div className="flex justify-between">
                                                {errors?.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                                                <p className="text-xs text-muted-foreground ml-auto">{formData.description.length} belgi</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl border-2">
                                                <ArrowLeft className="w-4 h-4 mr-2" /> Orqaga
                                            </Button>
                                            <Button onClick={goStep3} className="flex-1 h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
                                                Ko'rib chiqish <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 3: Preview ── */}
                                {step === 3 && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm">
                                            <div className="p-4 border-b border-border/30 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-primary" />
                                                <p className="font-semibold text-sm">Mahsulot ko'rinishi</p>
                                                <Badge variant="secondary" className="ml-auto text-xs">Preview</Badge>
                                            </div>
                                            {/* Preview card */}
                                            <div className="p-4">
                                                <div className="rounded-xl overflow-hidden border border-border/30 bg-background max-w-sm mx-auto shadow-lg">
                                                    {images[0] && (
                                                        <div className="aspect-square bg-muted overflow-hidden">
                                                            <img src={images[0].preview} className="w-full h-full object-cover" alt="preview" />
                                                        </div>
                                                    )}
                                                    <div className="p-3 space-y-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-bold text-sm leading-tight line-clamp-2">{formData.title || "Mahsulot nomi"}</p>
                                                            {selCategory && (
                                                                <Badge variant="secondary" className="text-xs shrink-0">{selCategory.label}</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-primary font-bold text-base">
                                                            {priceDisplay || "0"} <span className="text-xs font-normal text-muted-foreground">{formData.currency}</span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground line-clamp-3">{formData.description || "Tavsif..."}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-sm space-y-3">
                                            <p className="font-semibold text-sm">Xulosa</p>
                                            <div className="space-y-2">
                                                {[
                                                    { label: "Rasmlar", value: `${images.length} ta`, ok: images.length > 0 },
                                                    { label: "Video", value: video ? "Yuklangan" : "Yo'q", ok: !!video },
                                                    { label: "Nom", value: formData.title || "—", ok: !!formData.title },
                                                    { label: "Narx", value: `${priceDisplay} ${formData.currency}`, ok: !!formData.price },
                                                    { label: "Kategoriya", value: selCategory?.label || "—", ok: !!formData.category },
                                                    { label: "Tavsif", value: `${formData.description.length} belgi`, ok: formData.description.length > 10 },
                                                ].map(row => (
                                                    <div key={row.label} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                                                        <span className="text-xs text-muted-foreground">{row.label}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium truncate max-w-[160px]">{row.value}</span>
                                                            <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", row.ok ? "bg-emerald-500/15" : "bg-destructive/15")}>
                                                                {row.ok ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <X className="w-2.5 h-2.5 text-destructive" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Upload progress */}
                                        {isSubmitting && (
                                            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold">Yuklanmoqda...</p>
                                                    <span className="text-sm font-bold text-primary">{uploadProgress}%</span>
                                                </div>
                                                <Progress value={uploadProgress} className="h-2" />
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <Button variant="outline" onClick={() => setStep(2)} disabled={isSubmitting} className="flex-1 h-12 rounded-xl border-2">
                                                <ArrowLeft className="w-4 h-4 mr-2" /> Orqaga
                                            </Button>
                                            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/25">
                                                {isSubmitting ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> {uploadProgress}%</>
                                                ) : editId ? (
                                                    <><Save className="w-4 h-4" /> Saqlash</>
                                                ) : (
                                                    <><Upload className="w-4 h-4" /> Joylash</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* ── News Tab ── */}
                            <TabsContent value="news" className="mt-0 w-full">
                                <div className="mb-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 flex items-center gap-3 shadow-sm">
                                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl shrink-0">
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <div className="flex-1">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Yangilik</p>
                                        <h1 className="text-lg font-bold">Post joylash</h1>
                                    </div>
                                    {canPostNews && (
                                        <TabsList className="h-9 bg-muted/20 p-1 rounded-full border border-border/50">
                                            <TabsTrigger value="product" className="rounded-full text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Mahsulot</TabsTrigger>
                                            <TabsTrigger value="news" className="rounded-full text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Yangilik</TabsTrigger>
                                            <TabsTrigger value="story" className="rounded-full text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Hikoya</TabsTrigger>
                                        </TabsList>
                                    )}
                                </div>

                                <form onSubmit={handleNewsSubmit} className="space-y-4">
                                    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-sm space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sarlavha *</Label>
                                            <Input placeholder="Sarlavha kiriting..." value={newsTitle} onChange={e => setNewsTitle(e.target.value)}
                                                className="h-12 rounded-xl bg-muted/10 border-border/50" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tavsif *</Label>
                                            <Textarea placeholder="Nima yangiliklar?" value={newsContent} onChange={e => setNewsContent(e.target.value)}
                                                className="min-h-[140px] resize-none rounded-xl bg-muted/10 border-border/50" />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-sm">
                                        {!newsMedia ? (
                                            <button type="button" onClick={() => { if (newsFileInputRef.current) { newsFileInputRef.current.accept = "video/*"; newsFileInputRef.current.click(); } }}
                                                className="w-full h-44 rounded-xl border-2 border-dashed border-border/40 hover:border-primary/60 hover:bg-primary/3 transition-all flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary group">
                                                <div className="w-14 h-14 rounded-2xl bg-muted/30 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                                    <Film className="w-7 h-7" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-semibold">Video yuklash <span className="text-destructive">*</span></p>
                                                    <p className="text-xs mt-0.5">MP4, max 50MB</p>
                                                </div>
                                            </button>
                                        ) : (
                                            <div className="relative rounded-xl overflow-hidden border border-border/40 aspect-video group">
                                                <video src={newsMedia.preview} className="w-full h-full object-cover" controls />
                                                <button type="button" onClick={() => setNewsMedia(null)}
                                                    className="absolute top-3 right-3 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        <input ref={newsFileInputRef} type="file" className="hidden" onChange={handleNewsFileSelect} />
                                    </div>

                                    {isNewsSubmitting && (
                                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold">Yuklanmoqda...</p>
                                                <span className="text-sm font-bold text-primary">{uploadProgress}%</span>
                                            </div>
                                            <Progress value={uploadProgress} className="h-2" />
                                        </div>
                                    )}

                                    <Button type="submit" disabled={isNewsSubmitting || !newsTitle.trim() || !newsContent.trim() || !newsMedia}
                                        className="w-full h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
                                        {isNewsSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploadProgress}%</> : <><Send className="w-4 h-4" /> Yangilikni ulashish</>}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* ── Story Tab ── */}
                            <TabsContent value="story" className="mt-0 w-full">
                                <div className="mb-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 flex items-center gap-3 shadow-sm">
                                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl shrink-0">
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <div className="flex-1">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Hikoya</p>
                                        <h1 className="text-lg font-bold">Hikoya joylash</h1>
                                    </div>
                                    <TabsList className="h-9 bg-muted/20 p-1 rounded-full border border-border/50">
                                        <TabsTrigger value="product" className="rounded-full text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Mahsulot</TabsTrigger>
                                        {canPostNews && <TabsTrigger value="news" className="rounded-full text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Yangilik</TabsTrigger>}
                                        <TabsTrigger value="story" className="rounded-full text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Hikoya</TabsTrigger>
                                    </TabsList>
                                </div>

                                <form onSubmit={handleStorySubmit} className="space-y-4">
                                    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-sm">
                                        {!storyMedia ? (
                                            <button type="button" onClick={() => storyFileInputRef.current?.click()}
                                                className="w-full h-64 rounded-xl border-2 border-dashed border-border/40 hover:border-primary/60 hover:bg-primary/3 transition-all flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary group">
                                                <div className="w-14 h-14 rounded-full bg-muted/30 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                                    <Upload className="w-7 h-7" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-semibold">Rasm yoki Video tanlang</p>
                                                    <p className="text-xs mt-0.5 text-muted-foreground">24 soat davomida ko'rinadi</p>
                                                </div>
                                            </button>
                                        ) : (
                                            <div className="relative rounded-xl overflow-hidden aspect-[9/16] max-w-xs mx-auto border border-border/40 group">
                                                {storyMedia.type === 'video'
                                                    ? <video src={storyMedia.preview} className="w-full h-full object-cover" controls />
                                                    : <img src={storyMedia.preview} className="w-full h-full object-cover" alt="" />}
                                                <button type="button" onClick={() => setStoryMedia(null)}
                                                    className="absolute top-3 right-3 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        <input ref={storyFileInputRef} type="file" className="hidden" accept="image/*,video/*"
                                            onChange={e => { const f = e.target.files?.[0]; if (f) setStoryMedia({ file: f, preview: URL.createObjectURL(f), type: f.type.startsWith('video/') ? 'video' : 'image' }); }} />
                                    </div>

                                    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-sm">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Izoh (ixtiyoriy)</Label>
                                        <Input placeholder="Hikoya haqida..." value={storyCaption} onChange={e => setStoryCaption(e.target.value)}
                                            className="h-12 rounded-xl bg-muted/10 border-border/50 mt-2" />
                                    </div>

                                    {isStorySubmitting && (
                                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold">Yuklanmoqda...</p>
                                                <span className="text-sm font-bold text-primary">{uploadProgress}%</span>
                                            </div>
                                            <Progress value={uploadProgress} className="h-2" />
                                        </div>
                                    )}

                                    <Button type="submit" disabled={isStorySubmitting || !storyMedia}
                                        className="w-full h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
                                        {isStorySubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploadProgress}%</> : <><Send className="w-4 h-4" /> Hikoyani joylash</>}
                                    </Button>
                                </form>
                            </TabsContent>

                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
