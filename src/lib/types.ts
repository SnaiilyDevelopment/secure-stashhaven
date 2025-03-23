
// Re-export types from other modules for consistent imports
export type { FileMetadata } from './storage/fileManagement';
export type { SharedFile, FileRecipient } from './filesharing/types';

// Create adapter types to bridge between different data structures
export interface FileItemAdapter {
  id: string;
  name: string;
  size: number;
  type: string;
  encryptedType?: string;
  dateAdded: string;
  encrypted: boolean;
  isShared?: boolean;
  owner?: string;
}

// Helper function to convert FileMetadata to FileItem
export const adaptFileMetadataToFileItem = (file: FileMetadata): FileItemAdapter => {
  return {
    id: file.id,
    name: file.original_name,
    size: file.size,
    type: file.original_type,
    encryptedType: 'application/encrypted',
    dateAdded: file.created_at,
    encrypted: file.encrypted
  };
};

// Helper function to convert SharedFile to FileItem
export const adaptSharedFileToFileItem = (file: SharedFile): FileItemAdapter => {
  return {
    id: file.id,
    name: file.original_name,
    size: file.size,
    type: file.original_type,
    encryptedType: 'application/encrypted',
    dateAdded: file.shared_at,
    encrypted: true,
    isShared: true,
    owner: file.owner_email
  };
};
