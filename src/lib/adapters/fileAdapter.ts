
import { FileMetadata } from '../storage/fileManagement';
import { SharedFile } from '../filesharing/types';

/**
 * Unified file item adapter to represent files across different sources
 */
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
  filePath: string; // Add this property to match FileItem interface
}

/**
 * Converts a FileMetadata object to the unified FileItemAdapter format
 */
export const adaptFileMetadataToFileItem = (file: FileMetadata): FileItemAdapter => {
  return {
    id: file.id,
    name: file.original_name,
    size: file.size,
    type: file.original_type,
    encryptedType: 'application/encrypted',
    dateAdded: file.created_at,
    encrypted: file.encrypted,
    filePath: file.file_path // Add this property mapping
  };
};

/**
 * Converts a SharedFile object to the unified FileItemAdapter format
 */
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
    owner: file.owner_email,
    filePath: file.file_path // Add this property mapping
  };
};
