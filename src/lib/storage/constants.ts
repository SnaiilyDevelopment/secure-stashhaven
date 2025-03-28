// Storage configuration constants
export const STORAGE_BUCKET_NAME = 'secure-files';

// Default storage limit in bytes (1GB)
export const DEFAULT_STORAGE_LIMIT = 1 * 1024 * 1024 * 1024;

// Maximum file size in bytes (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed file types and their respective size limits
export const ALLOWED_FILE_TYPES: Record<string, number> = {
  // Documents
  'application/pdf': MAX_FILE_SIZE,
  'application/msword': MAX_FILE_SIZE,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': MAX_FILE_SIZE,
  'application/vnd.ms-excel': MAX_FILE_SIZE,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': MAX_FILE_SIZE,
  'application/vnd.ms-powerpoint': MAX_FILE_SIZE,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': MAX_FILE_SIZE,
  'text/plain': 10 * 1024 * 1024, // 10MB for text files
  
  // Images
  'image/jpeg': 20 * 1024 * 1024,
  'image/png': 20 * 1024 * 1024,
  'image/gif': 20 * 1024 * 1024,
  'image/svg+xml': 10 * 1024 * 1024,
  
  // Archives
  'application/zip': MAX_FILE_SIZE,
  'application/x-rar-compressed': MAX_FILE_SIZE,
  'application/gzip': MAX_FILE_SIZE,
  
  // Other
  'application/json': 10 * 1024 * 1024,
  'text/csv': 20 * 1024 * 1024,
};
