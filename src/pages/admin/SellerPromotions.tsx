import { useState } from "react";
import { Gift, Plus, Percent, Calendar, Tag, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SellerPromotions() {
    return (
        <div className="space-y-6">
            <Helmet>
                <title>Aksiyalar va Marketing - House Mobile</title>
            </Helmet>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Aksiyalar va Marketing
                    </h1>
                    <p className="text-muted-foreground mt-1">Chegirmalar, kuponlar va reklama kampaniyalari</p>
                </div>
                <Button className="rounded-lg font-semibold bg-gradient-to-r from-primary to-blue-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Yangi aksiya
                </Button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 hover:border-primary/50 group">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Percent className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>
                        <h5 className="font-bold text-base mb-1">Chegirma yaratish</h5>
                        <p className="text-xs text-muted-foreground">Mahsulotlarga chegirma qo'shing</p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 hover:border-blue-500/50 group">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Tag className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                        <h5 className="font-bold text-base mb-1">Kupon kodi</h5>
                        <p className="text-xs text-muted-foreground">Promo kod yarating</p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 hover:border-amber-500/50 group">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Zap className="h-6 w-6 text-amber-500" />
                            </div>
                        </div>
                        <h5 className="font-bold text-base mb-1">Flash savdo</h5>
                        <p className="text-xs text-muted-foreground">Muddatli maxsus taklif</p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 hover:border-purple-500/50 group">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                        <h5 className="font-bold text-base mb-1">Reklama kampaniyasi</h5>
                        <p className="text-xs text-muted-foreground">Marketing strategiyasi</p>
                    </CardContent>
                </Card>
            </div>

            {/* Active Promotions */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Faol aksiyalar</CardTitle>
                    <CardDescription>Hozirda davom etayotgan aksiyalar</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-16">
                        <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold mb-2">Hozircha aksiyalar yo'q</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Birinchi aksiyangizni yarating va savdolarni oshiring
                        </p>
                        <Button className="bg-gradient-to-r from-primary to-blue-600">
                            <Plus className="mr-2 h-4 w-4" />
                            Aksiya yaratish
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
