import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export const Layout = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Fixed Header */}
            <Header />

            {/* Fixed Sidebar (Desktop) */}
            <Sidebar />

            {/* Main Content Area 
                pt-16: Compensate for Header height
                md:pl-64: Compensate for Sidebar width on Desktop
                pb-20: Compensate for BottomNav on Mobile
                md:pb-8: Standard bottom padding on Desktop
            */}
            <main className="pt-16 md:pl-64 pb-20 md:pb-8 min-h-[calc(100vh-64px)]">
                <Outlet />
            </main>

            {/* Mobile Bottom Nav */}
            <BottomNav />
        </div>
    );
};
