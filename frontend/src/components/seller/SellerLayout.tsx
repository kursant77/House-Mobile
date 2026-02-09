import { Outlet, useLocation } from "react-router-dom";
import { SellerSidebar } from "./SellerSidebar";
import { SellerHeader } from "./SellerHeader";
import { useState, useEffect } from "react";

export const SellerLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Close sidebar on route change for mobile
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 text-foreground">
            {/* Sidebar */}
            <SellerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Main Content Area */}
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                {/* Header */}
                <SellerHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                {/* Content */}
                <main className="mx-auto max-w-screen-2xl p-4 md:p-5 lg:p-6 2xl:p-8 w-full min-h-screen">
                    <div className="animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
