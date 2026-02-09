import { supabase } from "@/lib/supabase";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimiter";
import { handleError, getErrorMessage } from "@/lib/errorHandler";
import { sessionStorage as sessionStorageUtil } from "@/lib/sessionStorage";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  referral_code?: string;
}

export interface AuthResponse {
  user: {
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
    youtube?: string;
  };
  token: string;
}

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    // Rate limiting for login attempts
    checkRateLimit('login', RATE_LIMITS.API_CALL_STRICT);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw new Error(error.message);

    const user = authData.user;

    // Ensure profile exists in public.profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, is_professional, is_blocked')
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

    if (profile?.is_blocked) {
      await supabase.auth.signOut();
      throw new Error("Sizning hisobingiz bloklangan. Iltimos, ma'muriyatga murojaat qiling.");
    }

    return {
      user: {
        id: user.id,
        name: profile?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: profile?.role || user.user_metadata?.role || 'user',
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url,
        isProfessional: profile?.is_professional || !!user.user_metadata?.is_professional,
        isBlocked: !!profile?.is_blocked,
      },
      token: authData.session?.access_token || '',
    };
  },

  /**
   * Check if username is available
   */
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return !data; // Available if no data found
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    // Rate limiting for registration
    checkRateLimit('register', RATE_LIMITS.FORM_SUBMIT);

    // Check username availability
    const isUsernameAvailable = await authApi.checkUsernameAvailability(data.username);
    if (!isUsernameAvailable) {
      throw new Error("Bu username allaqachon olingan");
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          username: data.username.toLowerCase(),
          phone: data.phone,
          is_professional: false,
        },
      },
    });

    if (error) {
      // Provide user-friendly error messages
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        throw new Error("Bu email allaqachon ro'yxatdan o'tgan. Iltimos, tizimga kirishni urinib ko'ring.");
      }
      throw new Error(error.message);
    }

    const user = authData.user;
    if (!user) throw new Error("Ro'yxatdan o'tishda xatolik");

    // Ensure profile is created with username and phone
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: data.name,
        username: data.username.toLowerCase(),
        phone: data.phone,
        avatar_url: null,
        role: 'user',
        is_professional: false,
        is_blocked: false,
        bio: null,
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    return {
      user: {
        id: user.id,
        name: data.name,
        email: user.email || '',
        role: 'user',
        username: data.username.toLowerCase(),
        phone: data.phone,
        isProfessional: false,
        isBlocked: false,
      },
      token: authData.session?.access_token || '',
    };
  },

  /**
   * Logout and clear session
   */
  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
    sessionStorageUtil.clear();
    // Clear legacy localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<AuthResponse["user"]> => {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      const appError = handleError(error || new Error("Failed to get profile"), 'getProfile');
      throw new Error(appError.message);
    }

    // Fetch profile from public.profiles table
    // Selecting only existing columns if migration wasn't run yet
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id, full_name, username, phone, avatar_url, role, 
        is_professional, bio, is_blocked, address, 
        telegram, instagram, facebook, youtube
      `)
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
        isBlocked: false,
      };
    }

    if (profile.is_blocked) {
      await supabase.auth.signOut();
      throw new Error("Sizning hisobingiz bloklangan.");
    }

    return {
      id: user.id,
      name: profile.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      role: profile.role || 'user',
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      isProfessional: profile.is_professional,
      isBlocked: profile.is_blocked,
      username: profile.username,
      phone: profile.phone,
      address: profile.address,
      telegram: profile.telegram,
      instagram: profile.instagram,
      facebook: profile.facebook,
      youtube: profile.youtube
    };
  },

  /**
   * Save auth data - uses Supabase session instead of localStorage
   * Only stores minimal non-sensitive data in sessionStorage
   */
  saveAuth: (data: AuthResponse) => {
    // Store minimal data in sessionStorage (cleared on tab close)
    // Token is managed by Supabase auth session
    if (data.user.id && data.user.role) {
      sessionStorageUtil.saveUser(data.user.id, data.user.role);
    }
    // Store minimal non-sensitive data in localStorage for backward compatibility
    // Only store ID and role, not full user object
    const minimalUser = {
      id: data.user.id,
      role: data.user.role,
    };
    try {
      localStorage.setItem("user", JSON.stringify(minimalUser));
    } catch (error) {
      // Silently ignore localStorage errors (quota exceeded, etc.)
    }
  },

  /**
   * Get saved user from localStorage or sessionStorage
   * Returns minimal user data for initial state
   */
  getSavedUser: (): AuthResponse["user"] | null => {
    try {
      // First try to get from sessionStorage (more secure)
      const sessionUserId = sessionStorageUtil.getUserId();
      const sessionUserRole = sessionStorageUtil.getUserRole();

      if (sessionUserId && sessionUserRole) {
        // Return minimal user object for initial state
        return {
          id: sessionUserId,
          role: sessionUserRole as 'user' | 'blogger' | 'super_admin',
          name: '',
          email: '',
          isProfessional: false,
          isBlocked: false,
        };
      }

      // Fallback to localStorage for backward compatibility
      const user = localStorage.getItem("user");
      if (!user) return null;
      const parsed = JSON.parse(user);

      // Return minimal user if it exists
      if (parsed && parsed.id && parsed.role) {
        return {
          id: parsed.id,
          role: parsed.role,
          name: parsed.name || '',
          email: parsed.email || '',
          isProfessional: parsed.isProfessional || false,
          isBlocked: parsed.isBlocked || false,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   * Uses Supabase session instead of localStorage token
   */
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      return false;
    }
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
  updateProfile: async (updates: {
    name?: string;
    bio?: string;
    avatarUrl?: string;
    address?: string;
    telegram?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    phone?: string;
    username?: string;
  }): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: updates.name,
        avatar_url: updates.avatarUrl,
        bio: updates.bio,
        address: updates.address,
        telegram: updates.telegram,
        instagram: updates.instagram,
        facebook: updates.facebook,
        youtube: updates.youtube,
        phone: updates.phone,
        username: updates.username,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Update auth metadata if name changed
    if (updates.name) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: updates.name }
      });
      if (authError) {
        // Silently ignore auth metadata update errors
      }
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
  /**
   * Admin: Delete user from platform
   */
  deleteUser: async (userId: string): Promise<void> => {
    const { error } = await supabase.rpc('delete_user_by_admin', { user_id: userId });
    if (error) throw error;
  },

  /**
   * Admin: Block/Unblock user
   */
  toggleBlock: async (userId: string, isBlocked: boolean): Promise<void> => {
    const { error } = await supabase.rpc('toggle_user_block', {
      target_user_id: userId,
      block_status: isBlocked
    });
    if (error) throw error;
  },

  /**
   * Admin: Update user role
   */
  updateUserRole: async (userId: string, role: string): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  },

  /**
   * Request password reset email
   */
  resetPassword: async (email: string): Promise<void> => {
    checkRateLimit('password-reset', RATE_LIMITS.API_CALL_STRICT);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset-password`,
    });

    if (error) {
      throw new Error("Parol tiklash xabarini yuborishda xatolik: " + error.message);
    }
  },

  /**
   * Update password with reset token (from email link)
   */
  updatePasswordWithToken: async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error("Parolni yangilashda xatolik: " + error.message);
    }
  },

  /**
   * Change password (requires current password)
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    checkRateLimit('password-change', RATE_LIMITS.FORM_SUBMIT);

    // First verify current password by re-authenticating
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      throw new Error("Foydalanuvchi topilmadi");
    }

    // Try to sign in with current password to verify it
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error("Joriy parol noto'g'ri");
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new Error("Yangi parolni o'rnatishda xatolik: " + updateError.message);
    }
  },
};
