import { create } from "zustand";
import { authApi } from "@/services/api/auth";
import { useCartStore } from "./cartStore";
import { useFavoritesStore } from "./favoritesStore";
import { sessionStorage as sessionStorageUtil } from "@/lib/sessionStorage";
import { referralService } from "@/services/api/referral";
import type { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, phone: string, email: string, password: string, referralCode?: string) => Promise<void>;
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

  register: async (name, username, phone, email, password, referralCode) => {
    const response = await authApi.register({ name, username, phone, email, password, referral_code: referralCode });
    authApi.saveAuth(response);

    // Link referral if code provided
    if (referralCode) {
      try {
        await referralService.registerReferral(referralCode, response.user.id);
      } catch (error) {
        console.error("Failed to register referral:", error);
        // We don't throw here to avoid failing the whole registration
      }
    }

    set({ user: response.user, isAuthenticated: true });
    useCartStore.getState().fetchCart();
    useFavoritesStore.getState().fetchFavorites();
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null, isAuthenticated: false });
    // Clear user specific data
    useCartStore.getState().resetCart();
    useFavoritesStore.getState().clearFavorites();
  },

  checkAuth: async () => {
    const isAuthenticated = await authApi.isAuthenticated();

    if (isAuthenticated) {
      // If authenticated, try to get saved user for initial state (fast UI)
      const savedUser = authApi.getSavedUser();

      // Set initial state with saved user immediately for fast UI
      if (savedUser) {
        set({ user: savedUser as User, isAuthenticated: true, isLoading: false });
        // Fetch user specific data immediately with saved user
        useCartStore.getState().fetchCart();
        useFavoritesStore.getState().fetchFavorites();
      } else {
        set({ isLoading: true });
      }

      // Background: fetch fresh user data from server (non-blocking)
      authApi.getProfile()
        .then((freshUser) => {
          // Check if user is blocked
          if (freshUser.isBlocked) {
            // Logout blocked user
            authApi.logout();
            set({ user: null, isAuthenticated: false, isLoading: false });
            useCartStore.getState().resetCart();
            useFavoritesStore.getState().clearFavorites();
            return;
          }

          // Update state with fresh user data
          set({ user: freshUser as User, isAuthenticated: true, isLoading: false });

          // Save minimal user data for next time
          try {
            const minimalUser = { id: freshUser.id, role: freshUser.role };
            localStorage.setItem("user", JSON.stringify(minimalUser));
            // Also save to sessionStorage
            sessionStorageUtil.saveUser(freshUser.id, freshUser.role);
          } catch (error) {
            // Silently ignore storage errors
          }

          // Fetch user specific data with fresh user
          useCartStore.getState().fetchCart();
          useFavoritesStore.getState().fetchFavorites();
        })
        .catch((e: unknown) => {
          // If sync fails, check if it's a 401 (unauthorized)
          const error = e as { status?: number; message?: string };
          if (error?.status === 401 || error?.message?.includes('401')) {
            // Session expired or invalid, logout
            authApi.logout();
            set({ user: null, isAuthenticated: false, isLoading: false });
            useCartStore.getState().resetCart();
            useFavoritesStore.getState().clearFavorites();
          } else {
            // Other error, keep saved user if available (don't break the app)
            if (savedUser) {
              set({ user: savedUser as User, isAuthenticated: true, isLoading: false });
            } else {
              set({ user: null, isAuthenticated: false, isLoading: false });
            }
          }
        });
    } else {
      // Not authenticated, clear everything
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  upgradeToProfessional: async () => {
    await authApi.upgradeToProfessional();
    const user = useAuthStore.getState().user;
    if (user) {
      const updatedUser: User = { ...user, isProfessional: true };
      try {
        const minimalUser = { id: updatedUser.id, role: updatedUser.role };
        localStorage.setItem("user", JSON.stringify(minimalUser));
      } catch (error) {
        // Silently ignore localStorage errors
      }
      set({ user: updatedUser });
    }
  },
}));
