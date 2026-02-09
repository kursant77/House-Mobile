import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import {
  Settings,
  Grid,
  Play,
  Edit,
  Camera,
  Trash2,
  Heart,
  Eye,
  MoreVertical,
  Plus,
  Instagram,
  Facebook,
  Send as SendIcon,
  Newspaper,
  Film,
  LayoutDashboard,
  Menu,
  Gift,
  ShoppingBag,
  History,
  LogOut,
  HelpCircle,
  Share2,
  ArrowRight
} from "lucide-react";
import { postService } from "@/services/api/posts";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BioDisplay } from "@/components/shared/BioDisplay";
import UserBadges from "@/components/profile/UserBadges";

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();


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

  const { data: userNewsPosts = [] } = useQuery({
    queryKey: ["user-news-posts", user?.id],
    queryFn: () => postService.getPostsByUserId(user?.id || ""),
    enabled: !!user?.id && (user.role === 'super_admin' || user.role === 'blogger'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-products", user?.id] });
      toast.success("Mahsulot muvaffaqiyatli o'chirildi");
    },
    onError: (err: Error) => toast.error(err.message || "Xatolik yuz berdi"),
  });



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
    <div className="min-h-screen bg-background pb-20 md:pb-0 pt-16 uppercase-none">
      <BottomNav />



      <main className="max-w-4xl mx-auto pt-2 md:pt-8 px-4">
        {/* Mobile View */}
        <div className="md:hidden">
          <div className="flex items-center px-4 mb-3 mt-4">
            <div className="relative mr-5 shrink-0">
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

            <div className="flex flex-col flex-1 gap-3 pr-2">
              {/* Username & Badges */}
              <div className="flex items-center flex-wrap gap-2">
                <p className="font-bold text-lg leading-none">{user.username || user.name?.split(' ')[0]}</p>
                {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'blogger' || user.role === 'seller') && (
                  <VerifiedBadge size={16} className="shrink-0" />
                )}
                {(user.role === 'super_admin' || user.role === 'admin') && (
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>
                )}
                {user.role === 'blogger' && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-golden">Blogger</span>
                )}
                {user.role === 'seller' && (
                  <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Sotuvchi</span>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-between items-center">
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
          </div>

          <div className="px-4 mb-4 space-y-1">
            <p className="font-semibold text-sm text-muted-foreground">{user.name}</p>
            <UserBadges userId={user.id} className="my-1.5" size="sm" />
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

          <div className="flex flex-col gap-3 mb-8 px-4">
            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    className="flex-1 h-10 text-[14px] font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
                  >
                    <Menu className="h-4 w-4" strokeWidth={3} />
                    Boshqaruv
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="rounded-t-[32px] px-0 pb-10 border-none bg-zinc-900 dark:bg-zinc-950 shadow-[0_-20px_80px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto"
                >
                  {/* Drag Handle */}
                  <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 mt-3" />

                  {/* Header */}
                  <div className="px-6 mb-8 text-left">
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                      Xizmatlar
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </h2>
                    <p className="text-zinc-400 text-sm font-medium mt-1">Shaxsiy kabinetingiz va xizmatlarni boshqaring</p>
                  </div>

                  <div className="px-6 space-y-8">
                    {/* Primary Actions (Dashboard for special roles) */}
                    {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'seller') && (
                      <div className="space-y-3">
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Boshqaruv Paneli</p>
                        {(user.role === 'super_admin' || user.role === 'admin') && (
                          <Button
                            variant="ghost"
                            className="w-full flex items-center justify-between p-5 h-20 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all active:scale-[0.98] group"
                            onClick={() => navigate("/admin")}
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="h-6 w-6" />
                              </div>
                              <div className="text-left">
                                <span className="block text-base font-bold text-white">Admin Boshqaruvi</span>
                                <span className="block text-xs text-primary/70">Tizimni to'liq boshqarish</span>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-primary opacity-50 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        )}
                        {user.role === 'seller' && (
                          <Button
                            variant="ghost"
                            className="w-full flex items-center justify-between p-5 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all active:scale-[0.98] group"
                            onClick={() => navigate("/seller/dashboard")}
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500 group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="h-6 w-6" />
                              </div>
                              <div className="text-left">
                                <span className="block text-base font-bold text-white">Sotuvchi Paneli</span>
                                <span className="block text-xs text-blue-400/70">Mahsulotlarni boshqarish</span>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-blue-500 opacity-50 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Service Grid */}
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Asosiy Xizmatlar</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Referal Hub", desc: "Bonuslar oling", icon: Gift, color: "blue", path: "/referral" },
                          { label: "Buyurtmalar", desc: "Holatni ko'rish", icon: ShoppingBag, color: "emerald", path: "/my-orders" },
                          { label: "Sevimlilar", desc: "Saqlanganlar", icon: Heart, color: "pink", path: "/favorites" },
                          { label: "Tarix", desc: "Ko'rishlar", icon: History, color: "amber", path: "/history" },
                          { label: "Sozlamalar", desc: "Profilni sozlash", icon: Settings, color: "zinc", path: "/settings" },
                          {
                            label: "Ulashish",
                            desc: "Linkdan nusxa",
                            icon: Share2,
                            color: "purple",
                            action: () => {
                              navigator.clipboard.writeText(window.location.href);
                              toast.success("Profil havolasi nusxalandi");
                            }
                          }
                        ].map((item, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            className="flex flex-col items-start justify-between p-4 h-32 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-95 group"
                            onClick={() => item.action ? item.action() : navigate(item.path)}
                          >
                            <div className={cn(
                              "p-3 rounded-xl transition-all group-hover:scale-110",
                              item.color === 'blue' && "bg-blue-500/10 text-blue-400",
                              item.color === 'emerald' && "bg-emerald-500/10 text-emerald-400",
                              item.color === 'pink' && "bg-pink-500/10 text-pink-400",
                              item.color === 'amber' && "bg-amber-500/10 text-amber-400",
                              item.color === 'zinc' && "bg-zinc-500/10 text-zinc-400",
                              item.color === 'purple' && "bg-purple-500/10 text-purple-400",
                            )}>
                              <item.icon className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                              <span className="block text-[14px] font-bold text-white">{item.label}</span>
                              <span className="block text-[10px] text-zinc-500 font-medium">{item.desc}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Logout Section */}
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-between px-6 h-16 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all active:scale-[0.98] border border-red-500/10 group"
                        onClick={() => {
                          useAuthStore.getState().logout();
                          navigate("/auth");
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-xl bg-red-500/10">
                            <LogOut className="h-5 w-5" />
                          </div>
                          <span className="text-base font-bold">Hisobdan chiqish</span>
                        </div>
                        <div className="p-2 rounded-full border border-red-500/20 group-hover:translate-x-1 transition-transform">
                          <ArrowRight className="h-4 w-4 opacity-50" />
                        </div>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <Button
                variant="secondary"
                className="flex-1 h-10 text-[14px] font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all active:scale-95"
                onClick={() => navigate("/profile/edit")}
              >
                Tahrirlash
              </Button>
              <Button
                variant="secondary"
                className="h-10 w-10 p-0 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all active:scale-95"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Nusxalandi");
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Profile Info Section */}
        <div className="hidden md:flex flex-col md:flex-row items-start gap-4 md:gap-8 mb-6 md:mb-10">
          {/* Avatar */}
          <div className="relative mx-auto md:mx-0">
            <Avatar size="xl" borderColor="white" className="md:h-32 md:w-32 lg:h-40 lg:w-40">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>
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
              <div className="flex-1 min-w-0 flex items-center flex-nowrap gap-2">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-light text-foreground truncate">
                  {user.username || user.name?.split(' ')[0] || "username"}
                </h1>
                {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'blogger' || user.role === 'seller') && (
                  <VerifiedBadge size={22} className="shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'seller') && (
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none h-10 font-bold px-6 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20 rounded-xl transition-all"
                    onClick={() => navigate(user.role === 'seller' ? "/seller/dashboard" : "/admin")}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Boshqaruv
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none h-10 font-bold px-5 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all"
                  onClick={() => navigate("/profile/edit")}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Profilni tahrirlash
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 bg-zinc-100 dark:bg-zinc-900 rounded-xl hover:scale-110 active:scale-95 transition-all"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="h-4 w-4 opacity-70" />
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
              <UserBadges userId={user.id} className="my-2" />
              <BioDisplay bio={user.bio || ""} maxLines={3} className="text-sm leading-relaxed" />
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

        {/* Premium Action Tabs */}
        <Tabs defaultValue="posts" className="w-full mt-2">
          <TabsList className="relative w-full flex h-12 bg-transparent border-t border-border/40 p-0 rounded-none overflow-hidden">
            <TabsTrigger
              value="posts"
              className="flex-1 h-full rounded-none data-[state=active]:text-foreground text-zinc-400 font-bold transition-all relative group"
            >
              <Grid className="h-[22px] w-[22px] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground scale-x-0 group-data-[state=active]:scale-x-100 transition-transform origin-center" />
            </TabsTrigger>

            {(user.role === 'super_admin' || user.role === 'blogger') && (
              <TabsTrigger
                value="news"
                className="flex-1 h-full rounded-none data-[state=active]:text-foreground text-zinc-400 font-bold transition-all relative group"
              >
                <Newspaper className="h-[22px] w-[22px] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground scale-x-0 group-data-[state=active]:scale-x-100 transition-transform origin-center" />
              </TabsTrigger>
            )}

            <TabsTrigger
              value="reels"
              className="flex-1 h-full rounded-none data-[state=active]:text-foreground text-zinc-400 font-bold transition-all relative group"
            >
              <Play className="h-6 w-6 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground scale-x-0 group-data-[state=active]:scale-x-100 transition-transform origin-center" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0.5">
            {isLoadingProducts ? (
              <div className="grid grid-cols-3 gap-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div key={i} className="aspect-square bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                ))}
              </div>
            ) : userProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-5 px-6">
                <div className="w-20 h-20 rounded-full border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-zinc-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black">Hali postlar yo'q</h3>
                  <p className="text-sm text-zinc-500 max-w-[240px]">Profilingizni to'ldirish uchun birinchi mahsulotingizni yuklang</p>
                </div>
                <Button
                  onClick={() => navigate("/upload")}
                  className="rounded-xl font-bold px-8 h-11 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                >
                  Yuklash
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 pb-24">
                {userProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-square group bg-zinc-100 dark:bg-zinc-900 overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img
                      src={product.images[0]}
                      className="h-full w-full object-cover cursor-pointer"
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
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
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="news" className="mt-1">
            {userNewsPosts.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                <Newspaper className="h-12 w-12 opacity-20" />
                <p>Hozircha yangiliklar yo'q</p>
                {user.role === 'super_admin' && (
                  <Button onClick={() => navigate("/admin/news")} variant="outline" size="sm">
                    Yangilik qo'shish
                  </Button>
                )}
                {user.role === 'blogger' && (
                  <Button onClick={() => navigate("/upload")} variant="outline" size="sm">
                    Yangilik qo'shish
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 pb-20">
                {userNewsPosts.map((post) => (
                  <div
                    key={post.id}
                    className="relative aspect-square group bg-zinc-100 dark:bg-zinc-900 overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    {post.mediaUrl ? (
                      post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} className="h-full w-full object-cover" />
                      ) : (
                        <img
                          src={post.mediaUrl}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          alt="news content"
                        />
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
                    <img src={product.images[0]} className="h-full w-full object-cover group-hover:scale-110 transition-transform" loading="lazy" decoding="async" />
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
        </Tabs >
      </main >
    </div >
  );
}

