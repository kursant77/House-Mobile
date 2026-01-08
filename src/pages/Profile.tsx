import { useState, useMemo, useEffect } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
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
    const hasFullName = user.name && user.name.split(' ').length >= 2;
    const hasBio = user.bio && user.bio.trim().length >= 10;
    const onboardingComplete = localStorage.getItem("onboarding_complete") === "true";
    return hasFullName && hasBio && onboardingComplete;
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16 uppercase-none">
      <BottomNav />

      {/* Header for Mobile */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border flex items-center justify-between px-4 h-14 md:hidden">
        <h1 className="font-bold text-lg">{user.name || "Profil"}</h1>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigate("/upload")}>
            <Plus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pt-14 md:pt-8 px-4">
        {/* Profile Info Section (Instagram Style) */}
        <div className="flex flex-col md:flex-row items-start gap-4 md:gap-8 mb-6 md:mb-10">
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
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full flex justify-center bg-transparent border-t border-border rounded-none h-12 gap-8 md:gap-14">
            <TabsTrigger
              value="posts"
              className="data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none bg-transparent h-full px-4 gap-2 text-xs font-bold uppercase tracking-widest"
            >
              <Grid className="h-4 w-4" /> POSTLAR
            </TabsTrigger>
            <TabsTrigger
              value="reels"
              className="data-[state=active]:border-t-2 data-[state=active]:border-foreground rounded-none bg-transparent h-full px-4 gap-2 text-xs font-bold uppercase tracking-widest"
            >
              <Play className="h-4 w-4" /> REELS
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
              <div className="grid grid-cols-3 gap-0.5 md:gap-4">
                {userProducts.map((product) => (
                  <div key={product.id} className="relative aspect-square group bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                    <img
                      src={product.images[0]}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
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

