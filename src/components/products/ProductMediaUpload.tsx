import { Plus, X, Film } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        <div className="w-full space-y-4 sm:space-y-5 md:space-y-6 flex flex-col">
            {/* Rasmlar - full width card */}
            <Card className="w-full border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 bg-card/95 dark:bg-card/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-5 md:px-6 pt-4 sm:pt-5">
                    <CardTitle className="text-sm sm:text-base md:text-lg font-bold">
                        Mahsulot rasmlari <span className="text-destructive">*</span>
                    </CardTitle>
                    <CardDescription className="text-[11px] sm:text-xs md:text-sm mt-0.5">
                        Yuqori sifatli rasmlar yuklang (kamida bitta)
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                        {images.map((img, index) => (
                            <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-border/50 hover:border-primary/40 transition-all duration-200 bg-muted/30">
                                <img src={img.preview} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" alt="preview" />
                                <button
                                    type="button"
                                    onClick={() => onRemoveImage(index)}
                                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 bg-black/70 hover:bg-black/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                                    aria-label="Rasmni olib tashlash"
                                >
                                    <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1.5 sm:gap-2 hover:border-primary hover:bg-primary/5 transition-all duration-200 text-muted-foreground hover:text-primary group bg-muted/20"
                            aria-label="Rasm yuklash"
                        >
                            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                            <span className="text-[10px] sm:text-xs font-medium">Rasm</span>
                        </button>
                    </div>
                    <input type="file" ref={imageInputRef} onChange={onImageSelect} className="hidden" multiple accept="image/*" aria-label="Rasm tanlash" />
                </CardContent>
            </Card>

            {/* Video - full width card */}
            <Card className="w-full border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 bg-card/95 dark:bg-card/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-5 md:px-6 pt-4 sm:pt-5">
                    <CardTitle className="text-sm sm:text-base md:text-lg font-bold">
                        Reel video <span className="text-destructive">*</span>
                    </CardTitle>
                    <CardDescription className="text-[11px] sm:text-xs md:text-sm mt-0.5">
                        Qisqa video (Reels uchun), MP4, max 50MB
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5">
                    {video ? (
                        <div className="relative aspect-[9/16] w-full max-w-[180px] sm:max-w-[200px] md:max-w-[240px] rounded-xl overflow-hidden border-2 border-border/50 bg-black shadow-lg group">
                            <video src={video.preview} className="h-full w-full object-cover" controls />
                            <button
                                type="button"
                                onClick={onRemoveVideo}
                                className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                                aria-label="Videoni olib tashlash"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="w-full h-32 sm:h-36 md:h-44 lg:h-48 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:border-primary hover:bg-primary/5 transition-all duration-200 text-muted-foreground hover:text-primary group bg-muted/20"
                            aria-label="Video yuklash"
                        >
                            <Film className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10" />
                            <span className="text-xs sm:text-sm font-semibold">Video yuklash</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">MP4, max 50MB</span>
                        </button>
                    )}
                    <input type="file" ref={videoInputRef} onChange={onVideoSelect} className="hidden" accept="video/*" aria-label="Video tanlash" />
                </CardContent>
            </Card>
        </div>
    );
}
