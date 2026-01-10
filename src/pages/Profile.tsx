import { useState, useMemo, useEffect } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import {
  Settings,
  Grid,
  Play,
  LogOut,
  Edit,
  Camera,
  Trash2,
  PackageSearch,
  Loader2,
  Heart,
  Eye,
  MoreVertical,
  Plus,
  MapPin,
  Instagram,
  Facebook,
  Send as SendIcon,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/api/products";
import { socialService } from "@/services/api/social";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Profile() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { favorites } = useFavoritesStore();

  // Check if user needs onboarding
  useEffect(() => {
    if (user) {
      const onboardingComplete = localStorage.getItem("onboarding_complete");
      const needsOnboarding = !onboardingComplete && (!user.bio || !user.name || user.name.split(' ').length < 2);
      if (needsOnboarding) {
        navigate("/onboarding");
      }
    }
  }, [user, navigate]);

  const { data: userProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["user-products", user?.id],
    queryFn: () => productService.getProductsByUserId(user?.id || ""),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const { data: userStats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: () => socialService.getStats(user?.id || ""),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-products", user?.id] });
      toast.success("Mahsulot muvaffaqiyatli o'chirildi");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const reelProducts = useMemo(() => userProducts.filter((p) => p.videoUrl), [userProducts]);

  // Check if profile is complete
  const isProfileComplete = useMemo(() => {
    if (!user) return false;
    const hasFullName = user.name && user.name.trim().length >= 2;
    const hasBio = user.bio && user.bio.trim().length >= 5;
    const hasAddress = user.address && user.address.trim().length >= 3;
    const onboardingComplete = localStorage.getItem("onboarding_complete") === "true";
    return hasFullName && hasBio && hasAddress && onboardingComplete;
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16 uppercase-none">
      <BottomNav />

      <main className="max-w-4xl mx-auto pt-14 md:pt-8 px-4">
        <div className="md:hidden">
          <div className="flex items-center px-4 mb-3">
            <div className="relative mr-8">
              <Avatar className="h-20 w-20 border border-border/50 ring-2 ring-background">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-2xl bg-zinc-100 dark:bg-zinc-800">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 h-6 w-6 rounded-full border-2 border-background bg-blue-500 hover:bg-blue-600 text-white shadow-none"
                onClick={() => navigate("/upload")}
              >
                <Plus className="h-3 w-3" strokeWidth={3} />
              </Button>
            </div>

            <div className="flex flex-1 justify-between pr-4">
              <div className="flex flex-col items-center cursor-pointer">
                <span className="font-bold text-[17px] leading-tight">{userProducts.length}</span>
                <span className="text-[13px] text-foreground/90 font-normal">Postlar</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer">
                <span className="font-bold text-[17px] leading-tight">{userStats?.followers || 0}</span>
                <span className="text-[13px] text-foreground/90 font-normal">Obunachilar</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer">
                <span className="font-bold text-[17px] leading-tight">{userStats?.following || 0}</span>
                <span className="text-[13px] text-foreground/90 font-normal">Obunalar</span>
              </div>
            </div>
          </div>

          <div className="px-4 mb-4 space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold text-base">{user.username || user.name?.split(' ')[0]}</p>
              {(user.role === 'super_admin' || user.role === 'blogger') && (
                <VerifiedBadge size={16} />
              )}
              {user.role === 'super_admin' && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>
              )}
              {user.role === 'blogger' && (
                <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-golden">Blogger</span>
              )}
            </div>
            <p className="font-semibold text-sm text-muted-foreground">{user.name}</p>
            <div className="text-sm/snug whitespace-pre-wrap break-words">{user.bio}</div>
            {user.address && (
              <p className="text-sm text-blue-900 dark:text-blue-100/90 font-medium flex items-center gap-0.5 mt-1">
                {user.address}
              </p>
            )}
            <div className="flex gap-4 mt-2">
              {user.telegram && (
                <a href={`https://t.me/${user.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:opacity-70 transition-opacity">
                  <SendIcon className="h-5 w-5" strokeWidth={1.5} />
                </a>
              )}
              {user.instagram && (
                <a href={`https://instagram.com/${user.instagram}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:opacity-70 transition-opacity">
                  <Instagram className="h-5 w-5" strokeWidth={1.5} />
                </a>
              )}
            </div>
          </div>

          <div className="flex gap-1.5 mb-2 px-4">
            <Button
              variant="secondary"
              className="flex-1 h-8 text-[13px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
              onClick={() => navigate("/profile/edit")}
            >
              Profilni tahrirlash
            </Button>
            <Button
              variant="secondary"
              className="flex-1 h-8 text-[13px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Profil havolasi nusxalandi");
              }}
            >
              Profilni ulashish
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg shrink-0"
              onClick={() => navigate("/onboarding")}
            >
              <div className="scale-x-[-1]">
                <Plus className="h-4 w-4" />
              </div>
            </Button>
          </div>

          {/* Highlights Placeholder - Removed for cleaner UI */}
          {/* <div className="flex gap-4 px-4 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-16 h-16 rounded-full border border-border/50 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-1">
                <div className="w-full h-full rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-foreground/50" />
                </div>
              </div>
              <span className="text-xs">Yangi</span>
            </div>
          </div> */}
        </div>

        {/* Desktop Profile Info Section (Kept as is) */}
        <div className="hidden md:flex flex-col md:flex-row items-start gap-4 md:gap-8 mb-6 md:mb-10">
          {/* Avatar */}
          <div className="relative mx-auto md:mx-0">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 lg:h-40 lg:w-40 border border-border">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="text-3xl md:text-4xl bg-gradient-to-br from-primary/20 to-primary/10">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 h-8 w-8 md:h-9 md:w-9 rounded-full border-2 border-background shadow-md hover:scale-110 transition-transform"
              onClick={() => navigate("/profile/edit")}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {/* Profile Info */}
          <div className="flex-1 w-full md:w-auto space-y-4">
            {/* Username and Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-light text-foreground truncate">
                  {user.username || user.name?.split(' ')[0] || "username"}
                </h1>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none h-9 font-medium px-4"
                  onClick={() => navigate("/profile/edit")}
                >
                  Profilni tahrirlash
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 md:hidden"
                  onClick={() => navigate("/profile/edit")}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats - Desktop */}
            <div className="hidden md:flex items-center gap-10">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-base">{userProducts.length}</span>
                <span className="text-sm text-foreground">postlar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-base">{userStats?.followers || 0}</span>
                <span className="text-sm text-foreground">obunachilar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-base">{userStats?.following || 0}</span>
                <span className="text-sm text-foreground">obunalar</span>
              </div>
            </div>

            {/* Stats - Mobile */}
            <div className="flex md:hidden items-center justify-around border-y border-border py-3">
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-semibold text-base">{userProducts.length}</span>
                <span className="text-xs text-muted-foreground">postlar</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-semibold text-base">{userStats?.followers || 0}</span>
                <span className="text-xs text-muted-foreground">obunachilar</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-semibold text-base">{userStats?.following || 0}</span>
                <span className="text-xs text-muted-foreground">obunalar</span>
              </div>
            </div>

            {/* Bio and Name */}
            <div className="space-y-1">
              <p className="font-semibold text-sm md:text-base">{user.name || "To'liq ism"}</p>
              {user.bio ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {user.bio}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Bio ma'lumotlari hozircha kiritilmagan
                </p>
              )}
              {user.phone && (
                <p className="text-sm text-muted-foreground mt-1">
                  📱 {user.phone}
                </p>
              )}
              {user.address && (
                <p className="text-sm text-muted-foreground">
                  📍 {user.address}
                </p>
              )}
              <div className="flex gap-3 mt-2">
                {user.telegram && (
                  <a href={`https://t.me/${user.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:scale-110 transition-transform">
                    <SendIcon className="h-4 w-4" />
                  </a>
                )}
                {user.instagram && (
                  <a href={`https://instagram.com/${user.instagram}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:scale-110 transition-transform">
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {user.facebook && (
                  <a href={user.facebook.startsWith('http') ? user.facebook : `https://facebook.com/${user.facebook}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:scale-110 transition-transform">
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Complete Profile Button */}
            {!isProfileComplete && (
              <Button
                onClick={() => navigate("/onboarding")}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium h-9 px-6 shadow-sm"
              >
                Profilni to'liq tugallang
              </Button>
            )}

          </div>
        </div>

        {/* Action Tabs */}
        <Tabs defaultValue="posts" className="w-full mt-2">
          <TabsList className="w-full flex h-12 bg-transparent border-t border-border/50 p-0 rounded-none">
            <TabsTrigger
              value="posts"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground/50 transition-none"
            >
              <Grid className="h-6 w-6" strokeWidth={2} />
            </TabsTrigger>
            <TabsTrigger
              value="reels"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground/50 transition-none"
            >
              <Play className="h-7 w-7" strokeWidth={2} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-1">
            {isLoadingProducts ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded-sm" />
                ))}
              </div>
            ) : userProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 rounded-full border-2 border-foreground">
                  <Camera className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold">Hali rasmlar yo'q</h3>
                <Button onClick={() => navigate("/upload")}>Birinchi mahsulotni yuklang</Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 pb-20">
                {userProducts.map((product) => (
                  <div key={product.id} className="relative aspect-square group bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                    <img
                      src={product.images[0]}
                      className="h-full w-full object-cover"
                      alt={product.title}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-6 text-white font-bold text-xs md:text-sm">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4 md:h-5 md:w-5 fill-white" /> {Math.floor(Math.random() * 50)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 md:h-5 md:w-5" /> {product.views || 0}
                        </div>
                      </div>
                    </div>

                    {/* Management Menu */}
                    <div className="absolute top-1 right-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-black/20 backdrop-blur-md border-none text-white hover:bg-black/40">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem onClick={() => navigate(`/upload?edit=${product.id}`)}>
                            <Edit className="h-4 w-4 mr-2" /> Tahrirlash
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> O'chirish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reels" className="mt-1">
            {reelProducts.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                <Play className="h-12 w-12" />
                <p>Hali videolar yuklanmagan</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 md:gap-4">
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
                    {/* Management Menu for Reels */}
                    <div className="absolute top-1 right-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-black/20 backdrop-blur-md border-none text-white hover:bg-black/40" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/upload?edit=${product.id}`); }}>
                            <Edit className="h-4 w-4 mr-2" /> Tahrirlash
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> O'chirish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

