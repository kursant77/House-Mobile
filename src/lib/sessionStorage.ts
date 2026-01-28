/**
 * Secure session storage utility
 * Uses sessionStorage instead of localStorage for better security
 * SessionStorage is cleared when browser tab is closed
 */

const SESSION_KEYS = {
  USER_ID: 'user_id',
  USER_ROLE: 'user_role',
  SESSION_EXPIRY: 'session_expiry',
} as const;

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const sessionStorage = {
  /**
   * Save minimal user data to sessionStorage
   * Only stores non-sensitive information
   */
  saveUser: (userId: string, role: string): void => {
    try {
      const expiry = Date.now() + SESSION_DURATION;
      window.sessionStorage.setItem(SESSION_KEYS.USER_ID, userId);
      window.sessionStorage.setItem(SESSION_KEYS.USER_ROLE, role);
      window.sessionStorage.setItem(SESSION_KEYS.SESSION_EXPIRY, expiry.toString());
    } catch (error) {
      console.error('Failed to save user session:', error);
    }
  },

  /**
   * Get user ID from sessionStorage
   */
  getUserId: (): string | null => {
    try {
      const expiry = window.sessionStorage.getItem(SESSION_KEYS.SESSION_EXPIRY);
      if (!expiry) return null;
      
      if (Date.now() > parseInt(expiry, 10)) {
        sessionStorage.clear();
        return null;
      }
      
      return window.sessionStorage.getItem(SESSION_KEYS.USER_ID);
    } catch (error) {
      console.error('Failed to get user session:', error);
      return null;
    }
  },

  /**
   * Get user role from sessionStorage
   */
  getUserRole: (): string | null => {
    try {
      const expiry = window.sessionStorage.getItem(SESSION_KEYS.SESSION_EXPIRY);
      if (!expiry) return null;
      
      if (Date.now() > parseInt(expiry, 10)) {
        sessionStorage.clear();
        return null;
      }
      
      return window.sessionStorage.getItem(SESSION_KEYS.USER_ROLE);
    } catch (error) {
      console.error('Failed to get user role:', error);
      return null;
    }
  },

  /**
   * Check if session is valid
   */
  isValid: (): boolean => {
    try {
      const expiry = window.sessionStorage.getItem(SESSION_KEYS.SESSION_EXPIRY);
      if (!expiry) return false;
      
      return Date.now() <= parseInt(expiry, 10);
    } catch (error) {
      return false;
    }
  },

  /**
   * Clear all session data
   */
  clear: (): void => {
    try {
      Object.values(SESSION_KEYS).forEach(key => {
        window.sessionStorage.removeItem(key);
      });
      // Also clear legacy localStorage items
      window.localStorage.removeItem('auth_token');
      window.localStorage.removeItem('user');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  },
};
