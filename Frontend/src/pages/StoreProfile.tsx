import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Grid, Play, Settings, Share2, Loader2, UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productService } from "@/services/api/products";
import { socialService } from "@/services/api/social";
import { useAuthStore } from "@/store/authStore";
import { ProductCard } from "@/components/products/ProductCard";
import { toast } from "sonner";

export default function StoreProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user: currentUser, isAuthenticated } = useAuthStore();
    const isOwnProfile = currentUser?.id === id;

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
        onError: (err: any) => toast.error(err.message),
    });

    const unfollowMutation = useMutation({
        mutationFn: () => socialService.unfollow(id || ""),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["following-status", id] });
            queryClient.invalidateQueries({ queryKey: ["profile-stats", id] });
            toast.success("Obunadan chiqildi");
        },
        onError: (err: any) => toast.error(err.message),
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
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 h-14 md:hidden">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="font-bold text-sm truncate">{profile.fullName || "User"}</h1>
                <Button variant="ghost" size="icon">
                    <Share2 className="h-5 w-5" />
                </Button>
            </header>

            <main className="max-w-4xl mx-auto pt-14 md:pt-8 px-4">
                {/* Profile Info Section */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
                    <Avatar className="h-24 w-24 md:h-32 md:w-32 border-2 border-primary/20 p-1">
                        <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
                        <AvatarFallback className="text-2xl">{profile.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-4 w-full">
                        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                            <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                            <div className="flex gap-2">
                                {isOwnProfile ? (
                                    <Button variant="secondary" size="sm" onClick={() => navigate("/profile/edit")}>
                                        <Settings className="h-4 w-4 mr-2" />
                                        Tahrirlash
                                    </Button>
                                ) : (
                                    <Button
                                        variant={followingStatus ? "outline" : "default"}
                                        size="sm"
                                        className="min-w-[120px]"
                                        onClick={handleFollowToggle}
                                    >
                                        {followingStatus ? (
                                            <><UserCheck className="h-4 w-4 mr-2" /> Obunadasiz</>
                                        ) : (
                                            <><UserPlus className="h-4 w-4 mr-2" /> Obuna bo'lish</>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex justify-center md:justify-start gap-8 w-full border-y border-border py-4 md:border-none md:py-0">
                            <div className="flex flex-col items-center md:items-start">
                                <span className="font-bold text-lg">{stats?.posts}</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Postlar</span>
                            </div>
                            <div className="flex flex-col items-center md:items-start">
                                <span className="font-bold text-lg">{stats?.followers}</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Obunachilar</span>
                            </div>
                            <div className="flex flex-col items-center md:items-start">
                                <span className="font-bold text-lg">{stats?.following}</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Obunalar</span>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="max-w-md">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {profile.bio || "Bio ma'lumotlari kiritilmagan."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <Tabs defaultValue="grid" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 bg-transparent border-t border-border rounded-none h-12">
                        <TabsTrigger value="grid" className="data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none bg-transparent">
                            <Grid className="h-5 w-5 mr-2" />
                            <span className="text-xs font-bold uppercase">Mahsulotlar</span>
                        </TabsTrigger>
                        <TabsTrigger value="reels" className="data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none bg-transparent">
                            <Play className="h-5 w-5 mr-2" />
                            <span className="text-xs font-bold uppercase">Reels</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="grid" className="mt-6">
                        {productsLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[4/5] bg-muted animate-pulse rounded-xl" />)}
                            </div>
                        ) : products?.length === 0 ? (
                            <div className="py-20 text-center text-muted-foreground">Hali mahsulotlar yo'q</div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
                                {products?.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="reels" className="mt-6">
                        {reelProducts.length === 0 ? (
                            <div className="py-20 text-center text-muted-foreground">Hali videolar yo'q</div>
                        ) : (
                            <div className="grid grid-cols-3 gap-1">
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
        </div>
    );
}
