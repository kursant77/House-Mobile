import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "house_search_history";
const MAX_HISTORY_ITEMS = 20;

/**
 * Qidiruv tarixini localStorage'da saqlash va boshqarish hook'i.
 * 
 * - Oxirgi 20 ta qidiruvni saqlaydi
 * - Duplikat bo'lsa yuqoriga ko'taradi
 * - Tablar orasida sinxronizatsiya (storage event)
 */
export function useSearchHistory() {
    const [history, setHistory] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Sync across tabs
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                try {
                    setHistory(e.newValue ? JSON.parse(e.newValue) : []);
                } catch {
                    // ignore
                }
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const saveToStorage = useCallback((items: string[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // localStorage full — silently ignore
        }
    }, []);

    const addToHistory = useCallback((query: string) => {
        const trimmed = query.trim();
        if (!trimmed || trimmed.length < 2) return;

        setHistory(prev => {
            // Remove if already exists, add to top
            const filtered = prev.filter(
                item => item.toLowerCase() !== trimmed.toLowerCase()
            );
            const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    const removeFromHistory = useCallback((query: string) => {
        setHistory(prev => {
            const updated = prev.filter(
                item => item.toLowerCase() !== query.toLowerCase()
            );
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    const clearHistory = useCallback(() => {
        setHistory([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
    }, []);

    return {
        history,
        addToHistory,
        removeFromHistory,
        clearHistory,
    };
}
