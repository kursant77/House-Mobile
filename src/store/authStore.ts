import { create } from "zustand";
import { authApi } from "@/services/api/auth";
import { useCartStore } from "./cartStore";
import { useFavoritesStore } from "./favoritesStore";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'blogger' | 'super_admin';
  avatarUrl?: string;
  bio?: string;
  username?: string;
  phone?: string;
  isProfessional: boolean;
  isBlocked: boolean;
  address?: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, phone: string, email: string, password: string) => Promise<void>;
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

    // Check if user is blocked
    if (response.user.isBlocked) {
      // Don't save auth, show error
      throw new Error("Sizning akkauntingiz adminlar tomonidan bloklangan. Yordam uchun support@housemobile.uz ga murojaat qiling.");
    }

    authApi.saveAuth(response);
    set({ user: response.user, isAuthenticated: true });
    useCartStore.getState().fetchCart();
    useFavoritesStore.getState().fetchFavorites();
  },

  register: async (name, username, phone, email, password) => {
    const response = await authApi.register({ name, username, phone, email, password });
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
      // Use saved user as initial state but keep loading true while we sync
      set({ user: savedUser as User, isAuthenticated: true });

      try {
        const freshUser = await authApi.getProfile();

        // Check if user is blocked
        if (freshUser.isBlocked) {
          // Logout blocked user
          authApi.logout();
          set({ user: null, isAuthenticated: false, isLoading: false });
          useCartStore.getState().resetCart();
          useFavoritesStore.getState().clearFavorites();
          return;
        }

        set({ user: freshUser as User, isAuthenticated: true, isLoading: false });
        localStorage.setItem("user", JSON.stringify(freshUser));

        // Fetch user specific data
        useCartStore.getState().fetchCart();
        useFavoritesStore.getState().fetchFavorites();
      } catch (e) {
        console.error("Auth sync failed", e);
        // If sync fails, we can still use saved data or logout if it's a 401
        set({ isLoading: false });
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
