export const STORAGE_BUCKET_NAME = 'secure-files';
export const DEFAULT_STORAGE_LIMIT = 1024 * 1024 * 1024; // 1 GB default
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

// Allow all file types with proper typing
export const ALLOWED_FILE_TYPES: string | string[] = '*/*';

// Authentication timeouts
export const AUTH_CHECK_TIMEOUT = 15000; // Increased from previous value to prevent timeouts
export const AUTH_CHECK_FAST_TIMEOUT = 5000; // Fast path timeout for quick auth checks
