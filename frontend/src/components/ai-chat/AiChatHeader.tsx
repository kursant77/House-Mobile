/**
 * AI Chat Header — Exact ChatGPT header replica
 * Center: "House AI" with chevron dropdown
 * Right: user icon, close button
 */

import { ChevronDown, Menu, User } from "lucide-react";
import { useAiChatStore } from "@/store/aiChatStore";
import { useIsMobile } from "@/hooks/use-mobile";

export const AiChatHeader = () => {
    const { closeChat, toggleSidebar } = useAiChatStore();
    const isMobile = useIsMobile();

    return (
        <div className="flex items-center justify-between h-12 px-3 bg-[#212121]">
            {/* Left */}
            <div className="flex items-center gap-1 min-w-[60px]">
                {isMobile && (
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-white/[0.07] transition-colors"
                    >
                        <Menu className="w-5 h-5 text-white/70" />
                    </button>
                )}
            </div>

            {/* Center — Model Name */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/[0.07] transition-colors">
                <span className="text-[15px] font-medium text-white/85">House AI</span>
                <ChevronDown className="w-4 h-4 text-white/40" />
            </button>

            {/* Right */}
            <div className="flex items-center gap-1 min-w-[60px] justify-end">
                {/* User Icon */}
                <button className="p-2 rounded-lg hover:bg-white/[0.07] transition-colors">
                    <User className="w-5 h-5 text-white/60" />
                </button>

                {/* Close */}
                <button
                    onClick={closeChat}
                    className="p-2 rounded-lg hover:bg-white/[0.07] transition-colors"
                    title="Yopish"
                >
                    <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
