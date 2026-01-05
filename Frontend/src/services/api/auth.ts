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
    role: 'user' | 'super_admin';
    avatarUrl?: string;
    bio?: string;
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

    // Ensure profile exists in public.profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, is_professional')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      // Create profile if it doesn't exist (useful for users created before trigger)
      await supabase.from('profiles').insert([{
        id: user.id,
        full_name: user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
        role: user.user_metadata?.role || 'user'
      }]);
    }

    return {
      user: {
        id: user.id,
        name: profile?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: profile?.role || user.user_metadata?.role || 'user',
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url,
        isProfessional: profile?.is_professional || !!user.user_metadata?.is_professional,
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
        role: 'user',
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

    // Fetch profile from public.profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, is_professional, bio')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      // If profile missing, return auth metadata but consider creating it
      return {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: user.user_metadata?.role || 'user',
        avatarUrl: user.user_metadata?.avatar_url,
        isProfessional: !!user.user_metadata?.is_professional,
      };
    }

    return {
      id: user.id,
      name: profile.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      role: profile.role || 'user',
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      isProfessional: profile.is_professional,
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
    const { error } = await supabase.auth.updateUser({
      data: { is_professional: true }
    });

    if (error) {
      throw new Error("Upgrade failed: " + error.message);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ is_professional: true }).eq('id', user.id);
    }
  },

  /**
   * Update user profile information
   */
  updateProfile: async (updates: { name?: string; bio?: string; avatarUrl?: string }): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: updates.name,
        avatar_url: updates.avatarUrl,
        bio: updates.bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Update auth metadata if name changed
    if (updates.name) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: updates.name }
      });
      if (authError) console.error("Auth metadata update failed:", authError);
    }
  },

  /**
   * Upload user avatar to storage
   */
  uploadAvatar: async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};
