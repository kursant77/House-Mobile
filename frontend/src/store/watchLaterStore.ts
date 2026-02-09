import { create } from "zustand";
import { Product } from "@/types/product";
import { watchLaterService } from "@/services/api/watchLater";
import { logger } from "@/lib/logger";

interface WatchLaterState {
    items: Product[];
    isLoading: boolean;
    fetchItems: () => Promise<void>;
    addItem: (product: Product) => Promise<void>;
    removeItem: (productId: string) => Promise<void>;
    isInWatchLater: (productId: string) => boolean;
    clearItems: () => void;
}

export const useWatchLaterStore = create<WatchLaterState>((set, get) => ({
    items: [],
    isLoading: false,

    fetchItems: async () => {
        set({ isLoading: true });
        try {
            const items = await watchLaterService.getWatchLaterItems();
            set({ items, isLoading: false });
        } catch (_error) {
            // Return empty array on error
            set({ items: [], isLoading: false });
        }
    },

    addItem: async (product: Product) => {
        const { items } = get();
        if (items.some(item => item.id === product.id)) return;

        try {
            await watchLaterService.addToWatchLater(product.id);
            set({ items: [product, ...items] });
        } catch (error) {
            logger.error("Failed to add to watch later", error);
        }
    },

    removeItem: async (productId: string) => {
        try {
            await watchLaterService.removeFromWatchLater(productId);
            set({ items: get().items.filter(item => item.id !== productId) });
        } catch (_error) {
            // Silently ignore remove errors
        }
    },

    isInWatchLater: (productId: string) => {
        return get().items.some(item => item.id === productId);
    },

    clearItems: () => {
        set({ items: [] });
    },
}));
