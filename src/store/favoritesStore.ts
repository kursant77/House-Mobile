import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types/product";

interface FavoritesState {
  favorites: Product[];
  
  // Actions
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (product) => {
        const { favorites } = get();
        if (!favorites.find((p) => p.id === product.id)) {
          set({ favorites: [...favorites, product] });
        }
      },

      removeFavorite: (productId) => {
        set({ favorites: get().favorites.filter((p) => p.id !== productId) });
      },

      toggleFavorite: (product) => {
        const { favorites, addFavorite, removeFavorite } = get();
        if (favorites.find((p) => p.id === product.id)) {
          removeFavorite(product.id);
        } else {
          addFavorite(product);
        }
      },

      isFavorite: (productId) => {
        return get().favorites.some((p) => p.id === productId);
      },

      clearFavorites: () => {
        set({ favorites: [] });
      },
    }),
    {
      name: "house-mobile-favorites",
    }
  )
);
