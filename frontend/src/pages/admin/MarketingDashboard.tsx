import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Users,
    Zap,
    Bot,
    TrendingUp,
    Trophy,
    Film,
    Shield,
    Settings2,
    Sparkles,
    ArrowRight,
    ExternalLink,
    Gift
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";
import { referralService } from "@/services/api/referral";
import { storiesService } from "@/services/api/stories";
import { badgesService } from "@/services/api/badges";
import { contentModerationService } from "@/services/api/contentModeration";
import { featureFlagsService } from "@/services/api/featureFlags";
import { marketingService } from "@/services/api/marketing";
import { supabase } from "@/lib/supabase";

export default function MarketingDashboard() {
    // Referral stats
    const { data: referralStats } = useQuery({
        queryKey: ["admin-referral-stats"],
        queryFn: async () => {
            const topReferrers = await referralService.getTopReferrers(5);
            const allReferrals = await referralService.getAllReferrals();
            return {
                topReferrers,
                total: allReferrals.length,
                pending: allReferrals.filter(r => r.status === 'registered').length,
                completed: allReferrals.filter(r => r.status === 'completed').length
            };
        }
    });

    // Stories stats
    const { data: storiesStats } = useQuery({
        queryKey: ["admin-stories-stats"],
        queryFn: () => storiesService.getStoryStats()
    });

    // Badges stats
    const { data: badgesStats } = useQuery({
        queryKey: ["admin-badges-stats"],
        queryFn: () => badgesService.getBadgeStats()
    });

    // Moderation stats
    const { data: moderationStats } = useQuery({
        queryKey: ["admin-moderation-stats"],
        queryFn: () => contentModerationService.getReportStats()
    });

    // Feature flags
    const { data: featureFlags = [] } = useQuery({
        queryKey: ["admin-feature-flags"],
        queryFn: () => featureFlagsService.getAllFlags()
    });

    // General Marketing Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["admin-marketing-stats"],
        queryFn: () => marketingService.getMarketingStats()
    });

    const enabledFlagsCount = featureFlags.filter(f => f.is_enabled).length;

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Marketing Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Ekosistema o'sishi va faollik statistikasi
                    </p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Jami Referallar</CardTitle>
                        <Sparkles className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{referralStats?.total || 0}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                            {referralStats?.completed || 0} ta bajarilgan
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Telegram Bot</CardTitle>
                        <Bot className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalBotUsers || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ulangan foydalanuvchilar
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Faol Hikoyalar</CardTitle>
                        <Film className="h-4 w-4 text-pink-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{storiesStats?.activeCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {storiesStats?.totalViews || 0} ta ko'rilgan
                        </p>
                    </CardContent>
                </Card>

                <Card className={stats?.pendingModeration > 0 ? "border-amber-500" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Moderatsiya</CardTitle>
                        <Shield className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {stats?.pendingModeration || 0}
                            {stats?.pendingModeration > 0 && (
                                <Badge variant="destructive" className="text-[10px]">
                                    Yangi
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Kutilayotgan hisobotlar
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link to="/admin/feature-flags" className="block">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Settings2 className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">Feature Flags</p>
                                <p className="text-sm text-muted-foreground">
                                    {enabledFlagsCount}/{featureFlags.length} yoqilgan
                                </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/admin/badges" className="block">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-500/10">
                                <Trophy className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">Badges</p>
                                <p className="text-sm text-muted-foreground">
                                    Gamifikatsiya boshqaruvi
                                </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/admin/moderation" className="block">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/10">
                                <Shield className="h-6 w-6 text-purple-500" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">Moderatsiya</p>
                                <p className="text-sm text-muted-foreground">
                                    Kontent nazorati
                                </p>
                            </div>
                            {moderationStats?.pending > 0 && (
                                <Badge variant="destructive">{moderationStats.pending}</Badge>
                            )}
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/admin/push" className="block">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Zap className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">Push bildirishnomalar</p>
                                <p className="text-sm text-muted-foreground">
                                    {stats?.pushCampaigns || 0} ta kampaniya
                                </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </Link>

                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/20">
                            <Gift className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">Referal tizimi</p>
                            <p className="text-sm text-muted-foreground">
                                {stats?.totalReferrals || 0} ta referral
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Sections */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Top Referrers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            Top Referallar
                        </CardTitle>
                        <CardDescription>
                            Eng ko'p taklif qilgan foydalanuvchilar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {referralStats?.topReferrers?.length > 0 ? (
                                referralStats.topReferrers.map((referrer, i) => (
                                    <div key={referrer.user_id || i} className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mr-3 font-bold text-white text-sm">
                                            {i + 1}
                                        </div>
                                        <Avatar className="h-9 w-9 mr-3">
                                            <AvatarImage src={referrer.avatar_url} />
                                            <AvatarFallback>
                                                {referrer.full_name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium leading-none">
                                                {referrer.full_name || 'Foydalanuvchi'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {referrer.referral_count} ta taklif
                                            </p>
                                        </div>
                                        <div className="font-medium text-green-600">
                                            +{formatCurrency(referrer.total_earned || 0)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p>Hali referallar yo'q</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Active Feature Flags */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-primary" />
                            Feature Flags Holati
                        </CardTitle>
                        <CardDescription>
                            Ilovadagi funksiyalar holati
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {featureFlags.slice(0, 6).map(flag => (
                                <div key={flag.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${flag.is_enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span className="text-sm font-medium">{flag.name}</span>
                                    </div>
                                    <Badge variant={flag.is_enabled ? "default" : "secondary"}>
                                        {flag.is_enabled ? 'Yoqilgan' : 'O\'chirilgan'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full mt-4" asChild>
                            <Link to="/admin/feature-flags">
                                Barchasini ko'rish
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Badges Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Badges Statistikasi
                    </CardTitle>
                    <CardDescription>
                        Berilgan badgelar bo'yicha statistika
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {badgesStats?.length > 0 ? (
                            badgesStats.slice(0, 6).map(stat => (
                                <div
                                    key={stat.badge_id}
                                    className="flex flex-col items-center p-4 rounded-xl bg-muted/50 text-center"
                                >
                                    <div className="text-2xl mb-2">🏆</div>
                                    <p className="text-sm font-medium truncate w-full">
                                        {stat.badge_name}
                                    </p>
                                    <p className="text-2xl font-bold text-primary">
                                        {stat.count}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        foydalanuvchi
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-8 text-muted-foreground">
                                <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                <p>Hali badgelar berilmagan</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
