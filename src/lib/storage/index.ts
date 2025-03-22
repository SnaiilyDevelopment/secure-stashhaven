
// Re-export all storage functions
export { 
  uploadEncryptedFile, 
  downloadEncryptedFile, 
  deleteFile 
} from './fileOperations';

export { 
  listUserFiles, 
  getFileMetadata,
  type FileMetadata
} from './fileManagement';
