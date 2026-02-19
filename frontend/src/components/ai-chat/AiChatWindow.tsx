/**
 * AI Chat Window — Full-screen ChatGPT-style layout
 * Desktop: sidebar + main chat area
 * Mobile: full-screen with swipe-to-reveal sidebar
 */

import { motion, AnimatePresence } from "framer-motion";
import { useAiChatStore } from "@/store/aiChatStore";
import { AiChatSidebar } from "./AiChatSidebar";
import { AiChatHeader } from "./AiChatHeader";
import { AiChatMessages } from "./AiChatMessages";
import { AiChatInput } from "./AiChatInput";

export const AiChatWindow = () => {
    const { isOpen } = useAiChatStore();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, borderRadius: "24px" }}
                    animate={{ opacity: 1, scale: 1, borderRadius: "0px" }}
                    exit={{ opacity: 0, scale: 0.92, borderRadius: "24px" }}
                    transition={{
                        duration: 0.4,
                        ease: [0.32, 0.72, 0, 1],
                    }}
                    className="fixed inset-0 z-[100] flex bg-[#212121] overflow-hidden"
                    style={{ transformOrigin: "bottom right" }}
                >
                    {/* Sidebar (desktop: static, mobile: overlay via AiChatSidebar) */}
                    <AiChatSidebar />

                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <AiChatHeader />
                        <AiChatMessages />
                        <AiChatInput />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
