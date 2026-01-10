import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageIcon, Film, X, Loader2, Send } from "lucide-react";
import { postService } from "@/services/api/posts";
import { productService } from "@/services/api/products";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function CreateHomePost() {
    const navigate = useNavigate();
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
        if (!content.trim() && !media) {
            toast.error("Iltimos, kontent yoki fayl kiriting");
            return;
        }

        setIsSubmitting(true);
        try {
            let mediaUrl = "";
            if (media) {
                mediaUrl = await productService.uploadMedia(media.file);
            }

            await postService.createPost({
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
                    Asosiy sahifaga post joylash
                </CardTitle>
                <CardDescription>
                    Obunachilaringiz uchun yangilik yoki qiziqarli ma'lumot ulashing
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        placeholder="Nima yangiliklar?"
                        className="min-h-[120px] resize-none border-none bg-zinc-50 dark:bg-zinc-900/50 focus-visible:ring-0 text-lg"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    {media && (
                        <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 aspect-video">
                            {media.type === 'image' ? (
                                <img src={media.preview} className="w-full h-full object-cover" alt="preview" />
                            ) : (
                                <video src={media.preview} className="w-full h-full object-cover" controls />
                            )}
                            <button
                                type="button"
                                onClick={() => setMedia(null)}
                                className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-10 px-4 rounded-full gap-2 text-zinc-600 dark:text-zinc-400"
                                onClick={() => {
                                    if (fileInputRef.current) {
                                        fileInputRef.current.accept = "image/*";
                                        fileInputRef.current.click();
                                    }
                                }}
                            >
                                <ImageIcon className="h-5 w-5 text-blue-500" />
                                <span className="hidden sm:inline">Rasm</span>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-10 px-4 rounded-full gap-2 text-zinc-600 dark:text-zinc-400"
                                onClick={() => {
                                    if (fileInputRef.current) {
                                        fileInputRef.current.accept = "video/*";
                                        fileInputRef.current.click();
                                    }
                                }}
                            >
                                <Film className="h-5 w-5 text-purple-500" />
                                <span className="hidden sm:inline">Video</span>
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting || (!content.trim() && !media)}
                            className="h-10 px-8 rounded-full font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Ulashish"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
