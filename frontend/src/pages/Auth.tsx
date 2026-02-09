import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Phone, AtSign, CheckCircle, Gift } from "lucide-react";
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
import { logger } from "@/lib/logger";

type AuthMode = "login" | "register" | "forgot-password" | "reset-password";

type AuthFormValues = {
  name: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  referral_code: string;
};

const defaultValues: AuthFormValues = {
  name: "",
  username: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  referral_code: "",
};

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

  const {
    register: registerField,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    reset,
    watch,
    formState: { errors },
  } = useForm<AuthFormValues>({ defaultValues });

  const formValues = watch();

  // Check for reset password mode or referral code from URL
  useEffect(() => {
    const modeParam = searchParams.get("mode");
    const refParam = searchParams.get("ref");

    if (modeParam === "reset-password") {
      setMode("reset-password");
    } else if (refParam) {
      setMode("register");
      setValue("referral_code", refParam);
      toast.info("Referal kod aniqlandi!");
    }
  }, [searchParams, setValue]);

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      return await authApi.checkUsernameAvailability(username);
    } catch (error) {
      logger.error('Username tekshirishda xato:', error);
      return false;
    }
  };

  const onSubmit = async (data: AuthFormValues) => {
    clearErrors();
    let isValid = true;

    try {
      if (mode === "register") {
        const sanitizedData = {
          name: data.name.trim(),
          username: sanitizeUsername(data.username),
          phone: sanitizePhone(data.phone),
          email: sanitizeEmail(data.email),
          password: data.password,
        };

        const result = registerSchema.safeParse(sanitizedData);

        if (!result.success) {
          result.error.errors.forEach((err) => {
            const field = err.path[0] as keyof AuthFormValues;
            if (field in defaultValues) {
              setError(field, { message: err.message });
            }
          });
          isValid = false;
        } else {
          setCheckingUsername(true);
          const isAvailable = await checkUsernameAvailability(sanitizeUsername(data.username));
          setCheckingUsername(false);
          if (!isAvailable) {
            setError("username", { message: "Bu username allaqachon olingan" });
            isValid = false;
          }
        }
      } else if (mode === "login") {
        const sanitizedData = {
          email: sanitizeEmail(data.email),
          password: data.password,
        };
        const result = loginSchema.safeParse(sanitizedData);
        if (!result.success) {
          result.error.errors.forEach((err) => {
            const field = err.path[0] as keyof AuthFormValues;
            if (field in defaultValues) {
              setError(field, { message: err.message });
            }
          });
          isValid = false;
        }
      } else if (mode === "forgot-password") {
        if (!data.email || !data.email.includes("@")) {
          setError("email", { message: "To'g'ri email manzilini kiriting" });
          isValid = false;
        }
      } else if (mode === "reset-password") {
        if (!data.password || data.password.length < 6) {
          setError("password", { message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" });
          isValid = false;
        }
        if (data.password !== data.confirmPassword) {
          setError("confirmPassword", { message: "Parollar mos kelmaydi" });
          isValid = false;
        }
      }
    } catch (error) {
      logger.error('Validatsiyada xato:', error);
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(data.email, data.password);
        toast.success("Muvaffaqiyatli kirildi!");
        navigate("/");
      } else if (mode === "register") {
        await register(
          data.name,
          sanitizeUsername(data.username),
          sanitizePhone(data.phone),
          sanitizeEmail(data.email),
          data.password,
          data.referral_code
        );
        toast.success("Hisob muvaffaqiyatli yaratildi!");
        navigate("/profile");
      } else if (mode === "forgot-password") {
        await authApi.resetPassword(data.email);
        setResetEmailSent(true);
        toast.success("Parol tiklash havolasi emailingizga yuborildi!");
      } else if (mode === "reset-password") {
        await authApi.updatePasswordWithToken(data.password);
        setPasswordResetSuccess(true);
        toast.success("Parol muvaffaqiyatli yangilandi!");
        setTimeout(() => {
          setMode("login");
          setPasswordResetSuccess(false);
          reset(defaultValues);
        }, 2000);
      }
    } catch (error: unknown) {
      const appError = handleError(error, "Auth");
      toast.error(appError.message, {
        action: {
          label: "Qayta urinish",
          onClick: () => handleSubmit(onSubmit)(),
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    clearErrors();
    reset(defaultValues);
    setResetEmailSent(false);
    setPasswordResetSuccess(false);
  };

  const goToForgotPassword = () => {
    setMode("forgot-password");
    clearErrors();
    setResetEmailSent(false);
  };

  const goBackToLogin = () => {
    setMode("login");
    clearErrors();
    reset(defaultValues);
    setResetEmailSent(false);
    setPasswordResetSuccess(false);
  };

  const handlePhoneChange = (value: string) => {
    let formatted = value.replace(/\D/g, "");
    if (formatted.startsWith("998")) {
      formatted = "+" + formatted;
    } else if (formatted.length > 0 && !formatted.startsWith("998")) {
      formatted = "+998" + formatted;
    }
    if (formatted.length <= 13) {
      setValue("phone", formatted);
      if (errors.phone) clearErrors("phone");
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
                  Parol tiklash havolasi <strong>{formValues.email}</strong> manziliga yuborildi.
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                        {...registerField("name")}
                        className={cn(
                          "h-12 pl-10 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary",
                          errors.name && "ring-2 ring-destructive"
                        )}
                      />
                    </div>
                    {errors.name?.message && (
                      <p className="text-xs text-destructive">{errors.name.message}</p>
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
                        {...registerField("username", {
                          onChange: (e) => {
                            const value = sanitizeUsername(e.target.value);
                            setValue("username", value);
                          },
                        })}
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
                    {errors.username?.message && (
                      <p className="text-xs text-destructive">{errors.username.message}</p>
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
                        value={formValues.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={cn(
                          "h-12 pl-10 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary",
                          errors.phone && "ring-2 ring-destructive"
                        )}
                      />
                    </div>
                    {errors.phone?.message && (
                      <p className="text-xs text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Referral Code field (register only) */}
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="referral_code" className="text-sm font-medium">
                      Referal kod (ixtiyoriy)
                    </Label>
                    <div className="relative">
                      <Gift className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="referral_code"
                        type="text"
                        placeholder="Kod bo'lsa kiriting"
                        {...registerField("referral_code")}
                        className={cn(
                          "h-12 pl-10 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary",
                          errors.referral_code && "ring-2 ring-destructive"
                        )}
                      />
                    </div>
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
                      {...registerField("email", {
                        onChange: (e) => {
                          setValue("email", sanitizeEmail(e.target.value));
                          if (errors.email) clearErrors("email");
                        },
                      })}
                      className={cn(
                        "h-12 pl-10 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary",
                        errors.email && "ring-2 ring-destructive"
                      )}
                    />
                  </div>
                  {errors.email?.message && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
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
                      {...registerField("password")}
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
                  {errors.password?.message && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
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
                      {...registerField("confirmPassword")}
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
                  {errors.confirmPassword?.message && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
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
