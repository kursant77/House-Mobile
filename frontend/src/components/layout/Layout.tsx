import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

import { useSidebarStore } from "@/store/sidebarStore";
import { useEffect } from "react";
import GlobalStoryViewer from "@/components/stories/GlobalStoryViewer";
import { AiChatBubble } from "@/components/ai-chat/AiChatBubble";
import { AiChatWindow } from "@/components/ai-chat/AiChatWindow";
import { useAiChatStore } from "@/store/aiChatStore";

export const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const isReelsPage = location.pathname === "/reels";
    const { isCollapsed } = useSidebarStore();
    const isAiChatOpen = useAiChatStore((s) => s.isOpen);

    // Bottom Nav Routes Order for swiping
    const navRoutes = ["/", "/products", "/upload", "/reels", "/profile"];
    const currentIndex = navRoutes.indexOf(location.pathname);

    const handleSwipe = (direction: "left" | "right") => {
        if (!isMobile || currentIndex === -1) return;

        if (direction === "left" && currentIndex < navRoutes.length - 1) {
            navigate(navRoutes[currentIndex + 1]);
        } else if (direction === "right" && currentIndex > 0) {
            navigate(navRoutes[currentIndex - 1]);
        }
    };

    // YouTube-style Adaptive Sidebar
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const sidebarStore = useSidebarStore.getState();

            if (width < 1312) {
                if (!sidebarStore.isCollapsed) sidebarStore.toggleCollapsed();
            } else {
                if (sidebarStore.isCollapsed) {
                    sidebarStore.toggleCollapsed();
                }
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
        <div className="min-h-[100dvh] bg-background text-foreground">
            {(!isReelsPage || !isMobile) && <Header />}

            <Sidebar />

            <main className={cn(
                "transition-all duration-300 ease-in-out",
                !isReelsPage
                    ? "min-h-[calc(100dvh-64px)] pt-16 pb-16 md:pb-8"
                    : "h-[100dvh] md:h-screen pt-0 md:pt-16 overflow-hidden",
                !isMobile && (isCollapsed ? "pl-[72px]" : "pl-64"),
                isMobile && isReelsPage && "pb-0" // Remove bottom padding for mobile reels
            )}>
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100, scale: 0.95 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 200,
                            mass: 0.8
                        }}
                        className="h-full w-full"
                        drag={isMobile ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            const threshold = 80;
                            if (info.offset.x < -threshold) handleSwipe("left");
                            else if (info.offset.x > threshold) handleSwipe("right");
                        }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Global Story Viewer */}
            <GlobalStoryViewer />

            {/* AI Chat Widget */}
            <AiChatBubble />
            <AiChatWindow />

            {/* Mobile Bottom Nav — hide when AI chat is open */}
            {!isAiChatOpen && <BottomNav isReelsPage={isReelsPage} />}
        </div>
    );
};
