import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

type UserRole = 'user' | 'super_admin' | 'blogger' | 'seller' | 'admin';

interface ProtectedRouteProps {
    children: React.ReactNode;
    role?: UserRole | UserRole[];
}

export const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
    const { isAuthenticated, user, isLoading } = useAuthStore();
    const location = useLocation();

    if (isLoading) {
        return <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>;
    }

    if (!isAuthenticated) {
        // Redirect to auth page while saving the current location they were trying to go to
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    if (role && user) {
        const roles = Array.isArray(role) ? role : [role];
        const userRole = user.role as string;

        // Check if user's role is in the allowed roles
        if (!roles.includes(userRole as UserRole)) {
            return <Navigate to="/" replace />;
        }
    }

    // Check for mandatory fields (Name, Bio, Address)
    // We check localStorage flag too to allow bypass if they just completed it
    const onboardingComplete = localStorage.getItem("onboarding_complete") === "true";
    const isProfileComplete = (user?.name && user?.bio && user?.address) || onboardingComplete;

    if (!isProfileComplete && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
};
