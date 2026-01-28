import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/services/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, Loader2, ArrowRight, Instagram, Send as SendIcon, Facebook, MapPin, AlignLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    bio: "",
    address: "",
    telegram: "",
    instagram: "",
    facebook: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        username: user.username || "",
        phone: user.phone || "",
        bio: user.bio || "",
        address: user.address || "",
        telegram: user.telegram || "",
        instagram: user.instagram || "",
        facebook: user.facebook || "",
      }));
    } else {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Ism va familiya kiritilishi shart";
      isValid = false;
    }

    if (!formData.bio.trim()) {
      newErrors.bio = "Bio kiritilishi shart";
      isValid = false;
    } else if (formData.bio.trim().length < 5) {
      newErrors.bio = "Kamida 5 belgi kiriting";
      isValid = false;
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username kiritilishi shart";
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefon raqam kiritilishi shart";
      isValid = false;
    }

    if (!formData.address.trim()) {
      newErrors.address = "Manzil kiritilishi shart";
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) return;

    setIsLoading(true);
    try {
      await authApi.updateProfile({
        name: formData.name.trim(),
        username: formData.username.trim(),
        phone: formData.phone.trim(),
        bio: formData.bio.trim(),
        address: formData.address.trim(),
        telegram: formData.telegram.trim(),
        instagram: formData.instagram.trim(),
        facebook: formData.facebook.trim(),
      });

      const updatedUser = {
        ...user!,
        name: formData.name.trim(),
        username: formData.username.trim(),
        phone: formData.phone.trim(),
        bio: formData.bio.trim(),
        address: formData.address.trim(),
        telegram: formData.telegram.trim(),
        instagram: formData.instagram.trim(),
        facebook: formData.facebook.trim(),
      };

      setUser(updatedUser);
      try {
        const minimalUser = { id: updatedUser.id, role: updatedUser.role };
        localStorage.setItem("user", JSON.stringify(minimalUser));
      } catch (error) {
        // Silently ignore localStorage errors
      }
      localStorage.setItem("onboarding_complete", "true");

      toast.success("Profil muvaffaqiyatli yangilandi!");
      navigate("/");
    } catch (error: any) {
      toast.error("Xatolik yuz berdi: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-8 bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Profilingizni sozlang</h1>
          <p className="text-muted-foreground">
            Siz haqingizda ko'proq ma'lumotga ega bo'lishimiz uchun quyidagi maydonlarni to'ldiring
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Required Fields */}
            <div className="space-y-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                <AlignLeft className="h-4 w-4" /> Asosiy ma'lumotlar
              </h2>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Ism va familiya <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Masalan: Ali Valiyev"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={cn("h-11 rounded-xl", errors.name && "border-destructive")}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  placeholder="Masalan: ali_valiyev"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className={cn("h-11 rounded-xl", errors.username && "border-destructive")}
                />
                {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Telefon raqam <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="+998 90 123 45 67"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className={cn("h-11 rounded-xl", errors.phone && "border-destructive")}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Manzil <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="Toshkent, Chilonzor..."
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className={cn("h-11 pl-10 rounded-xl", errors.address && "border-destructive")}
                  />
                </div>
                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium">
                  Bio (O'zingiz haqingizda) <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Qisqacha o'zingiz haqingizda yozing..."
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className={cn("min-h-[100px] rounded-xl resize-none", errors.bio && "border-destructive")}
                />
                {errors.bio && <p className="text-xs text-destructive">{errors.bio}</p>}
              </div>
            </div>

            {/* Social Links (Optional) */}
            <div className="space-y-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                <SendIcon className="h-4 w-4" /> Ijtimoiy tarmoqlar
              </h2>

              <div className="space-y-2">
                <Label htmlFor="telegram" className="text-sm font-medium flex items-center gap-2">
                  Telegram
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</div>
                  <Input
                    id="telegram"
                    placeholder="username"
                    value={formData.telegram}
                    onChange={(e) => setFormData(prev => ({ ...prev, telegram: e.target.value }))}
                    className="h-11 pl-8 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-sm font-medium flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-500" /> Instagram
                </Label>
                <Input
                  id="instagram"
                  placeholder="username"
                  value={formData.instagram}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook" className="text-sm font-medium flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" /> Facebook
                </Label>
                <Input
                  id="facebook"
                  placeholder="profil linki yoki nomi"
                  value={formData.facebook}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-base font-semibold gap-2 shadow-lg hover:shadow-primary/20 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  Saqlash va davom etish
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
