/**
 * Centralized logging utility
 * Logs to console in development and sends errors to Sentry in production
 */

import * as Sentry from '@sentry/react';

const isDev = import.meta.env.DEV;

/**
 * Convert arguments to a serializable format for Sentry
 */
function formatForSentry(args: unknown[]): string {
  return args
    .map(arg => {
      if (arg instanceof Error) return arg.message;
      if (typeof arg === 'object') return JSON.stringify(arg);
      return String(arg);
    })
    .join(' ');
}

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    if (isDev) {
      console.error(...args);
    }

    // In production, send to Sentry
    if (import.meta.env.PROD) {
      const message = formatForSentry(args);

      // If first argument is an Error object, capture it as exception
      if (args[0] instanceof Error) {
        Sentry.captureException(args[0], {
          extra: {
            additionalInfo: args.slice(1),
          },
        });
      } else {
        // Otherwise capture as message
        Sentry.captureMessage(message, 'error');
      }
    }
  },

  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }

    // In production, send warnings to Sentry
    if (import.meta.env.PROD) {
      const message = formatForSentry(args);
      Sentry.captureMessage(message, 'warning');
    }
  },

  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
};
