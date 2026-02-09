import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera, X, Image as ImageIcon, Check, Loader2, ArrowLeft,
    Type, Paintbrush, Sparkles, Undo2, RotateCcw
} from "lucide-react";
import { productService } from "@/services/api/products";
import { marketingService } from "@/services/api/marketing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StoryCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Professional Instagram-style Filters
const FILTERS = [
    { name: 'Original', class: '', icon: '○' },
    { name: 'Clarendon', class: 'contrast-125 saturate-125', icon: '◐' },
    { name: 'Gingham', class: 'brightness-105 hue-rotate-[-10deg] saturate-75', icon: '◑' },
    { name: 'Moon', class: 'grayscale contrast-110 brightness-110', icon: '◒' },
    { name: 'Lark', class: 'contrast-90 brightness-110 saturate-110', icon: '◓' },
    { name: 'Reyes', class: 'brightness-110 contrast-85 saturate-75 sepia-[0.2]', icon: '◔' },
    { name: 'Juno', class: 'contrast-115 saturate-150 brightness-105', icon: '◕' },
    { name: 'Slumber', class: 'brightness-105 saturate-75 contrast-105 sepia-[0.1]', icon: '●' },
];

// Font options for text
const FONTS = [
    { name: 'Classic', family: 'Inter, sans-serif', weight: '700' },
    { name: 'Modern', family: 'SF Pro Display, sans-serif', weight: '800' },
    { name: 'Neon', family: 'Courier New, monospace', weight: '700' },
    { name: 'Typewriter', family: 'Courier, monospace', weight: '600' },
    { name: 'Strong', family: 'Impact, sans-serif', weight: '900' },
];

// Text background styles
const TEXT_STYLES = [
    { name: 'Classic', bg: 'transparent', textShadow: '0 2px 8px rgba(0,0,0,0.8)' },
    { name: 'Solid', bg: 'rgba(0,0,0,0.8)', textShadow: 'none' },
    { name: 'Highlight', bg: 'rgba(255,255,255,0.9)', textShadow: 'none', textColor: '#000' },
    { name: 'Gradient', bg: 'linear-gradient(135deg, rgba(131,58,180,0.9), rgba(253,29,29,0.9))', textShadow: 'none' },
];

// Colors palette - Instagram style
const COLORS = [
    '#ffffff', '#000000', '#ff3b30', '#ff9500', '#ffcc00',
    '#34c759', '#007aff', '#5856d6', '#af52de', '#ff2d55',
    '#a2845e', '#8e8e93'
];

// Brush types
const BRUSHES = [
    { name: 'Pen', width: 4, opacity: 1 },
    { name: 'Marker', width: 12, opacity: 0.7 },
    { name: 'Neon', width: 6, opacity: 1, glow: true },
    { name: 'Eraser', width: 20, opacity: 1, eraser: true },
];

interface TextLayer {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    font: typeof FONTS[0];
    style: typeof TEXT_STYLES[0];
    scale: number;
    rotation: number;
}

interface DrawLine {
    points: { x: number; y: number }[];
    color: string;
    width: number;
    opacity: number;
    glow?: boolean;
}

