import { useState, useRef } from "react";
import { toast } from "sonner";
import { productService } from "@/services/api/products";
import { imageFileSchema, videoFileSchema } from "@/lib/validation";
import { sanitizeFilename } from "@/lib/sanitize";

interface MediaFile {
    file?: File;
    preview: string;
    type: 'image' | 'video';
    existingUrl?: string;
}

export const useProductUpload = () => {
    const [images, setImages] = useState<MediaFile[]>([]);
    const [video, setVideo] = useState<MediaFile | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB for images

        const newImages: MediaFile[] = files
            .filter(file => {
                if (file.size > MAX_SIZE) {
                    toast.error(`${file.name} juda katta. Maksimal hajm: 10MB`);
                    return false;
                }
                const validation = imageFileSchema.safeParse(file);
                if (!validation.success) {
                    toast.error(`${sanitizeFilename(file.name)}: ${validation.error.errors[0]?.message || 'Noto\'g\'ri fayl'}`);
                    return false;
                }
                return file.type.startsWith('image/');
            })
            .map(file => ({
                file,
                preview: URL.createObjectURL(file),
                type: 'image' as const,
            }));

        setImages(prev => [...prev, ...newImages]);
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE = 500 * 1024 * 1024; // 500MB for video
        if (file.size > MAX_SIZE) {
            toast.error("Video hajmi 500MB dan oshmasligi kerak");
            return;
        }

        const validation = videoFileSchema.safeParse(file);
        if (!validation.success) {
            toast.error(`${sanitizeFilename(file.name)}: ${validation.error.errors[0]?.message || 'Noto\'g\'ri fayl'}`);
            return;
        }

        if (!file.type.startsWith('video/')) {
            toast.error("Iltimos, video fayl yuklang");
            return;
        }

        setVideo({
            file,
            preview: URL.createObjectURL(file),
            type: 'video'
        });

        if (videoInputRef.current) videoInputRef.current.value = "";
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const updated = [...prev];
            if (updated[index].file) URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const removeVideo = () => {
        if (video?.file) URL.revokeObjectURL(video.preview);
        setVideo(null);
    };

    return {
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
    };
};
