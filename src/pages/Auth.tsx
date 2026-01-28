import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Phone, AtSign, CheckCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/services/api/auth";
import { handleError } from "@/lib/errorHandler";
import { loginSchema, registerSchema } from "@/lib/validation";
import { sanitizeEmail, sanitizePhone, sanitizeUsername } from "@/lib/sanitize";

type AuthMode = "login" | "register" | "forgot-password" | "reset-password";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const { login, register } = useAuthStore();

  // Check for reset password mode from URL
  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "reset-password") {
      setMode("reset-password");
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      return await authApi.checkUsernameAvailability(username);
    } catch (error) {
      return false;
    }
  };

  const validateForm = async () => {
    const newErrors = { name: "", username: "", phone: "", email: "", password: "", confirmPassword: "" };
    let isValid = true;

    try {
      if (mode === "register") {
        // Sanitize inputs
        const sanitizedData = {
          name: formData.name.trim(),
          username: sanitizeUsername(formData.username),
          phone: sanitizePhone(formData.phone),
          email: sanitizeEmail(formData.email),
          password: formData.password,
        };

        // Validate with Zod
        const result = registerSchema.safeParse(sanitizedData);
        
        if (!result.success) {
          result.error.errors.forEach((err) => {
            const field = err.path[0] as keyof typeof newErrors;
            if (field in newErrors) {
              newErrors[field] = err.message;
            }
          });
          isValid = false;
        } else {
          // Check username availability
          setCheckingUsername(true);
          const isAvailable = await checkUsernameAvailability(sanitizedData.username);
          setCheckingUsername(false);
          if (!isAvailable) {
            newErrors.username = "Bu username allaqachon olingan";
            isValid = false;
          }
        }
      } else if (mode === "login") {
        // Login validation
        const sanitizedData = {
          email: sanitizeEmail(formData.email),
          password: formData.password,
        };

        const result = loginSchema.safeParse(sanitizedData);
        
        if (!result.success) {
          result.error.errors.forEach((err) => {
            const field = err.path[0] as keyof typeof newErrors;
            if (field in newErrors) {
              newErrors[field] = err.message;
            }
          });
          isValid = false;
        }
      } else if (mode === "forgot-password") {
        // Forgot password validation
        if (!formData.email || !formData.email.includes("@")) {
          newErrors.email = "To'g'ri email manzilini kiriting";
          isValid = false;
        }
      } else if (mode === "reset-password") {
        // Reset password validation
        if (!formData.password || formData.password.length < 6) {
          newErrors.password = "Parol kamida 6 ta belgidan iborat bo'lishi kerak";
          isValid = false;
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Parollar mos kelmaydi";
          isValid = false;
        }
      }
    } catch (error) {
      // Validation error is handled by toast
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
      } else if (mode === "register") {
        await register(formData.name, formData.username, formData.phone, formData.email, formData.password);
        toast.success("Hisob muvaffaqiyatli yaratildi!");
        navigate("/profile");
      } else if (mode === "forgot-password") {
        await authApi.resetPassword(formData.email);
        setResetEmailSent(true);
        toast.success("Parol tiklash havolasi emailingizga yuborildi!");
      } else if (mode === "reset-password") {
        await authApi.updatePasswordWithToken(formData.password);
        setPasswordResetSuccess(true);
        toast.success("Parol muvaffaqiyatli yangilandi!");
        setTimeout(() => {
          setMode("login");
          setPasswordResetSuccess(false);
        }, 2000);
      }
    } catch (error: unknown) {
      const appError = handleError(error, 'Auth');
      toast.error(appError.message, {
        action: {
          label: 'Qayta urinish',
          onClick: () => handleSubmit(e as React.FormEvent<HTMLFormElement>)
        }
      });
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
    setErrors({ name: "", username: "", phone: "", email: "", password: "", confirmPassword: "" });
    setFormData({ name: "", username: "", phone: "", email: "", password: "", confirmPassword: "" });
    setResetEmailSent(false);
    setPasswordResetSuccess(false);
  };

  const goToForgotPassword = () => {
    setMode("forgot-password");
    setErrors({ name: "", username: "", phone: "", email: "", password: "", confirmPassword: "" });
    setResetEmailSent(false);
  };

  const goBackToLogin = () => {
    setMode("login");
    setErrors({ name: "", username: "", phone: "", email: "", password: "", confirmPassword: "" });
    setFormData({ name: "", username: "", phone: "", email: "", password: "", confirmPassword: "" });
    setResetEmailSent(false);
    setPasswordResetSuccess(false);
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
            <span className="text-sm">Orqaga</span>
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
              {mode === "login" && "Xush kelibsiz"}
              {mode === "register" && "Hisob yaratish"}
              {mode === "forgot-password" && "Parolni tiklash"}
              {mode === "reset-password" && "Yangi parol o'rnatish"}
            </p>
          </div>

          {/* Mode Toggle - only for login/register */}
          {(mode === "login" || mode === "register") && (
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
                Kirish
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
                Ro'yxatdan o'tish
              </button>
            </div>
          )}

          {/* Forgot Password - Email Sent Success */}
          {mode === "forgot-password" && resetEmailSent && (
            <div className="text-center space-y-4 py-6 animate-fade-in">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Email yuborildi!</h2>
                <p className="text-sm text-muted-foreground">
                  Parol tiklash havolasi <strong>{formData.email}</strong> manziliga yuborildi.
                  Iltimos, emailingizni tekshiring.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={goBackToLogin}
                className="w-full h-12 rounded-xl"
              >
                Kirishga qaytish
              </Button>
            </div>
          )}

          {/* Reset Password Success */}
          {mode === "reset-password" && passwordResetSuccess && (
            <div className="text-center space-y-4 py-6 animate-fade-in">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Parol yangilandi!</h2>
                <p className="text-sm text-muted-foreground">
                  Yangi parolingiz bilan tizimga kiring.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          {!(mode === "forgot-password" && resetEmailSent) && !(mode === "reset-password" && passwordResetSuccess) && (
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
                        const value = sanitizeUsername(e.target.value);
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

            {/* Email field - show for login, register, and forgot-password */}
            {(mode === "login" || mode === "register" || mode === "forgot-password") && (
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
                  onChange={(e) => handleInputChange("email", sanitizeEmail(e.target.value))}
                  className={cn(
                    "h-12 pl-10 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary",
                    errors.email && "ring-2 ring-destructive"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
              {mode === "forgot-password" && (
                <p className="text-xs text-muted-foreground">
                  Parol tiklash havolasini yuboramiz
                </p>
              )}
            </div>
            )}

            {/* Password field - show for login, register, and reset-password */}
            {(mode === "login" || mode === "register" || mode === "reset-password") && (
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
              {mode === "reset-password" && (
                <p className="text-xs text-muted-foreground">
                  Kamida 6 ta belgidan iborat bo'lishi kerak
                </p>
              )}
            </div>
            )}

            {/* Forgot password (login only) */}
            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={goToForgotPassword}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Parolni unutdingizmi?
                </button>
              </div>
            )}

            {/* Confirm Password field (reset-password only) */}
            {mode === "reset-password" && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Parolni tasdiqlang
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Parolni qayta kiriting"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={cn(
                      "h-12 pl-10 pr-12 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary",
                      errors.confirmPassword && "ring-2 ring-destructive"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
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
              ) : mode === "register" ? (
                "Hisob yaratish"
              ) : mode === "forgot-password" ? (
                "Havola yuborish"
              ) : (
                "Parolni yangilash"
              )}
            </Button>

            {/* Back to login for forgot-password and reset-password */}
            {(mode === "forgot-password" || mode === "reset-password") && (
              <Button
                type="button"
                variant="ghost"
                onClick={goBackToLogin}
                className="w-full h-10 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kirishga qaytish
              </Button>
            )}
          </form>
          )}

          {/* Switch mode - only for login/register */}
          {(mode === "login" || mode === "register") && (
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
          )}
        </div>
      </main>
    </div>
  );
}
