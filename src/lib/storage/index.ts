
// Re-export all storage functions
export { 
  uploadFile, 
  deleteFile,
  getUserFiles,
  getUserStorageUsage,
  type FileMetadata
} from './fileOperations';

export { 
  listUserFiles, 
  getFileMetadata
} from './fileManagement';

export {
  formatBytes,
  ensureStorageBucket
} from './storageUtils';
