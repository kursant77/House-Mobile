import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/services/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function EditProfile() {
    const { user, setUser } = useAuthStore();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState(user?.name || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
    const [telegram, setTelegram] = useState(user?.telegram || "");
    const [instagram, setInstagram] = useState(user?.instagram || "");
    const [facebook, setFacebook] = useState(user?.facebook || "");
    const [youtube, setYoutube] = useState(user?.youtube || "");
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    if (!user) return null;

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Rasm hajmi 5MB dan oshmasligi kerak");
            return;
        }

        try {
            setIsUploading(true);
            const url = await authApi.uploadAvatar(file);
            setAvatarUrl(url);
            toast.success("Rasm yuklandi");
        } catch (error: any) {
            toast.error("Rasm yuklashda xatolik: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Ism kiritilishi shart");
            return;
        }

        try {
            setIsSaving(true);
            await authApi.updateProfile({
                name,
                bio,
                avatarUrl,
                telegram,
                instagram,
                facebook,
                youtube,
            });

            const updatedUser = { ...user, name, bio, avatarUrl, telegram, instagram, facebook, youtube };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));

            toast.success("Profil yangilandi");
            navigate("/profile");
        } catch (error: any) {
            toast.error("Saqlashda xatolik: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 h-14 md:hidden">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="font-bold text-sm">Profilni tahrirlash</h1>
                <Button variant="ghost" size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tayyor"}
                </Button>
            </header>

            <main className="max-w-2xl mx-auto pt-14 md:pt-8 px-4 space-y-8">
                <div className="flex flex-col items-center gap-4 py-6">
                    <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                        <Avatar className="h-24 w-24 border-2 border-primary/20">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback className="text-2xl">{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                        {isUploading && (
                            <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <Button variant="link" size="sm" onClick={handleAvatarClick} disabled={isUploading}>
                        Profil rasmini o'zgartirish
                    </Button>
                </div>

                <form onSubmit={handleSave} className="space-y-6 pb-20">
                    <div className="space-y-2">
                        <Label htmlFor="name">Ism</Label>
                        <Input
                            id="name"
                            placeholder="Foydalanuvchi ismi"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            placeholder="O'zingiz haqingizda qisqacha ma'lumot..."
                            className="resize-none h-32"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>

                    <div className="pt-4 space-y-4">
                        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Ijtimoiy tarmoqlar</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="telegram">Telegram username (masalan: @username)</Label>
                                <Input
                                    id="telegram"
                                    placeholder="@username"
                                    value={telegram}
                                    onChange={(e) => setTelegram(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instagram">Instagram username</Label>
                                <Input
                                    id="instagram"
                                    placeholder="username"
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="youtube">YouTube kanal linki</Label>
                                <Input
                                    id="youtube"
                                    placeholder="https://youtube.com/@channel"
                                    value={youtube}
                                    onChange={(e) => setYoutube(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="facebook">Facebook profil linki</Label>
                                <Input
                                    id="facebook"
                                    placeholder="facebook.com/username"
                                    value={facebook}
                                    onChange={(e) => setFacebook(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex justify-end gap-4 pt-4">
                        <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                            Bekor qilish
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            O'zgarishlarni saqlash
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}
