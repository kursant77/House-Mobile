import { create } from "zustand";
import { authApi } from "@/services/api/auth";

interface User {
  id: string;
  name: string;
  email: string;
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
    set({ user: user as User | null, isAuthenticated, isLoading: false });
  },

  upgradeToProfessional: async () => {
    await authApi.upgradeToProfessional();
    const user = useAuthStore.getState().user;
    if (user) {
      const updatedUser = { ...user, isProfessional: true };
      localStorage.setItem("user", JSON.stringify(updatedUser)); // Keep for persistence compat
      set({ user: updatedUser });
    }
  },
}));
