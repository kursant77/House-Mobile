import { useState, useEffect } from "react";
import { featureFlagsService } from "@/services/api/featureFlags";
import { FeatureFlag } from "@/types/marketing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Settings2,
    RefreshCw,
    Power,
    AlertTriangle,
    Sparkles,
    MessageSquare,
    Bell,
    Mic,
    ShoppingCart,
    Trophy,
    Search,
    Film
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";

const FEATURE_ICONS: Record<string, typeof Settings2> = {
    stories: Film,
    referrals: Sparkles,
    telegram_bot: MessageSquare,
    push_notifications: Bell,
    voice_search: Mic,
    one_click_checkout: ShoppingCart,
    gamification: Trophy,
    smart_search: Search
};

export default function FeatureFlags() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    useEffect(() => {
        loadFlags();
    }, []);

    async function loadFlags() {
        setLoading(true);
        try {
            const data = await featureFlagsService.getAllFlags();
            setFlags(data);
        } catch (error) {
            console.error("Error loading flags:", error);
            toast.error("Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    }

    async function handleToggle(flag: FeatureFlag) {
        setToggling(flag.key);
        try {
            await featureFlagsService.toggleFlag(flag.key as any, !flag.is_enabled);
            setFlags(prev => prev.map(f =>
                f.key === flag.key ? { ...f, is_enabled: !f.is_enabled } : f
            ));
            toast.success(
                flag.is_enabled
                    ? `"${flag.name}" o'chirildi`
                    : `"${flag.name}" yoqildi`
            );
        } catch (error) {
            console.error("Error toggling flag:", error);
            toast.error("O'zgartirishda xato");
        } finally {
            setToggling(null);
        }
    }

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-10 w-64 bg-muted animate-pulse rounded" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const enabledCount = flags.filter(f => f.is_enabled).length;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings2 className="w-6 h-6" />
                        Feature Flags
                    </h1>
                    <p className="text-muted-foreground">
                        Ilovadagi funksiyalarni boshqaring
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-sm">
                        {enabledCount}/{flags.length} yoqilgan
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadFlags}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Yangilash
                    </Button>
                </div>
            </div>

            {/* Warning */}
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Ehtiyot bo'ling:</strong> Flaglarni o'zgartirish barcha foydalanuvchilarga darhol ta'sir qiladi.
                    </p>
                </CardContent>
            </Card>

            {/* Flags Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {flags.map(flag => {
                    const Icon = FEATURE_ICONS[flag.key] || Power;

                    return (
                        <Card
                            key={flag.id}
                            className={`transition-all duration-200 ${flag.is_enabled
                                    ? 'border-primary/30 bg-primary/5'
                                    : 'opacity-75'
                                }`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${flag.is_enabled
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground'
                                            }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">
                                                {flag.name}
                                            </CardTitle>
                                            {flag.name_uz && flag.name_uz !== flag.name && (
                                                <p className="text-sm text-muted-foreground">
                                                    {flag.name_uz}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Switch
                                        checked={flag.is_enabled}
                                        onCheckedChange={() => handleToggle(flag)}
                                        disabled={toggling === flag.key}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {flag.description && (
                                    <CardDescription className="text-sm mb-3">
                                        {flag.description}
                                    </CardDescription>
                                )}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="font-mono bg-muted px-2 py-1 rounded">
                                        {flag.key}
                                    </span>
                                    {flag.updated_at && (
                                        <span>
                                            {formatDistanceToNow(new Date(flag.updated_at), {
                                                addSuffix: true,
                                                locale: uz
                                            })}
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Empty state */}
            {flags.length === 0 && (
                <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                        <Settings2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Hech qanday flag topilmadi</p>
                    </div>
                </Card>
            )}
        </div>
    );
}
