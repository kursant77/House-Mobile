import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

interface ProtectedRouteProps {
    children: React.ReactNode;
    role?: 'user' | 'super_admin';
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

    if (role && user?.role !== role) {
        // If user doesn't have the required role, redirect to home
        return <Navigate to="/" replace />;
    }

    // Check for mandatory fields (Name, Username, Phone)
    const isProfileComplete = user?.name && user?.username && user?.phone;

    if (!isProfileComplete && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
};
