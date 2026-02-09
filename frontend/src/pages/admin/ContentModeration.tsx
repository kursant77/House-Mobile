import { useState, useEffect } from "react";
import { contentModerationService } from "@/services/api/contentModeration";
import { ContentReport, ContentType, ReportStatus } from "@/types/marketing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Shield,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    MoreVertical,
    Eye,
    Trash2,
    MessageSquare,
    Film,
    Star,
    ShoppingBag,
    User
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";

const CONTENT_ICONS: Record<ContentType, typeof Film> = {
    story: Film,
    reel: Film,
    review: Star,
    product: ShoppingBag,
    comment: MessageSquare,
    user: User
};

const CONTENT_LABELS: Record<ContentType, string> = {
    story: 'Hikoya',
    reel: 'Reel',
    review: 'Sharh',
    product: 'Mahsulot',
    comment: 'Izoh',
    user: 'Foydalanuvchi'
};

const REASON_LABELS: Record<string, string> = {
    spam: 'Spam',
    inappropriate: 'Nomaqbul kontent',
    harassment: 'Bezovta qilish',
    fake: 'Soxta',
    copyright: 'Mualliflik huquqi',
    other: 'Boshqa'
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
    pending: { label: 'Kutilmoqda', color: 'bg-amber-500', icon: AlertTriangle },
    reviewed: { label: 'Ko\'rib chiqildi', color: 'bg-blue-500', icon: Eye },
    resolved: { label: 'Hal qilindi', color: 'bg-green-500', icon: CheckCircle },
    dismissed: { label: 'Rad etildi', color: 'bg-gray-500', icon: XCircle }
};

