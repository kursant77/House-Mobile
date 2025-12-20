import { create } from "zustand";
import { authApi } from "@/services/api/auth";

interface User {
  id: string;
  name: string;
  email: string;
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
  },

  register: async (name, email, password) => {
    const response = await authApi.register({ name, email, password });
    authApi.saveAuth(response);
    set({ user: response.user, isAuthenticated: true });
  },

  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const user = authApi.getSavedUser();
    const isAuthenticated = authApi.isAuthenticated();
    set({ user, isAuthenticated, isLoading: false });
  },
}));
