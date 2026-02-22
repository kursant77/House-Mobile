import { useState, useEffect } from "react";
import { Store, Bell, Lock, CreditCard, FileText, Shield, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const SETTINGS_STORAGE_KEY = "seller_settings";

interface SellerLocalSettings {
    notifications: boolean;
    emailNotifications: boolean;
    bankName: string;
    accountNumber: string;
    accountName: string;
    returnPolicy: string;
    deliveryTerms: string;
}

const defaultLocalSettings: SellerLocalSettings = {
    notifications: true,
    emailNotifications: true,
    bankName: "",
    accountNumber: "",
    accountName: "",
    returnPolicy: "",
    deliveryTerms: "",
};

function loadLocalSettings(): SellerLocalSettings {
    try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) return { ...defaultLocalSettings, ...JSON.parse(stored) };
    } catch { }
    return defaultLocalSettings;
}

function saveLocalSettings(settings: SellerLocalSettings) {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export default function SellerSettings() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile fields (from Supabase)
    const [storeName, setStoreName] = useState("");
    const [storeDescription, setStoreDescription] = useState("");
    const [storePhone, setStorePhone] = useState("");
    const [storeAddress, setStoreAddress] = useState("");

    // Local settings
    const [localSettings, setLocalSettings] = useState<SellerLocalSettings>(defaultLocalSettings);

    // Load profile data on mount
    useEffect(() => {
        if (!user) return;

        const loadProfile = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name, bio, address, telegram')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    setStoreName(data.full_name || "");
                    setStoreDescription(data.bio || "");
                    setStoreAddress(data.address || "");
                    setStorePhone(data.telegram || "");
                }
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setLoading(false);
            }

            // Load local settings
            setLocalSettings(loadLocalSettings());
        };

        loadProfile();
    }, [user]);

    // Save profile to Supabase
    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: storeName.trim(),
                    bio: storeDescription.trim(),
                    address: storeAddress.trim(),
                    telegram: storePhone.trim(),
                })
                .eq('id', user.id);

            if (error) throw error;
            toast.success("Do'kon ma'lumotlari saqlandi");
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("Saqlashda xatolik yuz berdi");
        } finally {
            setSaving(false);
        }
    };

    // Save notification settings to localStorage
    const handleSaveNotifications = () => {
        const updated = { ...localSettings };
        saveLocalSettings(updated);
        toast.success("Bildirishnoma sozlamalari saqlandi");
    };

    // Save payment settings to localStorage
    const handleSavePayment = () => {
        saveLocalSettings(localSettings);
        toast.success("To'lov ma'lumotlari saqlandi");
    };

    // Save policies to localStorage
    const handleSavePolicies = () => {
        saveLocalSettings(localSettings);
        toast.success("Siyosat saqlandi");
    };

    const updateLocal = (key: keyof SellerLocalSettings, value: any) => {
        setLocalSettings(prev => {
            const updated = { ...prev, [key]: value };
            return updated;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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

                {/* Store Settings — REAL Supabase save */}
                <TabsContent value="store" className="space-y-4">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Do'kon ma'lumotlari</CardTitle>
                            <CardDescription>Do'kon nomi va tavsifini tahrirlang</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="storeName">Do'kon nomi</Label>
                                <Input
                                    id="storeName"
                                    placeholder="Do'kon nomingiz"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="storeDescription">Tavsif</Label>
                                <Textarea
                                    id="storeDescription"
                                    placeholder="Do'koningiz haqida qisqacha ma'lumot"
                                    rows={4}
                                    value={storeDescription}
                                    onChange={(e) => setStoreDescription(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="storePhone">Telefon raqam</Label>
                                <Input
                                    id="storePhone"
                                    placeholder="+998 XX XXX XX XX"
                                    value={storePhone}
                                    onChange={(e) => setStorePhone(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="storeAddress">Manzil</Label>
                                <Input
                                    id="storeAddress"
                                    placeholder="Do'kon manzili"
                                    value={storeAddress}
                                    onChange={(e) => setStoreAddress(e.target.value)}
                                />
                            </div>
                            <Button
                                className="bg-gradient-to-r from-primary to-blue-600"
                                onClick={handleSaveProfile}
                                disabled={saving}
                            >
                                {saving ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saqlanmoqda...</>
                                ) : (
                                    <><Check className="mr-2 h-4 w-4" /> Saqlash</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Settings — localStorage */}
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
                                <Switch
                                    checked={localSettings.notifications}
                                    onCheckedChange={(v) => updateLocal('notifications', v)}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Email bildirishnomalar</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Kunlik hisobotlarni email orqali oling
                                    </p>
                                </div>
                                <Switch
                                    checked={localSettings.emailNotifications}
                                    onCheckedChange={(v) => updateLocal('emailNotifications', v)}
                                />
                            </div>
                            <Separator />
                            <Button
                                className="bg-gradient-to-r from-primary to-blue-600"
                                onClick={handleSaveNotifications}
                            >
                                <Check className="mr-2 h-4 w-4" /> Saqlash
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payment Settings — localStorage */}
                <TabsContent value="payments" className="space-y-4">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>To'lov sozlamalari</CardTitle>
                            <CardDescription>Bank hisob ma'lumotlari</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Bank nomi</Label>
                                <Input
                                    id="bankName"
                                    placeholder="Masalan: Ipoteka Bank"
                                    value={localSettings.bankName}
                                    onChange={(e) => updateLocal('bankName', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber">Hisob raqami</Label>
                                <Input
                                    id="accountNumber"
                                    placeholder="XXXX XXXX XXXX XXXX"
                                    value={localSettings.accountNumber}
                                    onChange={(e) => updateLocal('accountNumber', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountName">Hisob egasi</Label>
                                <Input
                                    id="accountName"
                                    placeholder="To'liq ism"
                                    value={localSettings.accountName}
                                    onChange={(e) => updateLocal('accountName', e.target.value)}
                                />
                            </div>
                            <Button
                                className="bg-gradient-to-r from-primary to-blue-600"
                                onClick={handleSavePayment}
                            >
                                <Check className="mr-2 h-4 w-4" /> Saqlash
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Policies — localStorage */}
                <TabsContent value="policies" className="space-y-4">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Qaytarish siyosati</CardTitle>
                            <CardDescription>Mahsulot qaytarish va almashtirish qoidalari</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Qaytarish siyosatingizni yozing..."
                                rows={6}
                                value={localSettings.returnPolicy}
                                onChange={(e) => updateLocal('returnPolicy', e.target.value)}
                            />
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
                                value={localSettings.deliveryTerms}
                                onChange={(e) => updateLocal('deliveryTerms', e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    <Button
                        className="bg-gradient-to-r from-primary to-blue-600"
                        onClick={handleSavePolicies}
                    >
                        <Check className="mr-2 h-4 w-4" /> Barchasini saqlash
                    </Button>
                </TabsContent>
            </Tabs>
        </div>
    );
}
