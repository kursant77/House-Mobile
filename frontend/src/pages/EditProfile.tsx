import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/services/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ArrowLeft,
    Camera,
    Loader2,
    User,
    Info,
    Send,
    Instagram,
    Facebook,
    Youtube,
    Globe,
    CheckCircle2
} from "lucide-react";
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

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

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
            try {
                const minimalUser = { id: updatedUser.id, role: updatedUser.role };
                localStorage.setItem("user", JSON.stringify(minimalUser));
            } catch (error) {
                // Silently ignore localStorage errors
            }

            toast.success("Profil muvaffaqiyatli yangilandi");
            navigate("/profile");
        } catch (error: any) {
            toast.error("Saqlashda xatolik: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-background pb-12">
            {/* Background Decorations */}
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.08),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.05),_transparent_40%)]" />

            {/* Header (Desktop + Mobile fallback) */}
            <div className="max-w-4xl mx-auto pt-6 px-4 mb-6">
                <div className="flex items-center justify-between gap-4 py-4 md:py-6 border-b border-border/40">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="h-10 w-10 rounded-xl hover:bg-muted/80 transition-all active:scale-95"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Profilni tahrirlash</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">Shaxsiy ma'lumotlaringizni boshqaring</p>
                        </div>
                    </div>

                    <div className="hidden md:flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => navigate(-1)}
                            className="rounded-xl px-6 h-11 font-medium border-2 hover:bg-muted/50 transition-all active:scale-[0.98]"
                        >
                            Bekor qilish
                        </Button>
                        <Button
                            onClick={() => handleSave()}
                            disabled={isSaving}
                            className="rounded-xl px-8 h-11 font-bold gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Saqlanmoqda...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Saqlash</span>
                                </>
                            )}
                        </Button>
                    </div>

                    <Button
                        size="sm"
                        onClick={() => handleSave()}
                        disabled={isSaving}
                        className="md:hidden rounded-full h-10 px-6 font-bold bg-primary shadow-lg shadow-primary/20"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tayyor"}
                    </Button>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8 md:gap-10">

                    {/* Left Column: Avatar & Quick Info */}
                    <div className="space-y-6">
                        <div className="rounded-[32px] border border-border/60 bg-card/40 backdrop-blur-xl p-8 flex flex-col items-center text-center shadow-xl shadow-black/5">
                            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary/50 to-primary opacity-20 group-hover:opacity-40 blur-md transition-opacity" />
                                <div className="relative rounded-full p-1.5 bg-background border-2 border-primary/20 shadow-inner">
                                    <Avatar className="h-32 w-32 md:h-36 md:w-36">
                                        <AvatarImage src={avatarUrl} className="object-cover" />
                                        <AvatarFallback className="text-4xl bg-primary/5 text-primary font-bold">
                                            {name?.charAt(0) || user.username?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                <button className="absolute bottom-1 right-1 h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-4 border-background shadow-lg group-hover:scale-110 transition-transform active:scale-95">
                                    <Camera className="h-5 w-5" />
                                </button>

                                {isUploading && (
                                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-full flex items-center justify-center z-10 p-2">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <span className="text-[10px] font-bold uppercase tracking-tighter">Yuklanmoqda</span>
                                        </div>
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

                            <div className="mt-6 space-y-1">
                                <h3 className="font-bold text-lg">{name || "Ism kiritilmagan"}</h3>
                                <p className="text-sm text-muted-foreground">@{user.username || "username"}</p>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-6 rounded-full px-5 h-9 text-xs font-semibold border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
                                onClick={handleAvatarClick}
                                disabled={isUploading}
                            >
                                Rasmni o'zgartirish
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Detailed Form */}
                    <div className="space-y-6">
                        <form onSubmit={handleSave} className="space-y-6">

                            {/* General Info Card */}
                            <section className="rounded-[32px] border border-border/60 bg-card/60 backdrop-blur-xl p-6 md:p-8 shadow-xl shadow-black/5">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-lg font-bold">Umumiy ma'lumotlar</h2>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="name" className="text-sm font-semibold ml-1">To'liq ism</Label>
                                        <div className="relative group">
                                            <Input
                                                id="name"
                                                placeholder="Masalan: Alisher Valiyev"
                                                className="h-12 md:h-14 rounded-2xl border-border/60 bg-muted/15 dark:bg-muted/10 px-4 focus-visible:ring-primary/40 focus-visible:border-primary transition-all group-hover:border-border"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label htmlFor="bio" className="text-sm font-semibold ml-1">Bio (Ma'lumot)</Label>
                                        <div className="relative group">
                                            <Textarea
                                                id="bio"
                                                placeholder="O'zingiz haqingizda qisqacha ma'lumot qoldiring..."
                                                className="min-h-[140px] rounded-[24px] border-border/60 bg-muted/15 dark:bg-muted/10 p-4 resize-none transition-all focus-visible:ring-primary/40 focus-visible:border-primary group-hover:border-border leading-relaxed"
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                            />
                                            <div className="absolute top-3 right-4">
                                                <Info className="h-4 w-4 text-muted-foreground/40" />
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground ml-1">Maksimum 300 ta belgi</p>
                                    </div>
                                </div>
                            </section>

                            {/* Social Networks Card */}
                            <section className="rounded-[32px] border border-border/60 bg-card/60 backdrop-blur-xl p-6 md:p-8 shadow-xl shadow-black/5">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-lg font-bold">Ijtimoiy tarmoqlar</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="telegram" className="text-sm font-semibold ml-1 flex items-center gap-2">
                                            <Send className="h-3.5 w-3.5 text-sky-500" /> Telegram
                                        </Label>
                                        <Input
                                            id="telegram"
                                            placeholder="@username"
                                            className="h-12 rounded-2xl border-border/60 bg-muted/15 dark:bg-muted/10 focus-visible:ring-sky-400/40 focus-visible:border-sky-400 group-hover:border-border"
                                            value={telegram}
                                            onChange={(e) => setTelegram(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label htmlFor="instagram" className="text-sm font-semibold ml-1 flex items-center gap-2">
                                            <Instagram className="h-3.5 w-3.5 text-pink-500" /> Instagram
                                        </Label>
                                        <Input
                                            id="instagram"
                                            placeholder="username"
                                            className="h-12 rounded-2xl border-border/60 bg-muted/15 dark:bg-muted/10 focus-visible:ring-pink-400/40 focus-visible:border-pink-400 group-hover:border-border"
                                            value={instagram}
                                            onChange={(e) => setInstagram(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label htmlFor="youtube" className="text-sm font-semibold ml-1 flex items-center gap-2">
                                            <Youtube className="h-3.5 w-3.5 text-red-500" /> YouTube
                                        </Label>
                                        <Input
                                            id="youtube"
                                            placeholder="YouTube linki"
                                            className="h-12 rounded-2xl border-border/60 bg-muted/15 dark:bg-muted/10 focus-visible:ring-red-400/40 focus-visible:border-red-400 group-hover:border-border"
                                            value={youtube}
                                            onChange={(e) => setYoutube(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label htmlFor="facebook" className="text-sm font-semibold ml-1 flex items-center gap-2">
                                            <Facebook className="h-3.5 w-3.5 text-blue-600" /> Facebook
                                        </Label>
                                        <Input
                                            id="facebook"
                                            placeholder="Facebook linki"
                                            className="h-12 rounded-2xl border-border/60 bg-muted/15 dark:bg-muted/10 focus-visible:ring-blue-400/40 focus-visible:border-blue-400 group-hover:border-border"
                                            value={facebook}
                                            onChange={(e) => setFacebook(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Mobile Save Actions */}
                            <div className="md:hidden pt-4 pb-12 space-y-3">
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full h-14 rounded-2xl font-bold gap-2 text-lg shadow-xl shadow-primary/20"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Saqlanmoqda...</span>
                                        </>
                                    ) : (
                                        "O'zgarishlarni saqlash"
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(-1)}
                                    className="w-full h-14 rounded-2xl font-semibold border-2 bg-background/50"
                                >
                                    Bekor qilish
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

