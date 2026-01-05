import { create } from "zustand";
import { authApi } from "@/services/api/auth";
import { useCartStore } from "./cartStore";
import { useFavoritesStore } from "./favoritesStore";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'super_admin';
  avatarUrl?: string;
  bio?: string;
  isProfessional: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  upgradeToProfessional: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    const response = await authApi.login({ email, password });
    authApi.saveAuth(response);
    set({ user: response.user, isAuthenticated: true });
    useCartStore.getState().fetchCart();
    useFavoritesStore.getState().fetchFavorites();
  },

  register: async (name, email, password) => {
    const response = await authApi.register({ name, email, password });
    authApi.saveAuth(response);
    set({ user: response.user, isAuthenticated: true });
    useCartStore.getState().fetchCart();
    useFavoritesStore.getState().fetchFavorites();
  },

  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false });
    // Clear user specific data
    useCartStore.getState().resetCart();
    useFavoritesStore.getState().clearFavorites();
  },

  checkAuth: async () => {
    const savedUser = authApi.getSavedUser();
    const isAuthenticated = authApi.isAuthenticated();

    if (isAuthenticated && savedUser) {
      set({ user: savedUser as User, isAuthenticated: true, isLoading: false });

      // Background sync: check if profile still exists/correct in DB
      try {
        const freshUser = await authApi.getProfile();
        set({ user: freshUser as User, isAuthenticated: true });
        localStorage.setItem("user", JSON.stringify(freshUser));

        // Fetch user specific data on successful check
        useCartStore.getState().fetchCart();
        useFavoritesStore.getState().fetchFavorites();
      } catch (e) {
        // If profile fetch fails, user might be deleted or session invalid
        console.error("Auth sync failed", e);
      }
    } else {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  upgradeToProfessional: async () => {
    await authApi.upgradeToProfessional();
    const user = useAuthStore.getState().user;
    if (user) {
      const updatedUser: User = { ...user, isProfessional: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },
}));
