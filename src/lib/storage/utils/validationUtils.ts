
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../constants';
import { formatBytes } from './formatUtils';

// Validate file type and size
export const validateFile = (file: File): { valid: boolean; message?: string } => {
  // Allow any file type
  if (ALLOWED_FILE_TYPES === '*/*') {
    // Only check file size
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        message: `File too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.` 
      };
    }
    return { valid: true };
  }
  
  // For specific file type restrictions (when not using '*/*')
  if (typeof ALLOWED_FILE_TYPES === 'string') {
    const fileTypePattern = new RegExp(ALLOWED_FILE_TYPES.replace('*', '.*'));
    if (!fileTypePattern.test(file.type)) {
      return { 
        valid: false, 
        message: `File type not allowed. Supported format: ${ALLOWED_FILE_TYPES}` 
      };
    }
  } else if (Array.isArray(ALLOWED_FILE_TYPES)) {
    const allowsAllTypes = ALLOWED_FILE_TYPES.includes('*/*');
    if (!allowsAllTypes && !ALLOWED_FILE_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        message: `File type not allowed. Supported formats include PDF, Word, Excel, PowerPoint, images, and common archive formats.` 
      };
    }
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      message: `File too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.` 
    };
  }
  
  return { valid: true };
};
