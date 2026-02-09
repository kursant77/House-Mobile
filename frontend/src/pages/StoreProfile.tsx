import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Grid, Play, Settings, Share2, Loader2, UserPlus, UserCheck, Instagram, Facebook, Send as SendIcon, MessageSquare, Heart, Newspaper, Film, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productService } from "@/services/api/products";
import { postService } from "@/services/api/posts";
import { socialService } from "@/services/api/social";
import { notificationService } from "@/services/api/notifications";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { cn } from "@/lib/utils";
import { BioDisplay } from "@/components/shared/BioDisplay";
import UserBadges from "@/components/profile/UserBadges";

export default function StoreProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user: currentUser, isAuthenticated } = useAuthStore();
    const isOwnProfile = currentUser?.id === id;
    const isAdmin = currentUser?.role === 'super_admin';

    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ["profile", id],
        queryFn: () => socialService.getProfile(id || ""),
        enabled: !!id,
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["profile-stats", id],
        queryFn: () => socialService.getStats(id || ""),
        enabled: !!id,
    });

    const { data: products, isLoading: productsLoading } = useQuery({
        queryKey: ["profile-products", id],
        queryFn: () => productService.getProductsByUserId(id || ""),
        enabled: !!id,
    });

    const { data: newsPosts = [], isLoading: newsLoading } = useQuery({
        queryKey: ["profile-news", id],
        queryFn: () => postService.getPostsByUserId(id || ""),
        enabled: !!id,
    });

    const { data: followingStatus } = useQuery({
        queryKey: ["following-status", id],
        queryFn: () => socialService.isFollowing(id || ""),
        enabled: !!id && isAuthenticated && !isOwnProfile,
    });

    const followMutation = useMutation({
        mutationFn: () => socialService.follow(id || ""),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["following-status", id] });
            queryClient.invalidateQueries({ queryKey: ["profile-stats", id] });
            toast.success("Obuna bo'lindi");
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const unfollowMutation = useMutation({
        mutationFn: () => socialService.unfollow(id || ""),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["following-status", id] });
            queryClient.invalidateQueries({ queryKey: ["profile-stats", id] });
            toast.success("Obunadan chiqildi");
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const handleFollowToggle = () => {
        if (!isAuthenticated) {
            navigate("/auth");
            return;
        }
        if (followingStatus) {
            unfollowMutation.mutate();
        } else {
            followMutation.mutate();
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) {
            toast.error("Xabar matnini kiriting");
            return;
        }

        setIsSending(true);
        try {
            await notificationService.sendNotification({
                title: `${currentUser?.name || 'Foydalanuvchi'}dan xabar`, // Send as current user, not Admin
                message: message.trim(),
                type: 'info',
                target: 'user',
                user_id: id,
            });
            toast.success("Xabar yuborildi");
            setMessage("");
            setDialogOpen(false);
        } catch (error) {
            const err = error as Error;
            toast.error("Xatolik: " + err.message);
        } finally {
            setIsSending(false);
        }
    };

    if (profileLoading || statsLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) return <div>Profil topilmadi</div>;

    const reelProducts = products?.filter(p => p.videoUrl) || [];

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16 uppercase-none">
            <main className="max-w-4xl mx-auto pt-14 md:pt-8 px-4 md:px-4">
                {/* Mobile Header (Instagram Style) */}
                <div className="md:hidden">
                    <div className="flex items-center px-4 mb-3">
                        <div className="relative mr-8">
                            <Avatar className="h-20 w-20 border border-border/50 ring-2 ring-background">
                                <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
                                <AvatarFallback className="text-2xl bg-zinc-100 dark:bg-zinc-800">
                                    {profile.fullName?.charAt(0)?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        <div className="flex flex-1 justify-between pr-4">
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-[17px] leading-tight">{stats?.posts || 0}</span>
                                <span className="text-[13px] text-foreground/90 font-normal">Postlar</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-[17px] leading-tight">{stats?.followers || 0}</span>
                                <span className="text-[13px] text-foreground/90 font-normal">Obunachilar</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-[17px] leading-tight">{stats?.following || 0}</span>
                                <span className="text-[13px] text-foreground/90 font-normal">Obunalar</span>
                            </div>
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="px-4 mb-4 space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-base">{profile.username || profile.fullName?.split(' ')[0]}</p>
                            {(profile.role === 'super_admin' || profile.role === 'blogger') && (
                                <VerifiedBadge size={16} />
                            )}
                        </div>
                        <p className="font-semibold text-sm text-muted-foreground">{profile.fullName}</p>
                        <UserBadges userId={id!} className="mt-1" size="sm" />
                        <BioDisplay bio={profile.bio || ""} maxLines={3} className="text-sm/snug" />
                        {profile.address && (
                            <p className="text-sm text-blue-900 dark:text-blue-100/90 font-medium flex items-center gap-0.5 mt-1">
                                <MapPin className="h-3 w-3" /> {profile.address}
                            </p>
                        )}
                        <div className="flex gap-4 mt-2">
                            {profile.telegram && (
                                <a href={`https://t.me/${profile.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:opacity-70 transition-opacity">
                                    <SendIcon className="h-5 w-5" strokeWidth={1.5} />
                                </a>
                            )}
                            {profile.instagram && (
                                <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:opacity-70 transition-opacity">
                                    <Instagram className="h-5 w-5" strokeWidth={1.5} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 mb-2 px-4">
                        {!isOwnProfile ? (
                            <>
                                <Button
                                    variant={followingStatus ? "secondary" : "default"}
                                    className={cn(
                                        "flex-1 h-8 text-[13px] font-semibold rounded-lg",
                                        !followingStatus && "bg-blue-500 hover:bg-blue-600 text-white"
                                    )}
                                    onClick={handleFollowToggle}
                                >
                                    {followingStatus ? "Obunadasiz" : "Obuna bo'lish"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="flex-1 h-8 text-[13px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
                                    onClick={() => setDialogOpen(true)}
                                >
                                    Xabar yuborish
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="secondary"
                                className="flex-1 h-8 text-[13px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
                                onClick={() => navigate('/profile')}
                            >
                                Profilni tahrirlash
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg shrink-0"
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success("Profil havolasi nusxalandi");
                            }}
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Desktop Header (Consistent with Profile.tsx) */}
                <div className="hidden md:flex flex-col md:flex-row items-start gap-8 mb-10">
                    <Avatar className="h-32 w-32 lg:h-40 lg:w-40 border border-border">
                        <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
                        <AvatarFallback className="text-3xl lg:text-4xl bg-gradient-to-br from-primary/20 to-primary/10">
                            {profile.fullName?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl lg:text-3xl font-light">{profile.fullName}</h1>
                            {(profile.role === 'super_admin' || profile.role === 'blogger') && (
                                <VerifiedBadge size={20} />
                            )}
                            <div className="flex gap-2 ml-4">
                                {!isOwnProfile ? (
                                    <>
                                        <Button
                                            variant={followingStatus ? "outline" : "default"}
                                            size="sm"
                                            className="font-medium h-9 px-6"
                                            onClick={handleFollowToggle}
                                        >
                                            {followingStatus ? "Obunadasiz" : "Obuna bo'lish"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="font-medium h-9 px-6"
                                            onClick={() => setDialogOpen(true)}
                                        >
                                            Xabar yuborish
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="font-medium h-9 px-6"
                                        onClick={() => navigate('/profile')}
                                    >
                                        Profilni tahrirlash
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-10">
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold">{stats?.posts || 0}</span>
                                <span className="text-foreground">postlar</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold">{stats?.followers || 0}</span>
                                <span className="text-foreground">obunachilar</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold">{stats?.following || 0}</span>
                                <span className="text-foreground">obunalar</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="font-semibold">{profile.fullName}</p>
                            <UserBadges userId={id!} className="my-2" />
                            <BioDisplay bio={profile.bio || ""} maxLines={3} className="text-sm leading-relaxed max-w-md" />
                            {profile.address && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {profile.address}
                                </p>
                            )}
                            <div className="flex gap-4 mt-2">
                                {profile.telegram && (
                                    <a href={`https://t.me/${profile.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:opacity-70 transition-opacity">
                                        <SendIcon className="h-4 w-4" />
                                    </a>
                                )}
                                {profile.instagram && (
                                    <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:opacity-70 transition-opacity">
                                        <Instagram className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs (Instagram Style) */}
                <Tabs defaultValue="posts" className="w-full mt-2">
                    <TabsList className="w-full flex h-12 bg-transparent border-t border-border/50 p-0 rounded-none">
                        <TabsTrigger
                            value="posts"
                            className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground/50 transition-none"
                        >
                            <Grid className="h-6 w-6" strokeWidth={2} />
                        </TabsTrigger>
                        {(profile.role === 'super_admin' || profile.role === 'blogger') && (
                            <TabsTrigger
                                value="news"
                                className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground/50 transition-none"
                            >
                                <Newspaper className="h-6 w-6" strokeWidth={2} />
                            </TabsTrigger>
                        )}
                        <TabsTrigger
                            value="reels"
                            className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground/50 transition-none"
                        >
                            <Play className="h-7 w-7" strokeWidth={2} />
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="posts" className="mt-1">
                        {productsLoading ? (
                            <div className="grid grid-cols-3 gap-0.5 md:gap-4">
                                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-muted animate-pulse rounded-sm" />)}
                            </div>
                        ) : products?.length === 0 ? (
                            <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                                <Grid className="h-12 w-12 opacity-20" />
                                <p>Hozircha postlar yo'q</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-0.5 pb-20">
                                {products?.map(product => (
                                    <div
                                        key={product.id}
                                        className="relative aspect-square group bg-zinc-100 dark:bg-zinc-900 overflow-hidden cursor-pointer"
                                        onClick={() => navigate(`/product/${product.id}`)}
                                    >
                                        <img src={product.images[0]} className="h-full w-full object-cover" alt={product.title} />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="flex gap-4 text-white font-bold text-xs">
                                                <div className="flex items-center gap-1"><Heart className="h-4 w-4 fill-white" /> {Math.floor(Math.random() * 20)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="news" className="mt-1">
                        {newsLoading ? (
                            <div className="grid grid-cols-3 gap-0.5 md:gap-4">
                                {[1, 2, 3].map(i => <div key={i} className="aspect-square bg-muted animate-pulse rounded-sm" />)}
                            </div>
                        ) : newsPosts.length === 0 ? (
                            <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                                <Newspaper className="h-12 w-12 opacity-20" />
                                <p>Hozircha yangiliklar yo'q</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-0.5 pb-20">
                                {newsPosts.map(post => (
                                    <div
                                        key={post.id}
                                        className="relative aspect-square group bg-zinc-100 dark:bg-zinc-900 overflow-hidden cursor-pointer"
                                        onClick={() => navigate(`/post/${post.id}`)}
                                    >
                                        {post.mediaUrl ? (
                                            post.mediaType === 'video' ? (
                                                <video src={post.mediaUrl} className="h-full w-full object-cover" />
                                            ) : (
                                                <img src={post.mediaUrl} className="h-full w-full object-cover" alt="news media" />
                                            )
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-muted p-2 text-xs text-center">
                                                {post.content.slice(0, 50)}...
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="flex gap-4 text-white font-bold text-xs">
                                                <div className="flex items-center gap-1"><Eye className="h-4 w-4 fill-white" /> {post.views}</div>
                                            </div>
                                        </div>
                                        {post.mediaType === 'video' && (
                                            <div className="absolute top-1 right-1 bg-black/60 rounded-full p-1">
                                                <Film className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="reels" className="mt-1">
                        {reelProducts.length === 0 ? (
                            <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                                <Play className="h-12 w-12 opacity-20" />
                                <p>Hozircha videolar yo'q</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-0.5">
                                {reelProducts.map(product => (
                                    <div
                                        key={product.id}
                                        className="aspect-[9/16] relative group cursor-pointer overflow-hidden bg-zinc-900"
                                        onClick={() => navigate(`/reels?id=${product.id}`)}
                                    >
                                        <img src={product.images[0]} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Play className="h-8 w-8 text-white fill-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>

            {/* Message Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Foydalanuvchiga xabar yuborish</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Xabaringizni yozing..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[120px] resize-none"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Bekor qilish</Button>
                        <Button
                            onClick={handleSendMessage}
                            disabled={isSending || !message.trim()}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SendIcon className="h-4 w-4 mr-2" />}
                            Yuborish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
