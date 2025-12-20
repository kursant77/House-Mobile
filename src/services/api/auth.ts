// Auth API service - ready to connect to your Node.js backend
// Replace BASE_URL with your Railway backend URL

const BASE_URL = "/api"; // Change to your Railway backend URL

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
  };
  token: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || "Login failed");
    }

    return response.json();
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    return response.json();
  },

  /**
   * Logout and clear session
   */
  logout: async (): Promise<void> => {
    const token = localStorage.getItem("auth_token");

    await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<AuthResponse["user"]> => {
    const token = localStorage.getItem("auth_token");

    const response = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get profile");
    }

    return response.json();
  },

  /**
   * Save auth data to localStorage
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
};
