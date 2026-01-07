import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const Layout = () => {
    const location = useLocation();
    const isReelsPage = location.pathname === "/reels";

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Fixed Header */}
            {!isReelsPage && <Header />}

            {/* Fixed Sidebar (Desktop) */}
            <Sidebar />

            {/* Main Content Area 
                pt-16: Compensate for Header height
                md:pl-64: Compensate for Sidebar width on Desktop
                pb-20: Compensate for BottomNav on Mobile
                md:pb-8: Standard bottom padding on Desktop
            */}
            <main className={cn(
                "md:pl-64 min-h-[calc(100vh-64px)]",
                !isReelsPage ? "pt-16 pb-20 md:pb-8" : "h-screen pb-16 md:pb-0 pt-0"
            )}>
                <Outlet />
            </main>

            {/* Mobile Bottom Nav */}
            <BottomNav isReelsPage={isReelsPage} />
        </div>
    );
};
