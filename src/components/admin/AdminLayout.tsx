import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar on route change for mobile
    useEffect(() => {
        setSidebarOpen(false);
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-200">
            {/* Sidebar */}
            <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Main Content Area */}
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                {/* Header */}
                <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                {/* Content */}
                <main className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 w-full min-h-screen">
                    <Outlet />
                </main>

                {/* Footer (Optional, following TailAdmin pattern might not need a footer here, or a very subtle one) */}
                <footer className="mt-auto py-6 px-10 text-center text-zinc-600 text-xs border-t border-zinc-900 bg-zinc-950/50">
                    <p>© 2024 House Mobile Admin. Crafted with precision.</p>
                </footer>
            </div>
        </div>
    );
};
