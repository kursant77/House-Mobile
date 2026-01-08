import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Phone, AtSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/services/api/auth";

type AuthMode = "login" | "register";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const { login, register } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
  });

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      return await authApi.checkUsernameAvailability(username);
    } catch (error) {
      return false;
    }
  };

  const validateForm = async () => {
    const newErrors = { name: "", username: "", phone: "", email: "", password: "" };
    let isValid = true;

    if (mode === "register") {
      if (!formData.name.trim()) {
        newErrors.name = "Ism kiritilishi shart";
        isValid = false;
      }

      if (!formData.username.trim()) {
        newErrors.username = "Username kiritilishi shart";
        isValid = false;
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = "Username faqat harflar, raqamlar va _ belgisidan iborat bo'lishi kerak";
        isValid = false;
      } else if (formData.username.length < 3) {
        newErrors.username = "Username kamida 3 belgidan iborat bo'lishi kerak";
        isValid = false;
      } else {
        setCheckingUsername(true);
        const isAvailable = await checkUsernameAvailability(formData.username);
        setCheckingUsername(false);
        if (!isAvailable) {
          newErrors.username = "Bu username allaqachon olingan";
          isValid = false;
        }
      }

      if (!formData.phone.trim()) {
        newErrors.phone = "Telefon raqam kiritilishi shart";
        isValid = false;
      } else if (!/^\+998\d{9}$/.test(formData.phone) && !/^998\d{9}$/.test(formData.phone) && !/^\d{9}$/.test(formData.phone)) {
        newErrors.phone = "Telefon raqam noto'g'ri formatda (masalan: +998901234567 yoki 998901234567)";
        isValid = false;
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email kiritilishi shart";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email noto'g'ri formatda";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Parol kiritilishi shart";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Parol kamida 6 belgidan iborat bo'lishi kerak";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    setIsLoading(true);

    // Real API call via authStore
    try {
      if (mode === "login") {
        await login(formData.email, formData.password);
        toast.success("Muvaffaqiyatli kirildi!");
        navigate("/");
      } else {
        await register(formData.name, formData.username, formData.phone, formData.email, formData.password);
        toast.success("Hisob muvaffaqiyatli yaratildi!");
        navigate("/profile");
      }
    } catch (error: any) {
      toast.error(error.message || "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setErrors({ name: "", username: "", phone: "", email: "", password: "" });
    setFormData({ name: "", username: "", phone: "", email: "", password: "" });
  };

  const handlePhoneChange = (value: string) => {
    // Auto-format phone number
    let formatted = value.replace(/\D/g, ''); // Remove non-digits
    if (formatted.startsWith('998')) {
      formatted = '+' + formatted;
    } else if (formatted.length > 0 && !formatted.startsWith('998')) {
      formatted = '+998' + formatted;
    }
    if (formatted.length <= 13) {
      handleInputChange("phone", formatted);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Back</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo & Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              House Mobile
            </h1>
            <p className="text-muted-foreground">
              {mode === "login"
                ? "Xush kelibsiz"
                : "Hisob yaratish"}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all",
                mode === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all",
                mode === "register"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field (register only) */}
            {mode === "register" && (
              <>
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="name" className="text-sm font-medium">
                    To'liq ism
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ismingizni kiriting"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={cn(
                        "h-12 pl-10 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary",
                        errors.name && "ring-2 ring-destructive"
                      )}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                {/* Username field (register only) */}
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="username"
                      value={formData.username}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                        handleInputChange("username", value);
                      }}
                      className={cn(
                        "h-12 pl-10 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary",
                        errors.username && "ring-2 ring-destructive"
                      )}
                    />
                    {checkingUsername && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    )}
                  </div>
                  {errors.username && (
                    <p className="text-xs text-destructive">{errors.username}</p>
                  )}
                </div>

                {/* Phone field (register only) */}
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Telefon raqam
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+998901234567"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={cn(
                        "h-12 pl-10 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary",
                        errors.phone && "ring-2 ring-destructive"
                      )}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>
              </>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email manzilingizni kiriting"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={cn(
                    "h-12 pl-10 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary",
                    errors.email && "ring-2 ring-destructive"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Parol
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Parolingizni kiriting"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={cn(
                    "h-12 pl-10 pr-12 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary",
                    errors.password && "ring-2 ring-destructive"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Forgot password (login only) */}
            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-base font-semibold transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : mode === "login" ? (
                "Kirish"
              ) : (
                "Hisob yaratish"
              )}
            </Button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Hisobingiz yo'qmi?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-semibold text-foreground hover:underline"
                >
                  Ro'yxatdan o'tish
                </button>
              </>
            ) : (
              <>
                Allaqachon hisobingiz bormi?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-semibold text-foreground hover:underline"
                >
                  Kirish
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
