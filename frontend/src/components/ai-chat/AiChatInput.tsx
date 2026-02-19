/**
 * AI Chat Input — Exact ChatGPT input bar replica
 * Rounded pill with + button left, send button right
 */

import { useState, useRef, useCallback } from "react";
import { Plus, ArrowUp, Loader2 } from "lucide-react";
import { useAiChatStore } from "@/store/aiChatStore";

export const AiChatInput = () => {
    const [text, setText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { sendMessage, isStreaming } = useAiChatStore();

    const handleSend = useCallback(async () => {
        const trimmed = text.trim();
        if (!trimmed || isStreaming) return;
        setText("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        await sendMessage(trimmed);
    }, [text, isStreaming, sendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInput = () => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 200) + "px";
        }
    };

    const hasText = text.trim().length > 0;

    return (
        <div className="bg-[#212121] px-4 pb-4 pt-2">
            <div className="max-w-[48rem] mx-auto">
                {/* Input Container — ChatGPT pill style */}
                <div className="relative flex items-end rounded-3xl bg-[#303030] border border-transparent focus-within:border-white/[0.1] transition-colors">
                    {/* Plus Button (left) */}
                    <button
                        className="flex-shrink-0 p-3 ml-1 rounded-full hover:bg-white/[0.07] transition-colors"
                        title="Fayl biriktirish"
                    >
                        <Plus className="w-5 h-5 text-white/50" />
                    </button>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            handleInput();
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Xabar yozing"
                        disabled={isStreaming}
                        rows={1}
                        className="flex-1 resize-none bg-transparent text-white/90 placeholder:text-white/35 text-[15px] leading-relaxed py-3 px-1 focus:outline-none disabled:opacity-50 max-h-[200px]"
                    />

                    {/* Send Button (right) */}
                    <div className="flex-shrink-0 p-2 mr-1">
                        <button
                            onClick={handleSend}
                            disabled={!hasText || isStreaming}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${hasText && !isStreaming
                                    ? "bg-white text-black hover:bg-white/90"
                                    : "bg-white/[0.12] text-white/30 cursor-not-allowed"
                                }`}
                        >
                            {isStreaming ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ArrowUp className="w-[18px] h-[18px]" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Disclaimer — like ChatGPT */}
                <p className="text-[11px] text-white/30 text-center mt-2.5">
                    House AI xatolar qilishi mumkin. Ma'lumotlarni tekshirib ko'ring.
                </p>
            </div>
        </div>
    );
};
