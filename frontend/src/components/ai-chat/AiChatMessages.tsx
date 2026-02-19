/**
 * AI Chat Messages — Exact ChatGPT welcome + message layout
 */

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAiChatStore } from "@/store/aiChatStore";
import { AiMessageBubble } from "./AiMessageBubble";

const SUGGESTIONS: Record<string, { text: string }[]> = {
    uz: [
        { text: "Eng yaxshi gaming telefon qaysi?" },
        { text: "2 mln so'mgacha telefon tavsiya qiling" },
        { text: "Eng yaxshi kamerali telefon" },
        { text: "iPhone 15 va Samsung S24 solishtirib bering" },
    ],
    ru: [
        { text: "Лучший игровой телефон?" },
        { text: "Телефон до 2 миллионов?" },
        { text: "Лучшая камера в телефоне" },
        { text: "Сравните iPhone 15 и Samsung S24" },
    ],
    en: [
        { text: "Best gaming phone right now?" },
        { text: "Phone under $200?" },
        { text: "Best camera phone" },
        { text: "Compare iPhone 15 vs Samsung S24" },
    ],
};

const WELCOME_TITLE: Record<string, string> = {
    uz: "Sizga qanday yordam bera olaman?",
    ru: "Чем могу помочь?",
    en: "What can I help with?",
};

export const AiChatMessages = () => {
    const { language, sendMessage, isStreaming, activeMessages } = useAiChatStore();
    const messages = activeMessages();
    const bottomRef = useRef<HTMLDivElement>(null);

    const suggestions = SUGGESTIONS[language] || SUGGESTIONS.uz;
    const welcomeTitle = WELCOME_TITLE[language] || WELCOME_TITLE.uz;
    const isEmpty = messages.length === 0;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto bg-[#212121]">
            {isEmpty ? (
                /* ── ChatGPT Welcome State ── */
                <div className="flex flex-col items-center justify-center h-full px-4">
                    {/* Big Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="text-[28px] sm:text-[32px] font-semibold text-white/90 mb-8 text-center"
                    >
                        {welcomeTitle}
                    </motion.h1>

                    {/* Suggestion Chips (below input on ChatGPT, we show them here for discoverability) */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap justify-center gap-2 max-w-xl"
                    >
                        {suggestions.map((item, i) => (
                            <motion.button
                                key={i}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 + i * 0.06 }}
                                whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => sendMessage(item.text)}
                                disabled={isStreaming}
                                className="px-4 py-2.5 rounded-full border border-white/[0.15] text-[13px] text-white/60 hover:text-white/80 hover:border-white/25 transition-all disabled:opacity-40"
                            >
                                {item.text}
                            </motion.button>
                        ))}
                    </motion.div>
                </div>
            ) : (
                /* ── Messages ── */
                <div className="max-w-[48rem] mx-auto px-4 py-6 space-y-0">
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg) => (
                            <AiMessageBubble key={msg.id} message={msg} />
                        ))}
                    </AnimatePresence>
                    <div ref={bottomRef} className="h-4" />
                </div>
            )}
        </div>
    );
};
