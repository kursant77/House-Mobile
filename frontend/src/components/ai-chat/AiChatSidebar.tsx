/**
 * AI Chat Sidebar — Exact ChatGPT sidebar replica
 */

import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, X, PenSquare } from "lucide-react";
import { useAiChatStore } from "@/store/aiChatStore";
import { useIsMobile } from "@/hooks/use-mobile";

export const AiChatSidebar = () => {
    const {
        sessions,
        activeSessionId,
        isSidebarOpen,
        startNewChat,
        switchSession,
        deleteSession,
        setSidebarOpen,
    } = useAiChatStore();
    const isMobile = useIsMobile();

    // Group sessions by date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const groups: { label: string; items: typeof sessions }[] = [];
    const todayS = sessions.filter((s) => new Date(s.updatedAt) >= today);
    const yesterdayS = sessions.filter((s) => new Date(s.updatedAt) >= yesterday && new Date(s.updatedAt) < today);
    const weekS = sessions.filter((s) => new Date(s.updatedAt) >= weekAgo && new Date(s.updatedAt) < yesterday);
    const monthS = sessions.filter((s) => new Date(s.updatedAt) >= monthAgo && new Date(s.updatedAt) < weekAgo);
    const olderS = sessions.filter((s) => new Date(s.updatedAt) < monthAgo);

    if (todayS.length) groups.push({ label: "Bugun", items: todayS });
    if (yesterdayS.length) groups.push({ label: "Kecha", items: yesterdayS });
    if (weekS.length) groups.push({ label: "Oldingi 7 kun", items: weekS });
    if (monthS.length) groups.push({ label: "Oldingi 30 kun", items: monthS });
    if (olderS.length) groups.push({ label: "Oldingi oylar", items: olderS });

    const sidebarContent = (
        <div className="flex flex-col h-full bg-[#171717] text-white/90 select-none">
            {/* Top Actions */}
            <div className="flex flex-col gap-0.5 px-2 pt-3 pb-1">
                {/* Logo + Sidebar toggle */}
                <div className="flex items-center justify-between px-2 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                    </div>
                    {!isMobile && (
                        <button
                            onClick={() => startNewChat()}
                            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                            title="Yangi chat"
                        >
                            <PenSquare className="w-[18px] h-[18px] text-white/60" />
                        </button>
                    )}
                </div>

                {/* New Chat */}
                <button
                    onClick={() => {
                        startNewChat();
                        if (isMobile) setSidebarOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.07] transition-colors text-[14px] text-white/80"
                >
                    <PenSquare className="w-[18px] h-[18px]" />
                    Yangi chat
                </button>

                {/* Search */}
                <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.07] transition-colors text-[14px] text-white/80"
                >
                    <Search className="w-[18px] h-[18px]" />
                    Chatlarni qidirish
                </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 mt-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {groups.length === 0 && (
                    <div className="px-3 py-8 text-center text-sm text-white/30">
                        Chat tarixi yo'q
                    </div>
                )}

                {groups.map((group) => (
                    <div key={group.label}>
                        <p className="px-3 py-1.5 text-xs font-medium text-white/40">
                            {group.label}
                        </p>
                        {group.items.map((session) => (
                            <div
                                key={session.id}
                                className={`group relative flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors text-[14px] ${activeSessionId === session.id
                                    ? "bg-white/[0.1] text-white"
                                    : "text-white/70 hover:bg-white/[0.05]"
                                    }`}
                                onClick={() => switchSession(session.id)}
                            >
                                <span className="flex-1 truncate pr-6">{session.title}</span>

                                {/* Delete (hover) */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSession(session.id);
                                    }}
                                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-white/40 hover:text-red-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Bottom — User Profile */}
            <div className="px-2 pb-3 pt-1 border-t border-white/[0.06]">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.07] cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        H
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-white/80 truncate">House Mobile</p>
                        <p className="text-[11px] text-white/40">AI Assistant</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // Desktop: static sidebar
    if (!isMobile) {
        return (
            <div className="w-[260px] flex-shrink-0 h-full">
                {sidebarContent}
            </div>
        );
    }

    // Mobile: overlay sidebar
    return (
        <AnimatePresence>
            {isSidebarOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[102]"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 left-0 w-[280px] z-[103]"
                        drag="x"
                        dragConstraints={{ left: -280, right: 0 }}
                        dragElastic={0.1}
                        onDragEnd={(_, info) => {
                            if (info.offset.x < -80) setSidebarOpen(false);
                        }}
                    >
                        {sidebarContent}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-white/10"
                        >
                            <X className="w-5 h-5 text-white/50" />
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
