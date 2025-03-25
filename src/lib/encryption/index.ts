
/**
 * Encryption utilities for end-to-end encryption
 * Implements secure encryption practices inspired by Matrix E2EE concepts
 */

// Export core encryption utilities
export {
  generateEncryptionKey,
  deriveKeyFromPassword,
  importEncryptionKey,
  exportEncryptionKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  zeroBuffer
} from './core';

// Export text encryption (using named imports to avoid conflicts with core)
export { 
  encryptText,
  decryptText,
  TextEncryptionError,
  TextDecryptionError,
  encryptTextSecure,
  decryptTextSecure
} from './textEncryption';

// Export file encryption
export {
  encryptFile,
  decryptFile,
  EncryptionError,
  IVReuseError
} from './fileEncryption';

// Export device keys utilities
export * from './deviceKeys';
