import { Outlet, useLocation } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Close sidebar on route change for mobile
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200">
            {/* Sidebar */}
            <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Main Content Area */}
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                {/* Header */}
                <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                {/* Content */}
                <main className="mx-auto max-w-screen-2xl p-4 md:p-5 lg:p-6 2xl:p-8 w-full min-h-screen bg-zinc-50 dark:bg-zinc-950">
                    <Outlet />
                </main>

            </div>
        </div>
    );
};
