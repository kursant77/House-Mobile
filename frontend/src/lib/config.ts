// Global configuration constants for the app
// Central place for tunable limits and defaults

// File size limits
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
export const SUPABASE_STORAGE_LIMIT = 50 * 1024 * 1024; // 50MB

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const NOTIFICATION_PAGE_SIZE = 20;

// React Query defaults
export const REACT_QUERY_STALE_TIME_MS = 60 * 1000; // 1 minute
export const REACT_QUERY_GC_TIME_MS = 15 * 60 * 1000; // 15 minutes
export const REACT_QUERY_REFETCH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
export const REACT_QUERY_RETRY_DELAY_MS = 1000; // 1 second

// House AI backend
export const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "http://localhost:8100";
