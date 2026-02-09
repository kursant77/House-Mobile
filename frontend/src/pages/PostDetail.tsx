import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Play, Share2, Loader2, ThumbsUp, ThumbsDown, Bookmark, Download, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { postService, PublicPost } from "@/services/api/posts";
import { socialService } from "@/services/api/social";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PostComments } from "@/components/posts/PostComments";
import { historyService } from "@/services/api/history";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Helmet } from "react-helmet-async";

const RecommendedPosts = ({ otherPosts }: { otherPosts: PublicPost[] }) => (
    <div className="grid grid-cols-1 gap-4">
        {otherPosts.map((p) => (
            <Link
                key={p.id}
                to={`/post/${p.id}`}
                className="flex flex-col md:flex-row gap-3 group cursor-pointer"
                role="article"
                aria-label={`${p.content || 'Post'} ni ko'rish`}
            >
                {/* Thumbnail - Full width on mobile, fixed width on desktop */}
                <div className="relative aspect-video w-full md:w-[168px] md:shrink-0 bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden ring-1 ring-border/50">
                    {p.mediaUrl ? (
                        p.mediaType === 'video' ? (
                            <video
                                src={p.mediaUrl}
                                className="w-full h-full object-cover"
                                preload="metadata"
                                aria-hidden="true"
                            />
                        ) : (
                            <img
                                src={p.mediaUrl}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                alt={p.content || "Post media"}
                                loading="lazy"
                                decoding="async"
                            />
                        )
                    ) : (
                        <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
                            <Play className="h-6 w-6 text-zinc-300" />
                        </div>
                    )}
                    {p.mediaType === 'video' && (
                        <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1 rounded font-bold" aria-label="Video davomiyligi">
                            0:06
                        </div>
                    )}
                </div>
                {/* Content - Below thumbnail on mobile, beside on desktop */}
                <div className="flex-1 flex flex-col gap-1 min-w-0 pt-0 md:pt-0.5">
                    <h4 className="text-[14px] font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors text-foreground">
                        {p.content}
                    </h4>
                    <div className="flex flex-col text-[12px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1 hover:text-foreground transition-colors font-medium">
                            {p.author?.fullName}
                            <VerifiedBadge size={10} />
                        </span>
                        <div className="flex items-center gap-1 font-medium">
                            <span>{p.views.toLocaleString()} marta ko'rilgan</span>
                            <span className="text-[8px] opacity-50" aria-hidden="true">•</span>
                            <span>{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </Link>
        ))}
    </div>
);

export default function PostDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const { data: post, isLoading } = useQuery({
        queryKey: ["post", id],
        queryFn: async () => {
            const posts = await postService.getPosts();
            return posts.find(p => p.id === id) || null;
        },
        enabled: !!id,
    });

    const [likesCount, setLikesCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [hasDisliked, setHasDisliked] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [authorFollowers, setAuthorFollowers] = useState(0);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const { data: recommendations = [] } = useQuery({
        queryKey: ["post-recommendations"],
        queryFn: () => postService.getPosts(),
    });

    // Stats fetching
    useEffect(() => {
        if (!id || !post?.author?.id) return;

        const fetchStats = async () => {
            // Post stats
            const stats = await postService.getPostStats(id);
            setLikesCount(stats.likes_count);
            setHasLiked(stats.has_liked);
            setHasDisliked(stats.has_disliked);
            setHasSaved(stats.has_saved);

            // Author stats
            if (post.author?.id) {
                const isAuthFollowing = await socialService.isFollowing(post.author.id);
                setIsFollowing(isAuthFollowing);

                // Get fresh follower count
                const socialStats = await socialService.getStats(post.author.id);
                setAuthorFollowers(socialStats.followers);
            }
        };

        fetchStats();
    }, [id, post?.author?.id]);

    // View counting and history tracking
    useEffect(() => {
        if (id && user) {
            postService.incrementViews(id);
            // Add to view history after 3 seconds
            const timer = setTimeout(() => {
                historyService.addToHistory('post', id);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [id, user]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background pb-20 md:pb-0">
                <BottomNav />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="space-y-6">
                        {/* Header skeleton */}
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                            </div>
                        </div>
                        {/* Media skeleton */}
                        <div className="aspect-video w-full rounded-xl bg-muted animate-pulse" />
                        {/* Content skeleton */}
                        <div className="space-y-3">
                            <div className="h-6 w-full bg-muted animate-pulse rounded" />
                            <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-full bg-muted animate-pulse rounded" />
                            <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
                        </div>
                        {/* Actions skeleton */}
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-10 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-10 w-20 bg-muted animate-pulse rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-background pb-20 md:pb-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold">Post topilmadi</h2>
                    <p className="text-muted-foreground">Bu post mavjud emas yoki o'chirilgan</p>
                    <Button onClick={() => navigate("/")}>Bosh sahifaga qaytish</Button>
                </div>
            </div>
        );
    }

    const handleLike = async () => {
        if (!id || !user) return;

        // Optimistic update
        const newLiked = !hasLiked;
        const wasDisliked = hasDisliked;

        setHasLiked(newLiked);
        if (newLiked) {
            setHasDisliked(false);
            setLikesCount(prev => prev + 1);
        } else {
            setLikesCount(prev => prev - 1);
        }

        try {
            await postService.togglePostLike(id);
        } catch (e) {
            // Revert on error
            setHasLiked(!newLiked);
            if (newLiked) setLikesCount(prev => prev - 1);
            else setLikesCount(prev => prev + 1);
            if (wasDisliked) setHasDisliked(true);
        }
    };

    const handleDislike = async () => {
        if (!id || !user) return;

        // Optimistic update
        const newDisliked = !hasDisliked;
        const wasLiked = hasLiked;

        setHasDisliked(newDisliked);
        if (newDisliked && wasLiked) {
            setHasLiked(false);
            setLikesCount(prev => prev - 1);
        }

        try {
            await postService.togglePostDislike(id);
        } catch (e) {
            // Revert
            setHasDisliked(!newDisliked);
            if (newDisliked && wasLiked) {
                setHasLiked(true);
                setLikesCount(prev => prev + 1);
            }
        }
    };

    const handleSave = async () => {
        if (!id || !user) return;

        const newSaved = !hasSaved;
        setHasSaved(newSaved);

        try {
            await postService.togglePostSave(id);
        } catch (e) {
            setHasSaved(!newSaved);
        }
    };

    const handleDownload = async () => {
        if (!post?.mediaUrl) return;

        try {
            const response = await fetch(post.mediaUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `house_mobile_video_${id}.${post.mediaType === 'video' ? 'mp4' : 'jpg'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            window.open(post.mediaUrl, '_blank');
        }
    };

    const handleFollow = async () => {
        if (!post?.author?.id || !user) return;

        // Optimistic update
        const newFollowing = !isFollowing;
        setIsFollowing(newFollowing);
        setAuthorFollowers(prev => newFollowing ? prev + 1 : prev - 1);

        try {
            if (newFollowing) {
                await socialService.follow(post.author.id);
            } else {
                await socialService.unfollow(post.author.id);
            }
        } catch (e) {
            // Revert
            setIsFollowing(!newFollowing);
            setAuthorFollowers(prev => !newFollowing ? prev + 1 : prev - 1);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post?.title || 'House Mobile',
                    text: post?.content,
                    url
                });
            } catch (e) {
                // Share cancelled
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(url);
            // Could add toast here
            alert("Havola nusxalandi!");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Yuklanmoqda...</p>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Post topilmadi</p>
                    <Button variant="outline" onClick={() => navigate("/")}>
                        Bosh sahifaga qaytish
                    </Button>
                </div>
            </div>
        );
    }

    const otherPosts = recommendations?.filter(p => p.id !== id).slice(0, 10) || [];

    return (
        <div className="bg-background">
            <Helmet>
                <title>{post?.title ? `${post.title} - House Mobile` : post?.content ? `${post.content.substring(0, 30)}... - House Mobile` : "Yangilik - House Mobile"}</title>
                <meta name="description" content={post?.content?.substring(0, 160) || "House Mobile yangiliklari"} />
            </Helmet>
            {/* Mobile Secondary Header (Below Main Header) */}
            <header className="flex items-center justify-between px-4 py-3 bg-background border-b border-zinc-100 dark:border-zinc-800 md:hidden sticky top-16 z-40">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-foreground transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-bold text-sm">Orqaga</span>
                </button>
            </header>

            <div className="w-full px-0 md:pl-4 md:pr-4 py-0 md:py-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Main Content (Video/Post) - 9 slots on wide grid for larger player */}
                    <div className="md:col-span-8 xl:col-span-9 space-y-4">
                        {/* Media Section - Cinematic Black Background */}
                        <div className="relative aspect-video bg-black w-full overflow-hidden md:rounded-xl shadow-2xl ring-1 ring-white/10 md:min-h-[60vh] lg:min-h-[70vh]">
                            {post.mediaUrl ? (
                                post.mediaType === 'video' ? (
                                    <video
                                        src={post.mediaUrl}
                                        className="w-full h-full object-contain"
                                        controls
                                        autoPlay
                                        poster={post.mediaUrl + "#t=0.1"}
                                    />
                                ) : (
                                    <img
                                        src={post.mediaUrl}
                                        className="w-full h-full object-contain"
                                        alt="post media"
                                    />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                    <div className="text-center p-8">
                                        <Play className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                                        <p className="text-zinc-500 max-w-sm mx-auto">{post.content}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* YouTube Style Title & Info Bar */}
                        <div className="px-4 md:px-0 space-y-4 mt-6">
                            <h1 className="text-xl md:text-2xl font-bold leading-tight text-foreground">
                                {post.title || post.content?.split('\n')[0] || "Yangilik"}
                            </h1>

                            <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-6">
                                {/* Left side: Author & Follow */}
                                <div className="flex items-center gap-3">
                                    <Link to={`/profile/${post.author?.id}`}>
                                        <Avatar className="h-10 w-10 border border-border/50 shadow-sm">
                                            <AvatarImage src={post.author?.avatarUrl} />
                                            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 font-bold">
                                                {post.author?.fullName?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex flex-col min-w-0 mr-2">
                                        <Link to={`/profile/${post.author?.id}`} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                                            <span className="font-bold text-[16px] truncate">{post.author?.fullName}</span>
                                            {(post.author?.role === 'super_admin' || post.author?.role === 'blogger') && (
                                                <VerifiedBadge size={14} className="shrink-0" />
                                            )}
                                        </Link>
                                        <span className="text-[12px] text-muted-foreground leading-none mt-1">
                                            {authorFollowers.toLocaleString()} obunachi
                                        </span>
                                    </div>
                                    {user?.id !== post.author?.id && (
                                        <Button
                                            size="sm"
                                            onClick={handleFollow}
                                            className={cn(
                                                "rounded-full px-5 h-9 font-bold text-sm transition-all ml-2",
                                                isFollowing
                                                    ? "bg-zinc-100 dark:bg-zinc-800 text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                                    : "bg-foreground text-background hover:bg-foreground/90"
                                            )}
                                        >
                                            {isFollowing ? "Obuna bo'lingan" : "Obuna"}
                                        </Button>
                                    )}
                                </div>

                                {/* Right side: Engagement Buttons */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Like & Dislike Group */}
                                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-full h-9 overflow-hidden">
                                        <button
                                            onClick={handleLike}
                                            className={cn(
                                                "flex items-center gap-2 px-4 border-r border-zinc-200/50 dark:border-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 transition-colors h-full",
                                                hasLiked && "text-blue-500 dark:text-blue-400"
                                            )}
                                        >
                                            <ThumbsUp className={cn("h-4.5 w-4.5", hasLiked && "fill-current")} />
                                            <span className="text-[13px] font-bold">
                                                {likesCount > 0 ? (likesCount >= 1000 ? (likesCount / 1000).toFixed(1) + ' ming' : likesCount) : ''}
                                            </span>
                                        </button>
                                        <button
                                            onClick={handleDislike}
                                            className={cn(
                                                "px-3 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 transition-colors h-full flex items-center justify-center",
                                                hasDisliked && "text-red-500 dark:text-red-400"
                                            )}
                                        >
                                            <ThumbsDown className={cn("h-4.5 w-4.5", hasDisliked && "fill-current")} />
                                        </button>
                                    </div>

                                    {/* Share Button */}
                                    <Button
                                        variant="secondary"
                                        onClick={handleShare}
                                        className="rounded-full gap-2 h-9 px-4 font-bold text-[13px] bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 border-none flex items-center"
                                    >
                                        <Share2 className="h-4 w-4" />
                                        <span>Ulashish</span>
                                    </Button>

                                    {/* Save Button */}
                                    <Button
                                        variant="secondary"
                                        onClick={handleSave}
                                        className={cn(
                                            "rounded-full gap-2 h-9 px-4 font-bold text-[13px] bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 border-none flex items-center",
                                            hasSaved && "text-blue-500 dark:text-blue-400"
                                        )}
                                    >
                                        <Bookmark className={cn("h-4 w-4", hasSaved && "fill-current")} />
                                        <span>{hasSaved ? "Saqlandi" : "Saqlash"}</span>
                                    </Button>

                                    {/* Download Button */}
                                    <Button
                                        variant="secondary"
                                        onClick={handleDownload}
                                        className="rounded-full gap-2 h-9 px-4 font-bold text-[13px] bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 border-none flex items-center"
                                    >
                                        <Download className="h-4 w-4" />
                                        <span>Yuklab olish</span>
                                    </Button>

                                    {/* More Menu */}
                                    <Button variant="secondary" className="rounded-full h-9 w-9 p-0 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 border-none flex items-center justify-center">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* YouTube Expandable Description */}
                        <div
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className={cn(
                                "bg-zinc-100 dark:bg-zinc-900 rounded-xl p-3 text-[14px] transition-colors cursor-pointer",
                                !isDescriptionExpanded && "hover:bg-zinc-200 dark:hover:bg-zinc-800"
                            )}
                        >
                            <div className="flex items-center gap-2 font-black mb-1.5 text-[13px] text-foreground">
                                <span>{post.views.toLocaleString()} marta ko'rilgan</span>
                                <span className="text-muted-foreground">•</span>
                                <span>{new Date(post.created_at).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>

                            <p className={cn(
                                "whitespace-pre-wrap leading-relaxed text-zinc-900 dark:text-zinc-100 font-medium",
                                !isDescriptionExpanded && "line-clamp-2"
                            )}>
                                {post.content}
                            </p>

                            <button className="mt-1 font-black text-foreground hover:opacity-70 transition-opacity text-[13px]">
                                {isDescriptionExpanded ? "Kamroq" : "Yana..."}
                            </button>
                        </div>

                        {/* Comments Section (YouTube Style) */}
                        <div className="mt-6 space-y-4">
                            {/* Desktop View: Always visible */}
                            <div className="hidden lg:block">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold">Izohlar</h3>
                                </div>
                                <PostComments postId={post.id} />
                            </div>

                            {/* Mobile View: Drawer */}
                            <div className="lg:hidden">
                                <Drawer modal={true}>
                                    <DrawerTrigger asChild>
                                        <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-xl flex items-center justify-between cursor-pointer active:scale-95 transition-transform ring-1 ring-white/5 mx-auto w-full">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-sm">Izohlar</span>
                                                <span className="text-xs text-muted-foreground">Fikr bildirish uchun bosing...</span>
                                            </div>
                                            <Button variant="ghost" size="sm" className="pointer-events-none">
                                                Ochish
                                            </Button>
                                        </div>
                                    </DrawerTrigger>
                                    <DrawerContent className="bg-background border-border text-foreground max-h-[85vh] flex flex-col focus:outline-none z-[150]">
                                        <div className="mx-auto w-full max-w-sm flex-1 flex flex-col h-full">
                                            <DrawerHeader className="border-b border-border relative shrink-0 px-4 pb-3">
                                                <DrawerTitle className="text-center font-bold text-sm text-foreground uppercase tracking-widest">
                                                    Izohlar
                                                </DrawerTitle>
                                            </DrawerHeader>
                                            <div className="p-4 pt-0 flex-1 overflow-hidden h-full flex flex-col mt-4">
                                                <PostComments postId={post.id} />
                                            </div>
                                        </div>
                                    </DrawerContent>
                                </Drawer>
                            </div>
                        </div>

                        {/* Recommended Posts - Visible on Mobile (below main content) */}
                        <div className="lg:hidden space-y-4 pt-4 border-t border-border/50">
                            <h3 className="font-bold text-[15px] px-1 uppercase tracking-widest text-muted-foreground">Tavsiya etiladi</h3>
                            <RecommendedPosts otherPosts={otherPosts} />
                        </div>
                    </div>

                    {/* Sidebar / Recommended Posts - Desktop (visible on lg and up) */}
                    <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4">
                        {/* Categories/Tabs - Desktop */}
                        <div className="flex overflow-x-auto gap-2 no-scrollbar py-2">
                            {['Hammasi', 'Manba: House', 'Aloqador'].map((tag, i) => (
                                <button
                                    key={tag}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors",
                                        i === 0
                                            ? "bg-foreground text-background"
                                            : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                    )}
                                    aria-label={`${tag} kategoriyasi`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        <RecommendedPosts otherPosts={otherPosts} />
                    </div>
                </div>
            </div>
            <BottomNav />
        </div>
    );
}
