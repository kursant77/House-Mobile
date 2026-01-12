import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { useSidebarStore } from "@/store/sidebarStore";
import { useEffect } from "react";

export const Layout = () => {
    const location = useLocation();
    const isMobile = useIsMobile();
    const isReelsPage = location.pathname === "/reels";
    const { isCollapsed, setOpen } = useSidebarStore();

    // YouTube-style Adaptive Sidebar
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const sidebarStore = useSidebarStore.getState();

            if (width < 1312) {
                if (!sidebarStore.isCollapsed) sidebarStore.toggleCollapsed();
            } else {
                if (sidebarStore.isCollapsed) sidebarStore.toggleCollapsed();
            }

            // Always close overlay on resize to desktop
            if (width >= 768) {
                sidebarStore.setOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground">
            {(!isReelsPage || !isMobile) && <Header />}

            <Sidebar />

            <main className={cn(
                "min-h-[calc(100vh-64px)] transition-all duration-300 ease-in-out",
                !isMobile && (isCollapsed ? "pl-[72px]" : "pl-64"),
                !isReelsPage ? "pt-16 pb-20 md:pb-8" : "h-screen pb-16 md:pb-0 pt-0"
            )}>
                <Outlet />
            </main>

            {/* Mobile Bottom Nav */}
            <BottomNav isReelsPage={isReelsPage} />
        </div>
    );
};
