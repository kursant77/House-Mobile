import { supabase } from "@/lib/supabase";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    isProfessional: boolean;
  };
  token: string;
}

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw new Error(error.message);

    const user = authData.user;
    return {
      user: {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        isProfessional: !!user.user_metadata?.is_professional,
      },
      token: authData.session?.access_token || '',
    };
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          is_professional: false,
        },
      },
    });

    if (error) throw new Error(error.message);

    const user = authData.user;
    if (!user) throw new Error("Registration failed");

    return {
      user: {
        id: user.id,
        name: data.name,
        email: user.email || '',
        isProfessional: false,
      },
      token: authData.session?.access_token || '',
    };
  },

  /**
   * Logout and clear session
   */
  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<AuthResponse["user"]> => {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error("Failed to get profile");
    }

    return {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      isProfessional: !!user.user_metadata?.is_professional,
    };
  },

  /**
   * Save auth data to localStorage (compatibility with existing store)
   */
  saveAuth: (data: AuthResponse) => {
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  },

  /**
   * Get saved user from localStorage
   */
  getSavedUser: (): AuthResponse["user"] | null => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("auth_token");
  },

  /**
   * Get auth token
   */
  getToken: (): string | null => {
    return localStorage.getItem("auth_token");
  },

  /**
   * Upgrade to professional status
   */
  upgradeToProfessional: async (): Promise<void> => {
    const { data, error } = await supabase.auth.updateUser({
      data: { is_professional: true }
    });

    if (error) {
      throw new Error("Upgrade failed: " + error.message);
    }
  },
};
