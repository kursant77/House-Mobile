/**
 * Centralized error handling utility
 * Provides user-friendly error messages and error logging
 */

import * as Sentry from '@sentry/react';

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  originalError?: unknown;
}

export class CustomError extends Error {
  code?: string;
  statusCode?: number;
  originalError?: unknown;

  constructor(message: string, code?: string, statusCode?: number, originalError?: unknown) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Error message dictionary in Uzbek
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'auth/invalid-email': 'Email noto\'g\'ri formatda',
  'auth/user-not-found': 'Foydalanuvchi topilmadi',
  'auth/wrong-password': 'Parol noto\'g\'ri',
  'auth/email-already-in-use': 'Bu email allaqachon ishlatilmoqda',
  'auth/weak-password': 'Parol juda zaif',
  'auth/network-request-failed': 'Internet aloqasi yo\'q. Iltimos, qayta urinib ko\'ring',
  'auth/too-many-requests': 'Juda ko\'p so\'rovlar yuborildi. Iltimos, biroz kutib turing',
  
  // Database errors
  'PGRST116': 'Ma\'lumot topilmadi',
  '23505': 'Bu ma\'lumot allaqachon mavjud',
  '23503': 'Bog\'liq ma\'lumot topilmadi',
  '23514': 'Ma\'lumotlar noto\'g\'ri',
  
  // Storage errors
  'storage/object-not-found': 'Fayl topilmadi',
  'storage/unauthorized': 'Fayl yuklashga ruxsat yo\'q',
  'storage/upload-failed': 'Fayl yuklashda xatolik',
  'storage/quota-exceeded': 'Xotira to\'ldi. Iltimos, eski fayllarni o\'chiring',
  
  // Rate limiting
  'rate-limit-exceeded': 'Juda ko\'p so\'rovlar yuborildi. Iltimos, biroz kutib turing',
  
  // Generic errors
  'network-error': 'Internet aloqasi yo\'q. Iltimos, qayta urinib ko\'ring',
  'timeout': 'So\'rov vaqti tugadi. Iltimos, qayta urinib ko\'ring',
  'unknown': 'Noma\'lum xatolik yuz berdi. Iltimos, qayta urinib ko\'ring',
};

/**
 * Convert error to user-friendly message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof CustomError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Check if error message exists in dictionary
    const errorCode = (error as { code?: string }).code;
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      return ERROR_MESSAGES[errorCode];
    }

    // Check Supabase error codes
    if ('code' in error) {
      const code = String(error.code);
      if (ERROR_MESSAGES[code]) {
        return ERROR_MESSAGES[code];
      }
    }

    // Return original message if it's user-friendly
    if (error.message && !error.message.includes('Error:') && !error.message.includes('Failed')) {
      return error.message;
    }
  }

  // Check for network errors
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return ERROR_MESSAGES['network-error'];
      }
    }
  }

  return ERROR_MESSAGES['unknown'];
};

/**
 * Log error for debugging
 */
export const logError = (error: unknown, context?: string): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  // Only log in development
  if (import.meta.env.DEV) {
    console.error(`[Error${context ? ` in ${context}` : ''}]`, {
      message: errorMessage,
      stack: errorStack,
      error,
    });
  }

  // In production, send to Sentry
  if (import.meta.env.PROD) {
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: { context: context || 'unknown' },
        extra: {
          errorMessage,
          errorStack,
        },
      });
    } else {
      Sentry.captureMessage(`Non-Error thrown: ${errorMessage}`, {
        level: 'error',
        tags: { context: context || 'unknown' },
      });
    }
  }
};

/**
 * Handle error with user-friendly message and logging
 */
export const handleError = (error: unknown, context?: string): AppError => {
  logError(error, context);
  
  const message = getErrorMessage(error);
  const code = (error as { code?: string }).code;
  const statusCode = (error as { status?: number }).status || (error as { statusCode?: number }).statusCode;

  return {
    message,
    code,
    statusCode,
    originalError: error,
  };
};

/**
 * Retry function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};
