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
        <div className="space-y-6">
            <Card className="border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-bold">
                        Mahsulot Rasmlari <span className="text-destructive">*</span>
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base">
                        Mahsulotning yuqori sifatli rasmlarini yuklang
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4">
                        {images.map((img, index) => (
                            <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-border/50 hover:border-primary transition-all duration-200 shadow-md hover:shadow-lg">
                                <img src={img.preview} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" alt="preview" />
                                <button
                                    type="button"
                                    onClick={() => onRemoveImage(index)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/70 backdrop-blur-sm hover:bg-black/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                    aria-label="Rasmni olib tashlash"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent transition-all duration-300 text-muted-foreground hover:text-primary group"
                            aria-label="Rasm yuklash"
                        >
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <Plus className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <span className="text-[10px] md:text-xs font-medium">Rasm</span>
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={imageInputRef}
                        onChange={onImageSelect}
                        className="hidden"
                        multiple
                        accept="image/*"
                        aria-label="Rasm fayllarini tanlash"
                    />
                </CardContent>
            </Card>

            <Card className="border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-bold">
                        Reel Video <span className="text-destructive">*</span>
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base">
                        Qisqa video sharh (Reels uchun)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {video ? (
                        <div className="relative aspect-[9/16] w-full max-w-[200px] md:max-w-[250px] rounded-xl overflow-hidden border-2 border-border/50 bg-black shadow-lg hover:shadow-xl transition-all duration-300 group">
                            <video src={video.preview} className="h-full w-full object-cover" controls />
                            <button
                                type="button"
                                onClick={onRemoveVideo}
                                className="absolute top-3 right-3 p-2 bg-black/70 backdrop-blur-sm hover:bg-black/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                aria-label="Videoni olib tashlash"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="w-full h-40 md:h-48 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent transition-all duration-300 text-muted-foreground hover:text-primary group"
                            aria-label="Video yuklash"
                        >
                            <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <Film className="h-8 w-8 md:h-10 md:w-10" />
                            </div>
                            <div className="text-center space-y-1">
                                <span className="text-sm md:text-base font-semibold block">Video Yuklash</span>
                                <span className="text-xs md:text-sm text-muted-foreground">MP4, maksimal 50MB (katta fayllar uchun siqish tavsiya etiladi)</span>
                            </div>
                        </button>
                    )}
                    <input
                        type="file"
                        ref={videoInputRef}
                        onChange={onVideoSelect}
                        className="hidden"
                        accept="video/*"
                        aria-label="Video faylini tanlash"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
