import { useState, useEffect } from "react";
import { marketingService } from "@/services/api/marketing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Gift, Users, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export function ReferralCard() {
    const [stats, setStats] = useState<{ total: number; earnings: number } | null>(null);
    const [link, setLink] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsData, linkData] = await Promise.all([
                    marketingService.getReferralStats(),
                    marketingService.getReferralLink()
                ]);
                setStats(statsData);
                setLink(linkData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(link);
        toast.success("Havola nusxalandi!");
    };

    if (loading) {
        return <Skeleton className="h-48 w-full rounded-xl" />;
    }

    return (
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="h-5 w-5 text-indigo-500" />
                    Do'stlarni taklif qilish
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Do'stlaringizni taklif qiling va har bir xarid uchun bonuslarga ega bo'ling!
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <Users className="h-3.5 w-3.5" />
                            Takliflar
                        </div>
                        <p className="text-xl font-bold">{stats?.total || 0}</p>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <Trophy className="h-3.5 w-3.5" />
                            Daromad
                        </div>
                        <p className="text-xl font-bold text-green-500">
                            {stats?.earnings?.toLocaleString()} so'm
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="bg-background border rounded-lg px-3 py-2 text-sm flex-1 truncate font-mono text-muted-foreground">
                        {link}
                    </div>
                    <Button size="icon" variant="secondary" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
