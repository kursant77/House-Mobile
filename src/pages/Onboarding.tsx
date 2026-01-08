import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/services/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    description: "",
  });
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    description: "",
  });

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = { firstName: "", lastName: "", description: "" };
    let isValid = true;

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Ism kiritilishi shart";
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Familiya kiritilishi shart";
      isValid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = "Qisqacha ma'lumot kiritilishi shart";
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Kamida 10 belgi kiriting";
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) return;

    setIsLoading(true);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      await authApi.updateProfile({
        name: fullName,
        bio: formData.description.trim(),
      });

      const updatedUser = { ...user, name: fullName, bio: formData.description.trim() };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Mark onboarding as complete
      localStorage.setItem("onboarding_complete", "true");

      toast.success("Profil muvaffaqiyatli yakunlandi!");
      navigate("/profile");
    } catch (error: any) {
      toast.error("Xatolik yuz berdi: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Profilni to'ldiring</h1>
          <p className="text-muted-foreground">
            Profilingizni yakunlash uchun quyidagi ma'lumotlarni kiriting
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              Ism <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Ismingizni kiriting"
              value={formData.firstName}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, firstName: e.target.value }));
                if (errors.firstName) {
                  setErrors(prev => ({ ...prev, firstName: "" }));
                }
              }}
              className={cn(
                "h-12 rounded-xl",
                errors.firstName && "ring-2 ring-destructive"
              )}
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Familiya <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Familiyangizni kiriting"
              value={formData.lastName}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, lastName: e.target.value }));
                if (errors.lastName) {
                  setErrors(prev => ({ ...prev, lastName: "" }));
                }
              }}
              className={cn(
                "h-12 rounded-xl",
                errors.lastName && "ring-2 ring-destructive"
              )}
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Qisqacha ma'lumot <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="O'zingiz haqingizda qisqacha ma'lumot kiriting (kamida 10 belgi)"
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                if (errors.description) {
                  setErrors(prev => ({ ...prev, description: "" }));
                }
              }}
              className={cn(
                "min-h-[120px] rounded-xl resize-none",
                errors.description && "ring-2 ring-destructive"
              )}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl text-base font-semibold gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              <>
                Profilni yakunlash
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
