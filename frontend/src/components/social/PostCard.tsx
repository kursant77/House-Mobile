import { useState, useRef, useEffect } from "react";
import { PublicPost } from "@/services/api/posts";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";

interface PostCardProps {
    post: PublicPost;
}

const VideoPreview = ({ src }: { src: string }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isHovered) {
            timeoutRef.current = setTimeout(() => {
                setIsPlaying(true);
            }, 800);
        } else {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setIsPlaying(false);
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isHovered]);

    useEffect(() => {
        if (isPlaying && videoRef.current) {
            videoRef.current.play().catch(() => {
                // Silently ignore autoplay errors (browser policy)
            });
        }
    }, [isPlaying]);

    return (
        <div
            className="w-full h-full relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <video
                ref={videoRef}
                src={`${src}${src.includes('?') ? '&' : '?'}preview=1#t=0.1`}
                className="w-full h-full object-cover"
                muted
                playsInline
                loop
                preload="metadata"
                crossOrigin="anonymous"
            />
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity opacity-0 group-hover:opacity-100">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Play className="h-6 w-6 text-white fill-white ml-1" />
                    </div>
                </div>
            )}
        </div>
    );
};

export const PostCard = ({ post }: PostCardProps) => {
    return (
        <Card className="overflow-hidden border-none bg-transparent shadow-none hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-colors p-2 rounded-2xl group">
            <CardContent className="p-0 flex flex-col gap-3">
                {/* Media Content on Top */}
                <Link
                    to={`/post/${post.id}`}
                    className="block"
                    aria-label={`${post.title || 'Post'} ni ko'rish`}
                >
                    <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-950 overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
                        {post.mediaUrl ? (
                            post.mediaType === 'video' ? (
                                <VideoPreview src={post.mediaUrl} />
                            ) : (
                                <img
                                    src={post.mediaUrl}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    alt={post.title || post.content || "Post media"}
                                    loading="lazy"
                                    decoding="async"
                                />
                            )
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800">
                                <span className="text-xs text-muted-foreground font-medium px-6 text-center line-clamp-3">
                                    {post.content}
                                </span>
                            </div>
                        )}
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white uppercase tracking-wider shadow-lg">
                            Yangilik
                        </div>
                    </div>
                </Link>

                {/* Info Section Below */}
                <div className="flex gap-3 px-1">
                    {/* Author Avatar */}
                    <Link to={`/profile/${post.author?.id}`}>
                        <Avatar size="md">
                            <AvatarImage src={post.author?.avatarUrl} />
                            <AvatarFallback>
                                {post.author?.fullName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    </Link>

                    {/* Metadata */}
                    <div className="flex flex-col flex-1 min-w-0">
                        <Link to={`/post/${post.id}`}>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug line-clamp-2 mb-1 transition-colors group-hover:text-primary">
                                {post.title || post.content?.split('\n')[0] || "Yangi post"}
                            </h3>
                        </Link>

                        <div className="flex flex-col">
                            <div className="flex items-center flex-nowrap gap-1">
                                <span className="text-xs text-zinc-500 font-medium hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors truncate">
                                    {post.author?.fullName}
                                </span>
                                {(post.author?.role === 'super_admin' || post.author?.role === 'blogger' || post.author?.role === 'seller') && (
                                    <VerifiedBadge size={12} className="shrink-0" />
                                )}
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                                <span>{post.views || 0} views</span>
                                <span className="w-0.5 h-0.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

PostCard.displayName = "PostCard";
