import { create } from "zustand";
import { Product } from "@/types/product";
import { userDataService } from "@/services/api/userData";

interface FavoritesState {
  favorites: Product[];
  isLoading: boolean;

  // Actions
  fetchFavorites: () => Promise<void>;
  addFavorite: (product: Product) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  toggleFavorite: (product: Product) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoading: false,

  fetchFavorites: async () => {
    set({ isLoading: true });
    try {
      const favorites = await userDataService.getFavorites();
      set({ favorites, isLoading: false });
    } catch (error) {
      // Return empty array on error
      set({ favorites: [], isLoading: false });
    }
  },

  addFavorite: async (product) => {
    const { favorites } = get();
    if (!favorites.find((p) => p.id === product.id)) {
      set({ favorites: [...favorites, product] });
      await userDataService.addFavorite(product.id);
    }
  },

  removeFavorite: async (productId) => {
    set({ favorites: get().favorites.filter((p) => p.id !== productId) });
    await userDataService.removeFavorite(productId);
  },

  toggleFavorite: async (product) => {
    const { favorites, addFavorite, removeFavorite } = get();
    if (favorites.find((p) => p.id === product.id)) {
      await removeFavorite(product.id);
    } else {
      await addFavorite(product);
    }
  },

  isFavorite: (productId) => {
    return get().favorites.some((p) => p.id === productId);
  },

  clearFavorites: () => {
    set({ favorites: [] });
  },
}));
