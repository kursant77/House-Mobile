/**
 * House AI — API Client
 * REST + WebSocket client for the House AI backend.
 */

import { AI_BASE_URL } from "@/lib/config";

// ── Types ────────────────────────────────────────────────────

export type AiLanguage = "uz" | "ru" | "en";
export type AiEmotion = "happy" | "confused" | "frustrated" | "angry" | "excited" | "neutral";
export type AiIntent =
    | "recommendation"
    | "comparison"
    | "product_detail"
    | "blog_search"
    | "trend_inquiry"
    | "budget_conversion"
    | "general_chat";

export interface AiProductCard {
    name: string;
    brand: string;
    price: number;
    currency: string;
    image_url?: string;
    overall_score: number;
    strengths: string[];
    weaknesses: string[];
    best_for: string;
    specs: Record<string, string>;
}

export interface AiComparisonRow {
    category: string;
    values: Record<string, string>;
    winner?: string;
}

export interface AiComparisonTable {
    products: string[];
    rows: AiComparisonRow[];
    final_recommendation: string;
    reasoning: string;
}

export interface AiChatResponse {
    message: string;
    session_id: string;
    intent: AiIntent;
    emotion: AiEmotion;
    language: AiLanguage;
    products?: AiProductCard[];
    comparison?: AiComparisonTable;
    sources?: string[];
    tokens_used: number;
    model_used: string;
}

export interface AiStreamChunk {
    type: "text" | "product" | "comparison" | "done" | "error";
    content: string;
    data?: Record<string, unknown>;
}

export interface AiSessionResponse {
    session_id: string;
    created_at: string;
    message_count: number;
    has_summary: boolean;
}

// ── Helper ───────────────────────────────────────────────────

async function aiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${AI_BASE_URL}${path}`;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    // Attach Supabase auth token if available
    const stored = localStorage.getItem("user");
    if (stored) {
        try {
            // Try to get supabase session token
            const { supabase } = await import("@/lib/supabase");
            const { data } = await supabase.auth.getSession();
            if (data.session?.access_token) {
                headers["Authorization"] = `Bearer ${data.session.access_token}`;
            }
        } catch {
            // Anonymous mode — no auth
        }
    }

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || error.error || `AI request failed: ${res.status}`);
    }

    return res.json();
}

// ── API Methods ──────────────────────────────────────────────

export const aiChatApi = {
    /** Health check */
    health: () => aiFetch<{ status: string; version: string }>("/health"),

    /** Create or resume a chat session */
    createSession: (userId?: string) =>
        aiFetch<AiSessionResponse>("/api/session", {
            method: "POST",
            body: JSON.stringify({
                user_id: userId || null,
                anonymous_session_id: userId ? null : crypto.randomUUID(),
            }),
        }),

    /** Send a chat message (REST, non-streaming) */
    sendMessage: (params: {
        message: string;
        session_id?: string;
        user_id?: string;
        language?: AiLanguage;
    }) =>
        aiFetch<AiChatResponse>("/api/chat", {
            method: "POST",
            body: JSON.stringify(params),
        }),

    /** Get product recommendations */
    recommend: (params: {
        query: string;
        budget_min?: number;
        budget_max?: number;
        focus?: string;
        session_id?: string;
        language?: AiLanguage;
    }) =>
        aiFetch<{
            message: string;
            products: AiProductCard[];
            session_id: string;
            language: AiLanguage;
            tokens_used: number;
        }>("/api/recommend", {
            method: "POST",
            body: JSON.stringify(params),
        }),

    /** Compare products */
    compare: (params: {
        product_names: string[];
        session_id?: string;
        language?: AiLanguage;
    }) =>
        aiFetch<{
            message: string;
            comparison: AiComparisonTable;
            session_id: string;
            language: AiLanguage;
            tokens_used: number;
        }>("/api/compare", {
            method: "POST",
            body: JSON.stringify(params),
        }),

    /** Create a WebSocket connection for streaming */
    createStreamConnection: (
        sessionId: string,
        onChunk: (chunk: AiStreamChunk) => void,
        onError: (error: string) => void,
        onClose: () => void
    ): WebSocket => {
        const wsUrl = AI_BASE_URL.replace(/^http/, "ws");
        const ws = new WebSocket(`${wsUrl}/api/chat/stream?session_id=${sessionId}`);

        ws.onmessage = (event) => {
            try {
                const chunk: AiStreamChunk = JSON.parse(event.data);
                onChunk(chunk);
            } catch {
                onChunk({ type: "text", content: event.data });
            }
        };

        ws.onerror = () => {
            onError("WebSocket connection error");
        };

        ws.onclose = () => {
            onClose();
        };

        return ws;
    },
};
