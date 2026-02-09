import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function SellerAnalytics() {
    return (
        <div className="space-y-6">
            <Helmet>
                <title>Analitika - House Mobile</title>
            </Helmet>

            <div>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Batafsil Analitika
                </h1>
                <p className="text-muted-foreground mt-1">Kengaytirilgan statistika va hisobotlar</p>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Tez orada</CardTitle>
                    <CardDescription>Ushbu sahifa ishlab chiqilmoqda</CardDescription>
                </CardHeader>
                <CardContent className="py-16 text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-sm text-muted-foreground">
                        Kengaytirilgan analitika vositalari tez orada qo'shiladi
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
