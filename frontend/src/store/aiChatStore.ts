/**
 * House AI — Chat Store (ChatGPT-style)
 * Zustand state management with chat history / multiple sessions.
 */

import { create } from "zustand";
import {
    aiChatApi,
    type AiLanguage,
    type AiChatResponse,
    type AiProductCard,
    type AiComparisonTable,
} from "@/services/api/aiChat";
import { useAuthStore } from "@/store/authStore";

// ── Types ────────────────────────────────────────────────────

export interface AiMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    products?: AiProductCard[];
    comparison?: AiComparisonTable;
    sources?: string[];
    isStreaming?: boolean;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: AiMessage[];
    createdAt: Date;
    updatedAt: Date;
}

interface AiChatState {
    // UI State
    isOpen: boolean;
    isStreaming: boolean;
    isSidebarOpen: boolean;
    error: string | null;

    // Chat Data
    sessions: ChatSession[];
    activeSessionId: string | null;
    language: AiLanguage;

    // Computed
    activeSession: () => ChatSession | null;
    activeMessages: () => AiMessage[];

    // Actions
    toggleChat: () => void;
    openChat: () => void;
    closeChat: () => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setLanguage: (lang: AiLanguage) => void;
    sendMessage: (text: string) => Promise<void>;
    startNewChat: () => void;
    switchSession: (sessionId: string) => void;
    deleteSession: (sessionId: string) => void;
    clearError: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

function generateTitle(text: string): string {
    const clean = text.replace(/[📱💰📷🔄⚡]/g, "").trim();
    return clean.length > 40 ? clean.slice(0, 40) + "…" : clean;
}

function loadSessions(): ChatSession[] {
    try {
        const raw = localStorage.getItem("ai_chat_sessions");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return parsed.map((s: ChatSession) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
            messages: s.messages.map((m: AiMessage) => ({
                ...m,
                timestamp: new Date(m.timestamp),
            })),
        }));
    } catch {
        return [];
    }
}

function saveSessions(sessions: ChatSession[]) {
    try {
        localStorage.setItem("ai_chat_sessions", JSON.stringify(sessions));
    } catch {
        // Storage full — silently ignore
    }
}

// ── Store ────────────────────────────────────────────────────

export const useAiChatStore = create<AiChatState>((set, get) => ({
    // Initial state
    isOpen: false,
    isStreaming: false,
    isSidebarOpen: false,
    error: null,
    sessions: loadSessions(),
    activeSessionId: localStorage.getItem("ai_active_session"),
    language: (localStorage.getItem("ai_language") as AiLanguage) || "uz",

    // Computed
    activeSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId) || null;
    },

    activeMessages: () => {
        const session = get().activeSession();
        return session?.messages || [];
    },

    // UI Actions
    toggleChat: () => {
        const { isOpen } = get();
        set({ isOpen: !isOpen });
    },

    openChat: () => set({ isOpen: true }),
    closeChat: () => {
        localStorage.removeItem("ai_active_session");
        set({ isOpen: false, isSidebarOpen: false, activeSessionId: null });
    },

    toggleSidebar: () => {
        const { isSidebarOpen } = get();
        set({ isSidebarOpen: !isSidebarOpen });
    },

    setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),

    setLanguage: (lang: AiLanguage) => {
        localStorage.setItem("ai_language", lang);
        set({ language: lang });
    },

    clearError: () => set({ error: null }),

    startNewChat: () => {
        set({
            activeSessionId: null,
            error: null,
            isStreaming: false,
            isSidebarOpen: false,
        });
        localStorage.removeItem("ai_active_session");
    },

    switchSession: (sessionId: string) => {
        localStorage.setItem("ai_active_session", sessionId);
        set({ activeSessionId: sessionId, isSidebarOpen: false });
    },

    deleteSession: (sessionId: string) => {
        const { sessions, activeSessionId } = get();
        const updated = sessions.filter((s) => s.id !== sessionId);
        saveSessions(updated);
        set({
            sessions: updated,
            activeSessionId: activeSessionId === sessionId ? null : activeSessionId,
        });
        if (activeSessionId === sessionId) {
            localStorage.removeItem("ai_active_session");
        }
    },

    sendMessage: async (text: string) => {
        const { activeSessionId, language, sessions } = get();
        const authUser = useAuthStore.getState().user;
        const userId = authUser?.id ?? undefined;

        // Find or create session
        let sessionId = activeSessionId;
        let currentSessions = [...sessions];

        if (!sessionId) {
            // Create new local session
            sessionId = `local-${Date.now()}`;
            const newSession: ChatSession = {
                id: sessionId,
                title: generateTitle(text),
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            currentSessions = [newSession, ...currentSessions];
            localStorage.setItem("ai_active_session", sessionId);
        }

        // Add user message
        const userMsg: AiMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: text,
            timestamp: new Date(),
        };

        // Add AI placeholder
        const aiPlaceholderId = `ai-${Date.now()}`;
        const aiPlaceholder: AiMessage = {
            id: aiPlaceholderId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
            isStreaming: true,
        };

        // Update session messages
        const updatedSessions = currentSessions.map((s) =>
            s.id === sessionId
                ? {
                    ...s,
                    messages: [...s.messages, userMsg, aiPlaceholder],
                    updatedAt: new Date(),
                }
                : s
        );

        saveSessions(updatedSessions);
        set({
            sessions: updatedSessions,
            activeSessionId: sessionId,
            isStreaming: true,
            error: null,
        });

        try {
            const response: AiChatResponse = await aiChatApi.sendMessage({
                message: text,
                session_id: sessionId.startsWith("local-") ? undefined : sessionId,
                language,
                user_id: userId,
            });

            // If backend returns a real session ID, update
            const realSessionId = response.session_id || sessionId;

            set((state) => {
                const finalSessions = state.sessions.map((s) => {
                    if (s.id === sessionId) {
                        return {
                            ...s,
                            id: realSessionId,
                            messages: s.messages.map((msg) =>
                                msg.id === aiPlaceholderId
                                    ? {
                                        ...msg,
                                        content: response.message,
                                        products: response.products || undefined,
                                        comparison: response.comparison || undefined,
                                        sources: response.sources || undefined,
                                        isStreaming: false,
                                    }
                                    : msg
                            ),
                            updatedAt: new Date(),
                        };
                    }
                    return s;
                });
                saveSessions(finalSessions);
                localStorage.setItem("ai_active_session", realSessionId);
                return {
                    sessions: finalSessions,
                    activeSessionId: realSessionId,
                    isStreaming: false,
                };
            });
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Kutilmagan xatolik yuz berdi";

            set((state) => {
                const finalSessions = state.sessions.map((s) => {
                    if (s.id === sessionId) {
                        return {
                            ...s,
                            messages: s.messages.map((msg) =>
                                msg.id === aiPlaceholderId
                                    ? {
                                        ...msg,
                                        content: `⚠️ ${errorMessage}`,
                                        isStreaming: false,
                                    }
                                    : msg
                            ),
                        };
                    }
                    return s;
                });
                saveSessions(finalSessions);
                return {
                    sessions: finalSessions,
                    isStreaming: false,
                    error: errorMessage,
                };
            });
        }
    },
}));
