import { Plus, X, Film } from "lucide-react";

interface MediaFile {
    file?: File;
    preview: string;
    type: 'image' | 'video';
    existingUrl?: string;
}

interface ProductMediaUploadProps {
    images: MediaFile[];
    video: MediaFile | null;
    imageInputRef: React.RefObject<HTMLInputElement>;
    videoInputRef: React.RefObject<HTMLInputElement>;
    onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onVideoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: (index: number) => void;
    onRemoveVideo: () => void;
}

export function ProductMediaUpload({
    images,
    video,
    imageInputRef,
    videoInputRef,
    onImageSelect,
    onVideoSelect,
    onRemoveImage,
    onRemoveVideo,
}: ProductMediaUploadProps) {
    return (
        <div className="w-full rounded-3xl border border-border/60 bg-card/80 dark:bg-card/70 shadow-2xl shadow-black/25 backdrop-blur-sm p-4 sm:p-6 md:p-7">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Media</span>
                <h3 className="text-lg sm:text-xl font-bold">Mahsulot fayllari</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                    Yuqori sifatli rasmlar va reels uchun video yuklang.
                </p>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group border border-border/50 hover:border-primary/50 transition-all duration-200 bg-muted/20">
                        <img src={img.preview} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" alt="preview" />
                        <button
                            type="button"
                            onClick={() => onRemoveImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                            aria-label="Rasmni olib tashlash"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="aspect-square rounded-2xl border border-dashed border-border/60 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all duration-200 text-muted-foreground hover:text-primary group bg-muted/10"
                    aria-label="Rasm yuklash"
                >
                    <Plus className="h-6 w-6" />
                    <span className="text-xs font-semibold">Rasm qo'shish</span>
                </button>
            </div>
            <input type="file" ref={imageInputRef} onChange={onImageSelect} className="hidden" multiple accept="image/*" aria-label="Rasm tanlash" />

            <div className="mt-6 pt-6 border-t border-border/40">
                <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold">Reel video <span className="text-destructive">*</span></p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">MP4, max 50MB, qisqa video</p>
                    </div>
                    <span className="hidden sm:inline-flex text-[10px] px-2 py-1 rounded-full border border-border/50 text-muted-foreground">
                        1 ta video
                    </span>
                </div>

                <div className="mt-4">
                    {video ? (
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border/50 bg-black shadow-xl group">
                            <video src={video.preview} className="h-full w-full object-cover" controls />
                            <button
                                type="button"
                                onClick={onRemoveVideo}
                                className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                                aria-label="Videoni olib tashlash"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="w-full h-40 sm:h-48 md:h-56 rounded-2xl border border-dashed border-border/60 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all duration-200 text-muted-foreground hover:text-primary group bg-muted/10"
                            aria-label="Video yuklash"
                        >
                            <Film className="h-10 w-10" />
                            <span className="text-sm font-semibold">Video yuklash</span>
                            <span className="text-xs text-muted-foreground">MP4, max 50MB</span>
                        </button>
                    )}
                    <input type="file" ref={videoInputRef} onChange={onVideoSelect} className="hidden" accept="video/*" aria-label="Video tanlash" />
                </div>
            </div>
        </div>
    );
}
