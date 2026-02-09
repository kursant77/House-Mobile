import { useState, useEffect } from "react";
import { badgesService } from "@/services/api/badges";
import { Badge as BadgeType, UserBadge } from "@/types/marketing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Trophy,
    Plus,
    Edit2,
    Users,
    RefreshCw,
    Star,
    ShoppingCart,
    MessageSquare,
    Zap,
    Award
} from "lucide-react";
import { toast } from "sonner";

const CRITERIA_TYPES = [
    { value: 'order_count', label: "Buyurtmalar soni", icon: ShoppingCart },
    { value: 'review_count', label: "Sharhlar soni", icon: MessageSquare },
    { value: 'account_age_days', label: "Hisob yoshi (kun)", icon: Star },
    { value: 'sales_count', label: "Sotuvlar soni", icon: Zap },
    { value: 'manual', label: "Qo'lda berish", icon: Award }
];

const DEFAULT_COLORS = [
    '#FFD700', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722',
    '#00BCD4', '#E91E63', '#607D8B', '#795548', '#3F51B5'
];

export default function BadgesAdmin() {
    const [badges, setBadges] = useState<BadgeType[]>([]);
    const [stats, setStats] = useState<Array<{ badge_id: string; badge_name: string; count: number }>>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        name_uz: '',
        description: '',
        description_uz: '',
        icon_url: '🏆',
        color: '#FFD700',
        criteria_type: 'manual',
        criteria_value: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [badgesData, statsData] = await Promise.all([
                badgesService.getAllBadges(),
                badgesService.getBadgeStats()
            ]);
            setBadges(badgesData);
            setStats(statsData);
        } catch (error) {
            console.error("Error loading badges:", error);
            toast.error("Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setFormData({
            name: '',
            name_uz: '',
            description: '',
            description_uz: '',
            icon_url: '🏆',
            color: '#FFD700',
            criteria_type: 'manual',
            criteria_value: ''
        });
    }

    function openEditDialog(badge: BadgeType) {
        setEditingBadge(badge);
        setFormData({
            name: badge.name,
            name_uz: badge.name_uz || '',
            description: badge.description || '',
            description_uz: badge.description_uz || '',
            icon_url: badge.icon_url || '🏆',
            color: badge.color,
            criteria_type: badge.criteria?.type || 'manual',
            criteria_value: badge.criteria?.value?.toString() || ''
        });
    }

    async function handleSave() {
        if (!formData.name) {
            toast.error("Nom kiritish shart");
            return;
        }

        setSaving(true);
        try {
            const badgeData = {
                name: formData.name,
                name_uz: formData.name_uz || undefined,
                description: formData.description || undefined,
                description_uz: formData.description_uz || undefined,
                icon_url: formData.icon_url,
                color: formData.color,
                criteria: formData.criteria_type === 'manual' ? undefined : {
                    type: formData.criteria_type as any,
                    value: parseInt(formData.criteria_value) || null
                }
            };

            if (editingBadge) {
                await badgesService.updateBadge(editingBadge.id, badgeData);
                toast.success("Badge yangilandi");
            } else {
                await badgesService.createBadge(badgeData);
                toast.success("Badge yaratildi");
            }

            setIsCreateOpen(false);
            setEditingBadge(null);
            resetForm();
            loadData();
        } catch (error) {
            console.error("Error saving badge:", error);
            toast.error("Saqlashda xato");
        } finally {
            setSaving(false);
        }
    }

    async function handleToggle(badge: BadgeType) {
        try {
            await badgesService.toggleBadge(badge.id, !badge.is_active);
            setBadges(prev => prev.map(b =>
                b.id === badge.id ? { ...b, is_active: !b.is_active } : b
            ));
            toast.success(badge.is_active ? "Badge o'chirildi" : "Badge yoqildi");
        } catch (error) {
            toast.error("O'zgartirishda xato");
        }
    }

    function getBadgeCount(badgeId: string): number {
        return stats.find(s => s.badge_id === badgeId)?.count || 0;
    }

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-10 w-64 bg-muted animate-pulse rounded" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-amber-500" />
                        Badges boshqaruvi
                    </h1>
                    <p className="text-muted-foreground">
                        Gamifikatsiya nishonlarini yarating va boshqaring
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={loadData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Yangilash
                    </Button>
                    <Dialog open={isCreateOpen || !!editingBadge} onOpenChange={(open) => {
                        if (!open) {
                            setIsCreateOpen(false);
                            setEditingBadge(null);
                            resetForm();
                        } else {
                            setIsCreateOpen(true);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Yangi badge
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingBadge ? "Badge tahrirlash" : "Yangi badge yaratish"}
                                </DialogTitle>
                                <DialogDescription>
                                    Foydalanuvchilar uchun yangi nishon yarating
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                {/* Preview */}
                                <div className="flex justify-center mb-4">
                                    <div
                                        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                                        style={{ backgroundColor: formData.color + '20', border: `3px solid ${formData.color}` }}
                                    >
                                        {formData.icon_url}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nom (EN)</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                            placeholder="Expert Buyer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nom (UZ)</Label>
                                        <Input
                                            value={formData.name_uz}
                                            onChange={e => setFormData(p => ({ ...p, name_uz: e.target.value }))}
                                            placeholder="Ekspert Xaridor"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Icon (emoji)</Label>
                                        <Input
                                            value={formData.icon_url}
                                            onChange={e => setFormData(p => ({ ...p, icon_url: e.target.value }))}
                                            placeholder="🏆"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Rang</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={formData.color}
                                                onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                                                className="w-12 h-10 p-1 cursor-pointer"
                                            />
                                            <div className="flex gap-1">
                                                {DEFAULT_COLORS.slice(0, 5).map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        className="w-6 h-6 rounded-full border-2 border-white shadow"
                                                        style={{ backgroundColor: color }}
                                                        onClick={() => setFormData(p => ({ ...p, color }))}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tavsif</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Badge haqida qisqacha tavsif..."
                                        rows={2}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Mezon turi</Label>
                                        <Select
                                            value={formData.criteria_type}
                                            onValueChange={v => setFormData(p => ({ ...p, criteria_type: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CRITERIA_TYPES.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {formData.criteria_type !== 'manual' && (
                                        <div className="space-y-2">
                                            <Label>Mezon qiymati</Label>
                                            <Input
                                                type="number"
                                                value={formData.criteria_value}
                                                onChange={e => setFormData(p => ({ ...p, criteria_value: e.target.value }))}
                                                placeholder="10"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                    setIsCreateOpen(false);
                                    setEditingBadge(null);
                                    resetForm();
                                }}>
                                    Bekor qilish
                                </Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? "Saqlanmoqda..." : "Saqlash"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold">{badges.length}</p>
                        <p className="text-sm text-muted-foreground">Jami badgelar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold">{badges.filter(b => b.is_active).length}</p>
                        <p className="text-sm text-muted-foreground">Faol</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold">{stats.reduce((sum, s) => sum + s.count, 0)}</p>
                        <p className="text-sm text-muted-foreground">Berilgan badgelar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold">
                            {badges.filter(b => b.criteria?.type !== 'manual').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Avtomatik</p>
                    </CardContent>
                </Card>
            </div>

            {/* Badges Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {badges.map(badge => (
                    <Card
                        key={badge.id}
                        className={`transition-opacity ${!badge.is_active ? 'opacity-60' : ''}`}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                                        style={{
                                            backgroundColor: badge.color + '20',
                                            border: `2px solid ${badge.color}`
                                        }}
                                    >
                                        {badge.icon_url || '🏆'}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{badge.name}</CardTitle>
                                        {badge.name_uz && (
                                            <p className="text-sm text-muted-foreground">{badge.name_uz}</p>
                                        )}
                                    </div>
                                </div>
                                <Switch
                                    checked={badge.is_active}
                                    onCheckedChange={() => handleToggle(badge)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {badge.description && (
                                <CardDescription className="mb-3">
                                    {badge.description}
                                </CardDescription>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        <Users className="w-3 h-3 mr-1" />
                                        {getBadgeCount(badge.id)}
                                    </Badge>
                                    {badge.criteria && badge.criteria.type !== 'manual' && (
                                        <Badge variant="secondary" className="text-xs">
                                            {badge.criteria.type}: {badge.criteria.value}
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(badge)}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {badges.length === 0 && (
                <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Hech qanday badge topilmadi</p>
                        <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Birinchi badge yaratish
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
