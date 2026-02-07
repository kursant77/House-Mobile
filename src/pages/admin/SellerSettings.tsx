import { useState } from "react";
import { Store, Bell, Lock, CreditCard, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SellerSettings() {
    const [notifications, setNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);

    return (
        <div className="space-y-6">
            <Helmet>
                <title>Sozlamalar - House Mobile</title>
            </Helmet>

            <div>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Do'kon Sozlamalari
                </h1>
                <p className="text-muted-foreground mt-1">Profilingiz va do'koningizni boshqaring</p>
            </div>

            <Tabs defaultValue="store" className="space-y-4">
                <TabsList className="bg-muted/50">
                    <TabsTrigger value="store">
                        <Store className="mr-2 h-4 w-4" />
                        Do'kon
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                        <Bell className="mr-2 h-4 w-4" />
                        Bildirishnomalar
                    </TabsTrigger>
                    <TabsTrigger value="payments">
                        <CreditCard className="mr-2 h-4 w-4" />
                        To'lovlar
                    </TabsTrigger>
                    <TabsTrigger value="policies">
                        <FileText className="mr-2 h-4 w-4" />
                        Siyosat
                    </TabsTrigger>
                </TabsList>

                {/* Store Settings */}
                <TabsContent value="store" className="space-y-4">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Do'kon ma'lumotlari</CardTitle>
                            <CardDescription>Do'kon nomi va tavsifini tahrirlang</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="storeName">Do'kon nomi</Label>
                                <Input id="storeName" placeholder="Do'kon nomingiz" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="storeDescription">Tavsif</Label>
                                <Textarea
                                    id="storeDescription"
                                    placeholder="Do'koningiz haqida qisqacha ma'lumot"
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="storePhone">Telefon raqam</Label>
                                <Input id="storePhone" placeholder="+998 XX XXX XX XX" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="storeAddress">Manzil</Label>
                                <Input id="storeAddress" placeholder="Do'kon manzili" />
                            </div>
                            <Button className="bg-gradient-to-r from-primary to-blue-600">
                                Saqlash
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Settings */}
                <TabsContent value="notifications" className="space-y-4">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Bildirishnoma sozlamalari</CardTitle>
                            <CardDescription>Qanday bildirishnomalarni olishni tanlang</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Push bildirishnomalar</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Yangi buyurtmalar haqida darhol xabardor bo'ling
                                    </p>
                                </div>
                                <Switch checked={notifications} onCheckedChange={setNotifications} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Email bildirishnomalar</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Kunlik hisobotlarni email orqali oling
                                    </p>
                                </div>
                                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                            </div>
                            <Separator />
                            <Button className="bg-gradient-to-r from-primary to-blue-600">
                                Saqlash
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payment Settings */}
                <TabsContent value="payments" className="space-y-4">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>To'lov sozlamalari</CardTitle>
                            <CardDescription>Bank hisob ma'lumotlari</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Bank nomi</Label>
                                <Input id="bankName" placeholder="Masalan: Ipoteka Bank" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber">Hisob raqami</Label>
                                <Input id="accountNumber" placeholder="XXXX XXXX XXXX XXXX" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountName">Hisob egasi</Label>
                                <Input id="accountName" placeholder="To'liq ism" />
                            </div>
                            <Button className="bg-gradient-to-r from-primary to-blue-600">
                                Saqlash
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Policies */}
                <TabsContent value="policies" className="space-y-4">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Qaytarish siyosati</CardTitle>
                            <CardDescription>Mahsulot qaytarish va almashtirishqoidalari</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Qaytarish siyosatingizni yozing..."
                                rows={6}
                            />
                            <Button className="bg-gradient-to-r from-primary to-blue-600">
                                Saqlash
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Yetkazib berish shartlari</CardTitle>
                            <CardDescription>Yetkazib berish vaqti va narxlari</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Yetkazib berish shartlarini yozing..."
                                rows={6}
                            />
                            <Button className="bg-gradient-to-r from-primary to-blue-600">
                                Saqlash
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
