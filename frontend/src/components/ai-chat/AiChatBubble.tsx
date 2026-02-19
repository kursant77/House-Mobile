/**
 * AI Chat Bubble — Draggable floating button (both desktop & mobile)
 * Constrained to safe area. Always on top of content.
 */

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";
import { useAiChatStore } from "@/store/aiChatStore";
import { useIsMobile } from "@/hooks/use-mobile";

export const AiChatBubble = () => {
    const { isOpen, toggleChat } = useAiChatStore();
    const isMobile = useIsMobile();
    const constraintsRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    return (
        <AnimatePresence>
            {!isOpen && (
                <>
                    {/* Drag constraint area — safe zone */}
                    <div
                        ref={constraintsRef}
                        className="fixed z-[96] pointer-events-none"
                        style={{
                            top: isMobile ? 60 : 8,
                            bottom: isMobile ? 70 : 8,
                            left: 8,
                            right: 8,
                        }}
                    />

                    <motion.button
                        onClick={() => {
                            if (isDragging.current) return;
                            toggleChat();
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.3,
                        }}
                        drag
                        dragConstraints={constraintsRef}
                        dragElastic={0.05}
                        dragMomentum={false}
                        onDragStart={() => {
                            isDragging.current = true;
                        }}
                        onDragEnd={() => {
                            setTimeout(() => {
                                isDragging.current = false;
                            }, 100);
                        }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[97] group"
                        aria-label="AI Chat"
                        style={{ cursor: "grab", touchAction: "none" }}
                    >
                        {/* Glow */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 opacity-50 blur-xl group-hover:opacity-70 transition-opacity" />

                        {/* Button */}
                        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow">
                            <Bot className="w-6 h-6 text-white" />

                            {/* Pulse */}
                            <motion.div
                                className="absolute inset-0 rounded-full border-2 border-violet-400/60"
                                animate={{
                                    scale: [1, 1.5, 1.5],
                                    opacity: [0.6, 0, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 4,
                                }}
                            />
                        </div>
                    </motion.button>
                </>
            )}
        </AnimatePresence>
    );
};
