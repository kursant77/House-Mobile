import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageIcon, Film, X, Loader2, Send } from "lucide-react";
import { postService } from "@/services/api/posts";
import { productService } from "@/services/api/products";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function CreateHomePost() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [media, setMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const type = file.type.startsWith('video/') ? 'video' : 'image';
        setMedia({
            file,
            preview: URL.createObjectURL(file),
            type: type as any
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !media || media.type !== 'video') {
            toast.error("Iltimos, sarlavha, tavsif va video yuklang (Video majburiy)");
            return;
        }

        setIsSubmitting(true);
        try {
            let mediaUrl = "";
            if (media) {
                mediaUrl = await productService.uploadMedia(media.file);
            }

            await postService.createPost({
                title,
                content,
                mediaUrl,
                mediaType: media?.type,
            });

            toast.success("Post muvaffaqiyatli joylandi!");
            navigate("/");
        } catch (error: any) {
            toast.error("Xatolik: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto border-none shadow-none md:shadow-sm md:border">
            <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Yangilik yaratish
                </CardTitle>
                <CardDescription>
                    Obunachilaringiz uchun sarlavha, tavsif va media (video/rasm) ulashing
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold opacity-70">Sarlavha</label>
                        <Input
                            placeholder="Post sarlavhasini kiriting..."
                            className="bg-zinc-50 dark:bg-zinc-900/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-12 text-lg font-bold"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold opacity-70">Tavsif (Description)</label>
                        <Textarea
                            placeholder="Batafsil ma'lumot qoldiring..."
                            className="min-h-[150px] resize-none border-none bg-zinc-50 dark:bg-zinc-900/50 focus-visible:ring-0 text-base"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    {!media ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (fileInputRef.current) {
                                    fileInputRef.current.accept = "video/*";
                                    fileInputRef.current.click();
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
                            {media.type === 'image' ? (
                                <img src={media.preview} className="w-full h-full object-cover" alt="preview" />
                            ) : (
                                <video src={media.preview} className="w-full h-full object-cover" controls />
                            )}
                            <button
                                type="button"
                                onClick={() => setMedia(null)}
                                className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                            accept="video/*"
                        />

                        <Button
                            type="submit"
                            disabled={isSubmitting || !title.trim() || !content.trim() || !media || media.type !== 'video'}
                            className="w-full h-12 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Yangilikni ulashish
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
