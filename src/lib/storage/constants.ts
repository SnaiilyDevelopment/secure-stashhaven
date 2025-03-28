
export const STORAGE_BUCKET_NAME = 'secure-files';
export const DEFAULT_STORAGE_LIMIT = 1024 * 1024 * 1024; // 1 GB default
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Text
  'text/plain',
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-tar',
  'application/gzip',
  
  // Allow all file types in development
  '*/*'
];