export default function StoryCreator({ isOpen, onClose, onSuccess }: StoryCreatorProps) {
    const [step, setStep] = useState<'capture' | 'preview'>('capture');
    const [media, setMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Filter state
    const [activeFilterIndex, setActiveFilterIndex] = useState(0);
    const [showFilterName, setShowFilterName] = useState(false);

    // Text state
    const [texts, setTexts] = useState<TextLayer[]>([]);
    const [isAddingText, setIsAddingText] = useState(false);
    const [currentText, setCurrentText] = useState("");
    const [activeColor, setActiveColor] = useState("#ffffff");
    const [activeFontIndex, setActiveFontIndex] = useState(0);
    const [activeTextStyleIndex, setActiveTextStyleIndex] = useState(0);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);

    // Drawing state
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [lines, setLines] = useState<DrawLine[]>([]);
    const [currentLine, setCurrentLine] = useState<DrawLine | null>(null);
    const [activeBrushIndex, setActiveBrushIndex] = useState(0);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);

    // Initialize Camera
    useEffect(() => {
        if (isOpen && step === 'capture') {
            const startCamera = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user', aspectRatio: 9 / 16 },
                        audio: false
                    });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    streamRef.current = stream;
                    setHasCameraAccess(true);
                } catch (err) {
                    console.error("Camera access denied:", err);
                    setHasCameraAccess(false);
                }
            };
            startCamera();
        }

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen, step]);

    // Redraw canvas
    useEffect(() => {
        redrawCanvas();
    }, [lines, currentLine]);

    useEffect(() => {
        if (isDrawingMode && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            redrawCanvas();
        }
    }, [isDrawingMode]);

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const drawLine = (line: DrawLine) => {
            if (line.points.length < 2) return;
            ctx.beginPath();
            ctx.globalAlpha = line.opacity;
            ctx.strokeStyle = line.color;
            ctx.lineWidth = line.width;

            if (line.glow) {
                ctx.shadowColor = line.color;
                ctx.shadowBlur = 20;
            } else {
                ctx.shadowBlur = 0;
            }

            ctx.moveTo(line.points[0].x, line.points[0].y);
            for (let i = 1; i < line.points.length; i++) {
                ctx.lineTo(line.points[i].x, line.points[i].y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        lines.forEach(drawLine);
        if (currentLine) drawLine(currentLine);
    };

    const handleCapture = useCallback(() => {
        if (videoRef.current && hasCameraAccess) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(-1, 1);
                ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                        setMedia({
                            file,
                            preview: URL.createObjectURL(blob),
                            type: 'image'
                        });
                        setStep('preview');
                    }
                }, 'image/jpeg', 0.92);
            }
        } else {
            fileInputRef.current?.click();
        }
    }, [hasCameraAccess]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const type = file.type.startsWith('video/') ? 'video' : 'image';
        setMedia({
            file,
            preview: URL.createObjectURL(file),
            type: type as 'image' | 'video'
        });
        setStep('preview');
    };

    // Canvas Flattening - Merge all layers into final media
    const flattenToCanvas = async (): Promise<Blob | null> => {
        if (!media || !previewRef.current) return null;

        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return null;

        // Set high resolution
        exportCanvas.width = 1080;
        exportCanvas.height = 1920;

        // Draw base media
        return new Promise((resolve) => {
            if (media.type === 'image') {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    // Apply filter by drawing with CSS filter simulation
                    ctx.filter = getCanvasFilter(FILTERS[activeFilterIndex].class);
                    ctx.drawImage(img, 0, 0, exportCanvas.width, exportCanvas.height);
                    ctx.filter = 'none';

                    // Draw lines from drawing canvas
                    drawLinesToCanvas(ctx, exportCanvas.width, exportCanvas.height);

                    // Draw text layers
                    texts.forEach(text => {
                        drawTextToCanvas(ctx, text, exportCanvas.width, exportCanvas.height);
                    });

                    exportCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
                };
                img.src = media.preview;
            } else {
                // For video, just return the original file for now
                resolve(null);
            }
        });
    };

    const getCanvasFilter = (cssClass: string): string => {
        // Convert CSS class to canvas filter
        const filterMap: Record<string, string> = {
            'contrast-125 saturate-125': 'contrast(1.25) saturate(1.25)',
            'brightness-105 hue-rotate-[-10deg] saturate-75': 'brightness(1.05) hue-rotate(-10deg) saturate(0.75)',
            'grayscale contrast-110 brightness-110': 'grayscale(1) contrast(1.1) brightness(1.1)',
            'contrast-90 brightness-110 saturate-110': 'contrast(0.9) brightness(1.1) saturate(1.1)',
            'brightness-110 contrast-85 saturate-75 sepia-[0.2]': 'brightness(1.1) contrast(0.85) saturate(0.75) sepia(0.2)',
            'contrast-115 saturate-150 brightness-105': 'contrast(1.15) saturate(1.5) brightness(1.05)',
            'brightness-105 saturate-75 contrast-105 sepia-[0.1]': 'brightness(1.05) saturate(0.75) contrast(1.05) sepia(0.1)',
        };
        return filterMap[cssClass] || 'none';
    };

    const drawLinesToCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const scaleX = width / canvas.offsetWidth;
        const scaleY = height / canvas.offsetHeight;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        lines.forEach(line => {
            if (line.points.length < 2) return;
            ctx.beginPath();
            ctx.globalAlpha = line.opacity;
            ctx.strokeStyle = line.color;
            ctx.lineWidth = line.width * Math.min(scaleX, scaleY);

            if (line.glow) {
                ctx.shadowColor = line.color;
                ctx.shadowBlur = 30;
            } else {
                ctx.shadowBlur = 0;
            }

            ctx.moveTo(line.points[0].x * scaleX, line.points[0].y * scaleY);
            for (let i = 1; i < line.points.length; i++) {
                ctx.lineTo(line.points[i].x * scaleX, line.points[i].y * scaleY);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        });
    };

    const drawTextToCanvas = (ctx: CanvasRenderingContext2D, text: TextLayer, width: number, height: number) => {
        const preview = previewRef.current;
        if (!preview) return;

        const scaleX = width / preview.offsetWidth;
        const scaleY = height / preview.offsetHeight;
        const x = (text.x / 100) * width;
        const y = (text.y / 100) * height;
        const fontSize = 48 * text.scale * Math.min(scaleX, scaleY);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((text.rotation * Math.PI) / 180);

        ctx.font = `${text.font.weight} ${fontSize}px ${text.font.family}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw background if needed
        if (text.style.bg !== 'transparent') {
            const metrics = ctx.measureText(text.text);
            const padding = fontSize * 0.3;
            ctx.fillStyle = text.style.bg;
            ctx.fillRect(
                -metrics.width / 2 - padding,
                -fontSize / 2 - padding / 2,
                metrics.width + padding * 2,
                fontSize + padding
            );
        }

        // Draw text
        ctx.fillStyle = text.style.textColor || text.color;
        if (text.style.textShadow !== 'none') {
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 3;
        }
        ctx.fillText(text.text, 0, 0);

        ctx.restore();
    };

    const handleUpload = async () => {
        if (!media) return;

        setIsSubmitting(true);
        setUploadProgress(0);

        try {
            let finalFile = media.file;

            // Flatten for images with overlays
            if (media.type === 'image' && (texts.length > 0 || lines.length > 0 || activeFilterIndex > 0)) {
                const flattenedBlob = await flattenToCanvas();
                if (flattenedBlob) {
                    finalFile = new File([flattenedBlob], "story.jpg", { type: "image/jpeg" });
                }
            }

            const mediaUrl = await productService.uploadMedia(
                finalFile,
                'product-media',
                (progress) => setUploadProgress(progress),
                true
            );

            await marketingService.createStory(mediaUrl, media.type);
            toast.success("Hikoyangiz muvaffaqiyatli joylandi!");
            onSuccess();
            handleReset();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Hikoya yuklashda xatolik yuz berdi");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setMedia(null);
        setStep('capture');
        setActiveFilterIndex(0);
        setTexts([]);
        setLines([]);
        setCurrentLine(null);
    };

    // Filter swipe handler
    const handleSwipe = (direction: 'left' | 'right') => {
        if (direction === 'left') {
            setActiveFilterIndex(prev => (prev + 1) % FILTERS.length);
        } else {
            setActiveFilterIndex(prev => (prev - 1 + FILTERS.length) % FILTERS.length);
        }
        setShowFilterName(true);
        setTimeout(() => setShowFilterName(false), 1500);
    };

    // Text handling
    const addText = () => {
        setIsAddingText(true);
        setCurrentText("");
        setActiveColor("#ffffff");
        setActiveFontIndex(0);
        setActiveTextStyleIndex(0);
    };

    const handleTextComplete = () => {
        if (currentText.trim()) {
            const newText: TextLayer = {
                id: Date.now().toString(),
                text: currentText,
                x: 50,
                y: 50,
                color: activeColor,
                font: FONTS[activeFontIndex],
                style: TEXT_STYLES[activeTextStyleIndex],
                scale: 1,
                rotation: 0
            };
            setTexts([...texts, newText]);
        }
        setIsAddingText(false);
        setEditingTextId(null);
    };

    // Drawing handlers
    const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawingMode) return;
        const point = getPoint(e);
        const brush = BRUSHES[activeBrushIndex];
        setCurrentLine({
            points: [point],
            color: brush.eraser ? '#000000' : activeColor,
            width: brush.width,
            opacity: brush.opacity,
            glow: brush.glow
        });
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawingMode || !currentLine) return;
        const point = getPoint(e);
        setCurrentLine(prev => prev ? { ...prev, points: [...prev.points, point] } : null);
    };

    const endDrawing = () => {
        if (currentLine) {
            setLines([...lines, currentLine]);
            setCurrentLine(null);
        }
    };

    const undoDrawing = () => {
        setLines(lines.slice(0, -1));
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden"
            >
                {step === 'capture' ? (
                    <div className="relative flex-1 flex flex-col items-center bg-black">
                        {/* Camera Preview */}
                        <div className="absolute inset-0 md:m-4 md:rounded-3xl overflow-hidden bg-zinc-900">
                            {hasCameraAccess ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-4">
                                    <Camera className="w-20 h-20 opacity-40" />
                                    <p className="text-sm">Kamera ishlamayapti yoki ruxsat yo'q</p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-4 px-6 py-3 bg-white/10 rounded-full text-white font-medium"
                                    >
                                        Galereyadan tanlang
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Top Controls */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
                            <button onClick={onClose} className="p-3 backdrop-blur-md bg-black/30 rounded-full text-white">
                                <X className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-3">
                                <button className="p-3 backdrop-blur-md bg-black/30 rounded-full text-white">
                                    <Sparkles className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Bottom Controls */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-end z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-24">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-12 h-12 rounded-xl border-2 border-white/40 overflow-hidden flex items-center justify-center bg-zinc-800/80 backdrop-blur-sm"
                            >
                                <ImageIcon className="w-6 h-6 text-white" />
                            </button>

                            <button
                                onClick={handleCapture}
                                className="w-20 h-20 rounded-full border-[5px] border-white/60 p-1 active:scale-95 transition-transform"
                            >
                                <div className="w-full h-full rounded-full bg-white" />
                            </button>

                            <div className="w-12 h-12" />
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                            accept="image/*,video/*"
                        />
                    </div>
                ) : (
                    <div ref={previewRef} className="relative flex-1 bg-black overflow-hidden select-none">
                        {/* Main Toolbar - Not in text/drawing mode */}
                        {!isAddingText && !isDrawingMode && (
                            <div className="absolute top-0 left-0 right-0 z-50 p-5 flex justify-between items-center">
                                <button
                                    onClick={() => { handleReset(); }}
                                    className="p-2.5 bg-black/30 backdrop-blur-md rounded-full text-white"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={addText}
                                        className="p-3 bg-black/30 backdrop-blur-md rounded-full text-white"
                                    >
                                        <Type className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsDrawingMode(true)}
                                        className="p-3 bg-black/30 backdrop-blur-md rounded-full text-white"
                                    >
                                        <Paintbrush className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Drawing Mode Toolbar */}
                        {isDrawingMode && (
                            <div className="absolute inset-0 z-[60] pointer-events-none flex flex-col justify-between p-5">
                                <div className="flex justify-between items-start pointer-events-auto">
                                    <button
                                        onClick={() => setIsDrawingMode(false)}
                                        className="px-5 py-2.5 bg-white text-black rounded-full font-semibold text-sm"
                                    >
                                        Tugatish
                                    </button>
                                    <button
                                        onClick={undoDrawing}
                                        disabled={lines.length === 0}
                                        className="p-3 bg-black/30 backdrop-blur-md rounded-full text-white disabled:opacity-40"
                                    >
                                        <Undo2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="pointer-events-auto space-y-4">
                                    {/* Brush selector */}
                                    <div className="flex justify-center gap-3">
                                        {BRUSHES.map((brush, i) => (
                                            <button
                                                key={brush.name}
                                                onClick={() => setActiveBrushIndex(i)}
                                                className={cn(
                                                    "px-4 py-2 rounded-full text-xs font-medium transition-all",
                                                    activeBrushIndex === i
                                                        ? "bg-white text-black"
                                                        : "bg-black/40 backdrop-blur-md text-white"
                                                )}
                                            >
                                                {brush.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Color palette */}
                                    <div className="flex justify-center gap-2 p-3 bg-black/30 backdrop-blur-md rounded-full mx-auto">
                                        {COLORS.slice(0, 8).map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setActiveColor(color)}
                                                className={cn(
                                                    "w-7 h-7 rounded-full border-2 transition-transform",
                                                    activeColor === color ? "border-white scale-110" : "border-transparent"
                                                )}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Text Input Overlay */}
                        {isAddingText && (
                            <div className="absolute inset-0 z-[60] bg-black/70 backdrop-blur-sm flex flex-col">
                                <div className="flex justify-between items-center p-5">
                                    <button
                                        onClick={() => setIsAddingText(false)}
                                        className="text-white/70 font-medium"
                                    >
                                        Bekor
                                    </button>
                                    <button
                                        onClick={handleTextComplete}
                                        className="text-white font-bold"
                                    >
                                        Tayyor
                                    </button>
                                </div>

                                <div className="flex-1 flex items-center justify-center px-8">
                                    <input
                                        autoFocus
                                        value={currentText}
                                        onChange={(e) => setCurrentText(e.target.value)}
                                        className="bg-transparent text-center text-3xl font-bold outline-none border-none w-full"
                                        style={{
                                            color: TEXT_STYLES[activeTextStyleIndex].textColor || activeColor,
                                            fontFamily: FONTS[activeFontIndex].family,
                                            fontWeight: FONTS[activeFontIndex].weight,
                                            textShadow: TEXT_STYLES[activeTextStyleIndex].textShadow
                                        }}
                                        placeholder="Yozing..."
                                    />
                                </div>

                                {/* Text Style Options */}
                                <div className="p-5 space-y-4">
                                    {/* Font selector */}
                                    <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar">
                                        {FONTS.map((font, i) => (
                                            <button
                                                key={font.name}
                                                onClick={() => setActiveFontIndex(i)}
                                                className={cn(
                                                    "px-4 py-2 rounded-full text-xs transition-all whitespace-nowrap",
                                                    activeFontIndex === i
                                                        ? "bg-white text-black"
                                                        : "bg-white/10 text-white"
                                                )}
                                                style={{ fontFamily: font.family }}
                                            >
                                                {font.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Text style selector */}
                                    <div className="flex justify-center gap-3">
                                        {TEXT_STYLES.map((style, i) => (
                                            <button
                                                key={style.name}
                                                onClick={() => setActiveTextStyleIndex(i)}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-xs font-medium transition-all",
                                                    activeTextStyleIndex === i
                                                        ? "ring-2 ring-white"
                                                        : "opacity-60"
                                                )}
                                                style={{
                                                    background: style.bg === 'transparent' ? 'rgba(255,255,255,0.1)' : style.bg,
                                                    color: style.textColor || '#fff'
                                                }}
                                            >
                                                {style.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Color palette */}
                                    <div className="flex justify-center gap-2">
                                        {COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setActiveColor(color)}
                                                className={cn(
                                                    "w-8 h-8 rounded-full border-2 transition-transform",
                                                    activeColor === color ? "border-white scale-110" : "border-transparent"
                                                )}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Media Preview with Filters */}
                        <motion.div
                            className="w-full h-full relative touch-none"
                            drag={!isDrawingMode && !isAddingText ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.15}
                            onDragEnd={(_, info) => {
                                if (Math.abs(info.offset.x) > 40) {
                                    handleSwipe(info.offset.x < 0 ? 'left' : 'right');
                                }
                            }}
                        >
                            {media?.type === 'video' ? (
                                <video
                                    src={media.preview}
                                    className={cn("w-full h-full object-cover", FILTERS[activeFilterIndex].class)}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={media?.preview}
                                    className={cn("w-full h-full object-cover", FILTERS[activeFilterIndex].class)}
                                    alt="Preview"
                                />
                            )}

                            {/* Drawing Canvas */}
                            <canvas
                                ref={canvasRef}
                                className={cn(
                                    "absolute inset-0 w-full h-full z-20",
                                    isDrawingMode ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"
                                )}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={endDrawing}
                                onMouseLeave={endDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={endDrawing}
                            />

                            {/* Text Layers */}
                            {texts.map(t => (
                                <motion.div
                                    key={t.id}
                                    drag={!isDrawingMode}
                                    dragMomentum={false}
                                    className="absolute text-3xl font-bold whitespace-pre-wrap text-center cursor-move z-30 select-none"
                                    style={{
                                        left: `${t.x}%`,
                                        top: `${t.y}%`,
                                        color: t.style.textColor || t.color,
                                        fontFamily: t.font.family,
                                        fontWeight: t.font.weight,
                                        transform: `translate(-50%, -50%) scale(${t.scale}) rotate(${t.rotation}deg)`,
                                        textShadow: t.style.textShadow,
                                        background: t.style.bg,
                                        padding: t.style.bg !== 'transparent' ? '8px 16px' : '0',
                                        borderRadius: t.style.bg !== 'transparent' ? '8px' : '0',
                                    }}
                                    onDragEnd={(_, info) => {
                                        const preview = previewRef.current;
                                        if (!preview) return;
                                        const rect = preview.getBoundingClientRect();
                                        const newX = ((info.point.x - rect.left) / rect.width) * 100;
                                        const newY = ((info.point.y - rect.top) / rect.height) * 100;
                                        setTexts(prev => prev.map(text =>
                                            text.id === t.id ? { ...text, x: newX, y: newY } : text
                                        ));
                                    }}
                                >
                                    {t.text}
                                </motion.div>
                            ))}

                            {/* Filter Name Overlay */}
                            <AnimatePresence>
                                {showFilterName && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
                                    >
                                        <div className="bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl">
                                            <h2 className="text-white text-2xl font-bold tracking-wide">
                                                {FILTERS[activeFilterIndex].name}
                                            </h2>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Filter Selector - Bottom */}
                        {!isAddingText && !isDrawingMode && (
                            <div className="absolute bottom-24 left-0 right-0 z-40">
                                <div className="flex justify-center gap-3 px-4 overflow-x-auto no-scrollbar py-2">
                                    {FILTERS.map((filter, i) => (
                                        <button
                                            key={filter.name}
                                            onClick={() => {
                                                setActiveFilterIndex(i);
                                                setShowFilterName(true);
                                                setTimeout(() => setShowFilterName(false), 1000);
                                            }}
                                            className={cn(
                                                "flex flex-col items-center gap-1.5 transition-all shrink-0",
                                                activeFilterIndex === i ? "scale-110" : "opacity-70"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-14 h-14 rounded-full overflow-hidden border-2 transition-all",
                                                activeFilterIndex === i ? "border-white" : "border-transparent"
                                            )}>
                                                <img
                                                    src={media?.preview}
                                                    className={cn("w-full h-full object-cover", filter.class)}
                                                    alt={filter.name}
                                                />
                                            </div>
                                            <span className="text-white text-[10px] font-medium">
                                                {filter.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Share Button */}
                        {!isAddingText && !isDrawingMode && (
                            <div className="absolute bottom-0 left-0 right-0 z-50 p-5 bg-gradient-to-t from-black/80 to-transparent flex justify-end">
                                <button
                                    onClick={handleUpload}
                                    disabled={isSubmitting}
                                    className={cn(
                                        "flex items-center gap-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-7 py-3.5 rounded-full font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-95 disabled:opacity-60",
                                        isSubmitting && "pr-8"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>{uploadProgress}%</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Joylash</span>
                                            <Check className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
