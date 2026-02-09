import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Blocked() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        // Agar user bloklangan bo'lmasa, bosh sahifaga yo'naltir
        if (!user?.isBlocked) {
            navigate("/");
        }
    }, [user, navigate]);

    const handleLogout = () => {
        logout();
        navigate("/auth");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-red-100 dark:from-zinc-950 dark:via-red-950/20 dark:to-zinc-950">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border-2 border-red-200 dark:border-red-900">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <Shield className="h-10 w-10 text-red-600 dark:text-red-500" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-black text-center text-zinc-900 dark:text-white mb-3">
                        Akkaunt Bloklangan
                    </h1>

                    {/* Message */}
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 mb-6">
                        <p className="text-sm text-red-800 dark:text-red-200 text-center leading-relaxed">
                            Sizning akkauntingiz adminlar tomonidan bloklangan.
                            <br />
                            <br />
                            Agar bu xato deb hisoblasangiz, qo'llab-quvvatlash xizmatiga murojaat qiling.
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
                                <p className="font-semibold mb-2">Mumkin bo'lgan sabablar:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Foydalanish shartlarini buzganlik</li>
                                    <li>Noto'g'ri ma'lumotlar e'lon qilish</li>
                                    <li>Spam yoki takroriy harakatlar</li>
                                    <li>Boshqa foydalanuvchilarga to'sqinlik qilish</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleLogout}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white font-bold py-6"
                        >
                            <LogOut className="h-5 w-5 mr-2" />
                            Chiqish
                        </Button>

                        <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                            Yordam kerakmi?{" "}
                            <a href="mailto:support@housemobile.uz" className="text-primary hover:underline font-semibold">
                                support@housemobile.uz
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