export default function ContentModeration() {
    const [reports, setReports] = useState<ContentReport[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        resolved: 0,
        dismissed: 0,
        byType: {} as Record<ContentType, number>
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ReportStatus | 'all'>('pending');
    const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
    const [resolveNotes, setResolveNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [reportsData, statsData] = await Promise.all([
                contentModerationService.getAllReports(),
                contentModerationService.getReportStats()
            ]);
            setReports(reportsData.reports);
            setStats(statsData);
        } catch (error) {
            console.error("Error loading reports:", error);
            toast.error("Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    }

    async function handleResolve(report: ContentReport, status: 'resolved' | 'dismissed') {
        setProcessing(true);
        try {
            await contentModerationService.resolveReport(report.id, status, resolveNotes);
            toast.success(status === 'resolved' ? "Hisobot hal qilindi" : "Hisobot rad etildi");
            setSelectedReport(null);
            setResolveNotes('');
            loadData();
        } catch (error) {
            toast.error("Xatolik yuz berdi");
        } finally {
            setProcessing(false);
        }
    }

    async function handleDeleteContent(report: ContentReport) {
        if (!confirm("Kontentni o'chirishni tasdiqlaysizmi?")) return;

        setProcessing(true);
        try {
            await contentModerationService.deleteContentAndResolve(
                report.content_type,
                report.content_id,
                "Kontent o'chirildi"
            );
            toast.success("Kontent o'chirildi va hisobot hal qilindi");
            loadData();
        } catch (error) {
            toast.error("O'chirishda xato");
        } finally {
            setProcessing(false);
        }
    }

    const filteredReports = activeTab === 'all'
        ? reports
        : reports.filter(r => r.status === activeTab);

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-10 w-64 bg-muted animate-pulse rounded" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
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
                        <Shield className="w-6 h-6 text-primary" />
                        Kontent moderatsiyasi
                    </h1>
                    <p className="text-muted-foreground">
                        Foydalanuvchilar shikoyatlarini ko'rib chiqing
                    </p>
                </div>
                <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Yangilash
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                                <p className="text-sm text-muted-foreground">Kutilmoqda</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.resolved}</p>
                                <p className="text-sm text-muted-foreground">Hal qilindi</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <XCircle className="w-8 h-8 text-gray-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.dismissed}</p>
                                <p className="text-sm text-muted-foreground">Rad etildi</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Shield className="w-8 h-8 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Jami shikoyatlar</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content Type Breakdown */}
            {Object.keys(stats.byType).length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Kontent turi bo'yicha</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(stats.byType).map(([type, count]) => {
                                const Icon = CONTENT_ICONS[type as ContentType] || Shield;
                                return (
                                    <Badge key={type} variant="secondary" className="px-3 py-1">
                                        <Icon className="w-3 h-3 mr-1" />
                                        {CONTENT_LABELS[type as ContentType] || type}: {count}
                                    </Badge>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reports List */}
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
                <TabsList>
                    <TabsTrigger value="pending" className="relative">
                        Kutilmoqda
                        {stats.pending > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {stats.pending}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="reviewed">Ko'rib chiqildi</TabsTrigger>
                    <TabsTrigger value="resolved">Hal qilindi</TabsTrigger>
                    <TabsTrigger value="dismissed">Rad etildi</TabsTrigger>
                    <TabsTrigger value="all">Hammasi</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4 space-y-3">
                    {filteredReports.length === 0 ? (
                        <Card className="p-12">
                            <div className="text-center text-muted-foreground">
                                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Shikoyatlar topilmadi</p>
                            </div>
                        </Card>
                    ) : (
                        filteredReports.map(report => (
                            <ReportCard
                                key={report.id}
                                report={report}
                                onResolve={() => setSelectedReport(report)}
                                onDelete={() => handleDeleteContent(report)}
                            />
                        ))
                    )}
                </TabsContent>
            </Tabs>

            {/* Resolve Dialog */}
            <Dialog open={!!selectedReport} onOpenChange={() => {
                setSelectedReport(null);
                setResolveNotes('');
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Shikoyatni ko'rib chiqish</DialogTitle>
                        <DialogDescription>
                            {selectedReport && CONTENT_LABELS[selectedReport.content_type]} haqida shikoyat
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm font-medium mb-1">Sabab:</p>
                                <p className="text-muted-foreground">{REASON_LABELS[selectedReport.reason]}</p>
                                {selectedReport.details && (
                                    <>
                                        <p className="text-sm font-medium mt-3 mb-1">Tafsilotlar:</p>
                                        <p className="text-muted-foreground">{selectedReport.details}</p>
                                    </>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Qaror izohi (ixtiyoriy):</p>
                                <Textarea
                                    value={resolveNotes}
                                    onChange={e => setResolveNotes(e.target.value)}
                                    placeholder="Qaror haqida izoh..."
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => selectedReport && handleResolve(selectedReport, 'dismissed')}
                            disabled={processing}
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rad etish
                        </Button>
                        <Button
                            onClick={() => selectedReport && handleResolve(selectedReport, 'resolved')}
                            disabled={processing}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Hal qilish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ReportCard({
    report,
    onResolve,
    onDelete
}: {
    report: ContentReport;
    onResolve: () => void;
    onDelete: () => void;
}) {
    const Icon = CONTENT_ICONS[report.content_type] || Shield;
    const statusConfig = STATUS_CONFIG[report.status];
    const StatusIcon = statusConfig.icon;

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* Reporter Avatar */}
                    <Avatar>
                        <AvatarImage src={report.reporter?.avatar_url} />
                        <AvatarFallback>
                            {report.reporter?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                                {report.reporter?.full_name || 'Noma\'lum'}
                            </span>
                            <span className="text-muted-foreground text-sm">
                                •
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(report.created_at), {
                                    addSuffix: true,
                                    locale: uz
                                })}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                                <Icon className="w-3 h-3 mr-1" />
                                {CONTENT_LABELS[report.content_type]}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                {REASON_LABELS[report.reason]}
                            </Badge>
                        </div>

                        {report.details && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {report.details}
                            </p>
                        )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2">
                        <Badge className={`${statusConfig.color} text-white`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                        </Badge>

                        {report.status === 'pending' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={onResolve}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Ko'rib chiqish
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={onDelete}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Kontentni o'chirish
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
