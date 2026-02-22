/**
 * CLIENT-SIDE RATE LIMITER
 * Bu XAVFSIZLIK uchun EMAS — faqat UX qulaylik uchun (double-click prevention).
 * Haqiqiy xavfsizlik Supabase RLS va Backend middleware orqali ta'minlanadi.
 */

interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
}

interface RateLimitState {
  calls: number[];
  lastReset: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitState> = new Map();

  /**
   * Check if action is allowed based on rate limit
   */
  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const state = this.limits.get(key) || { calls: [], lastReset: now };

    // Remove calls outside the time window
    const validCalls = state.calls.filter(timestamp => now - timestamp < config.windowMs);

    // Check if limit exceeded
    if (validCalls.length >= config.maxCalls) {
      return false;
    }

    // Add current call
    validCalls.push(now);
    this.limits.set(key, { calls: validCalls, lastReset: now });

    return true;
  }

  /**
   * Get time until next allowed call
   */
  getTimeUntilReset(key: string, config: RateLimitConfig): number {
    const state = this.limits.get(key);
    if (!state || state.calls.length === 0) return 0;

    const now = Date.now();
    const validCalls = state.calls.filter(timestamp => now - timestamp < config.windowMs);

    if (validCalls.length < config.maxCalls) return 0;

    const oldestCall = Math.min(...validCalls);
    return config.windowMs - (now - oldestCall);
  }

  /**
   * Clear rate limit for a key
   */
  clear(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
  // API calls
  API_CALL: { maxCalls: 60, windowMs: 60000 }, // 60 calls per minute
  API_CALL_STRICT: { maxCalls: 10, windowMs: 10000 }, // 10 calls per 10 seconds

  // File uploads
  FILE_UPLOAD: { maxCalls: 5, windowMs: 60000 }, // 5 uploads per minute

  // Form submissions
  FORM_SUBMIT: { maxCalls: 10, windowMs: 60000 }, // 10 submissions per minute

  // Search
  SEARCH: { maxCalls: 20, windowMs: 10000 }, // 20 searches per 10 seconds

  // Comments
  COMMENT: { maxCalls: 30, windowMs: 60000 }, // 30 comments per minute

  // Likes
  LIKE: { maxCalls: 100, windowMs: 60000 }, // 100 likes per minute
} as const;

/**
 * Check rate limit and throw error if exceeded
 */
export const checkRateLimit = (
  key: string,
  config: RateLimitConfig = RATE_LIMITS.API_CALL
): void => {
  if (!rateLimiter.isAllowed(key, config)) {
    const timeUntilReset = rateLimiter.getTimeUntilReset(key, config);
    const seconds = Math.ceil(timeUntilReset / 1000);
    throw new Error(
      `Juda ko'p so'rovlar yuborildi. Iltimos, ${seconds} soniyadan keyin qayta urinib ko'ring.`
    );
  }
};

/**
 * Decorator for rate-limited functions
 */
export const rateLimit = (
  config: RateLimitConfig = RATE_LIMITS.API_CALL,
  getKey?: (...args: unknown[]) => string
) => {
  return function <T extends (...args: unknown[]) => Promise<unknown>>(
    target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) return descriptor;

    descriptor.value = (async function (this: unknown, ...args: unknown[]) {
      const key = getKey ? getKey(...args) : `${target?.constructor?.name || 'unknown'}.${propertyKey}`;
      checkRateLimit(key, config);
      return originalMethod.apply(this, args);
    }) as T;

    return descriptor;
  };
};

/**
 * Throttle function - limits function execution frequency
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, delay - timeSinceLastCall);
    }
  };
};

/**
 * Debounce function - delays execution until after wait time
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

export { rateLimiter };
