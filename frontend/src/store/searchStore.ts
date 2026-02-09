import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, Profile, ReelItem } from "@/types/product";

const MAX_HISTORY_ITEMS = 20;

interface SearchResults {
  products: Product[];
  users: Profile[];
  reels: ReelItem[];
}

interface SearchState {
  query: string;
  results: SearchResults;
  history: string[];
  isLoading: boolean;
  activeTab: "all" | "products" | "users" | "reels";
  recentSearches: string[];

  // Actions
  setQuery: (query: string) => void;
  setResults: (results: Partial<SearchResults>) => void;
  setActiveTab: (tab: SearchState["activeTab"]) => void;
  addToHistory: (term: string) => void;
  removeFromHistory: (term: string) => void;
  clearHistory: () => void;
  setLoading: (isLoading: boolean) => void;
  clearSearch: () => void;
}

const defaultResults: SearchResults = {
  products: [],
  users: [],
  reels: [],
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      query: "",
      results: defaultResults,
      history: [],
      isLoading: false,
      activeTab: "all",
      recentSearches: [],

      setQuery: (query: string) => {
        set({ query });
      },

      setResults: (results: Partial<SearchResults>) => {
        set((state) => ({
          results: { ...state.results, ...results },
        }));
      },

      setActiveTab: (activeTab: SearchState["activeTab"]) => {
        set({ activeTab });
      },

      addToHistory: (term: string) => {
        if (!term.trim()) return;

        const { history } = get();
        const normalizedTerm = term.trim().toLowerCase();

        // Remove duplicate if exists
        const filteredHistory = history.filter(
          (h) => h.toLowerCase() !== normalizedTerm
        );

        // Add to beginning
        const newHistory = [term.trim(), ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

        set({ history: newHistory, recentSearches: newHistory.slice(0, 5) });
      },

      removeFromHistory: (term: string) => {
        const { history } = get();
        const newHistory = history.filter((h) => h !== term);
        set({ history: newHistory, recentSearches: newHistory.slice(0, 5) });
      },

      clearHistory: () => {
        set({ history: [], recentSearches: [] });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      clearSearch: () => {
        set({
          query: "",
          results: defaultResults,
          isLoading: false,
        });
      },
    }),
    {
      name: "search-store",
      partialize: (state) => ({
        history: state.history,
        recentSearches: state.recentSearches,
      }),
    }
  )
);
