
// Re-export all storage functions
export { 
  uploadEncryptedFile, 
  downloadEncryptedFile, 
  deleteFile,
  hasEnoughStorageSpace,
  formatBytes
} from './fileOperations';

export { 
  listUserFiles, 
  getFileMetadata,
  type FileMetadata
} from './fileManagement';

export {
  getUserStorageUsage,
  ensureStorageBucket
} from './storageUtils';

// Export storage constants
export { STORAGE_BUCKET_NAME } from './constants';
