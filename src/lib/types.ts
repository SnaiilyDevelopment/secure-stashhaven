
// Re-export types from other modules for consistent imports
export type { FileMetadata } from './storage/fileManagement';
export type { SharedFile, FileRecipient } from './filesharing/types';
export type { FileItemAdapter } from './adapters/fileAdapter';
export type { FileItem } from '@/components/dashboard/FileCard';
export { adaptFileMetadataToFileItem, adaptSharedFileToFileItem } from './adapters/fileAdapter';
