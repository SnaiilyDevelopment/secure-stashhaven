
/**
 * File encryption utilities for end-to-end encryption
 */

import { importEncryptionKey, arrayBufferToBase64 } from './core';
import { toast } from '@/components/ui/use-toast';
import crypto from 'crypto';

// IV tracking for reuse protection
interface IVMetadata {
  iv: string;
  timestamp: number;
  useCount: number;
}

// Stats interface for IVReuseAlert component
export interface IVUsageStats {
  count: number;
  maxCount: number;
  oldestTimestamp: number | null;
  removalPeriod: number;
}

// Maximum number of IVs to track (default: 1000)
const DEFAULT_MAX_IV_COUNT = 1000;

// Period after which IVs are removed from tracking (default: 24 hours in milliseconds)
const DEFAULT_IV_REMOVAL_PERIOD = 24 * 60 * 60 * 1000;

// Store used IVs with timestamps and counts
let usedIVs: IVMetadata[] = [];

// Clean up old IVs
const cleanupOldIVs = (maxIVCount: number = DEFAULT_MAX_IV_COUNT, removalPeriod: number = DEFAULT_IV_REMOVAL_PERIOD) => {
  const now = Date.now();
  
  // Remove IVs older than removalPeriod
  usedIVs = usedIVs.filter(ivData => (now - ivData.timestamp) < removalPeriod);
  
  // If we still have too many IVs, remove the oldest ones
  if (usedIVs.length > maxIVCount) {
    // Sort by timestamp (oldest first) and remove excess
    usedIVs.sort((a, b) => a.timestamp - b.timestamp);
    usedIVs = usedIVs.slice(usedIVs.length - maxIVCount);
    
    // Show a warning that we're removing IVs
    toast({
      title: "Security Notice",
      description: "Some encryption IVs were rotated due to maximum count reached.",
      variant: "default"
    });
  }
};

// Provide IV usage statistics for the IVReuseAlert component
export const getIVUsageStats = (): IVUsageStats => {
  const timestamps = usedIVs.map(iv => iv.timestamp);
  const oldestTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : null;
  
  return {
    count: usedIVs.length,
    maxCount: DEFAULT_MAX_IV_COUNT,
    oldestTimestamp,
    removalPeriod: DEFAULT_IV_REMOVAL_PERIOD
  };
};

// Check if an IV has been used before and track it
const trackIV = (iv: Uint8Array, maxIVCount: number = DEFAULT_MAX_IV_COUNT, removalPeriod: number = DEFAULT_IV_REMOVAL_PERIOD): boolean => {
  const ivBase64 = arrayBufferToBase64(iv.buffer);
  const now = Date.now();
  
  // Clean up old IVs first
  cleanupOldIVs(maxIVCount, removalPeriod);
  
  // Check if this IV has been used before
  const existingIV = usedIVs.find(ivData => ivData.iv === ivBase64);
  
  if (existingIV) {
    // Increment use count for this IV
    existingIV.useCount++;
    existingIV.timestamp = now; // Update timestamp to keep it fresh
    
    // Show a security alert when an IV is reused
    toast({
      title: "Security Warning",
      description: "Encryption IV reuse detected. This may reduce security.",
      variant: "destructive"
    });
    
    return true; // IV has been used before
  }
  
  // Track this new IV
  usedIVs.push({
    iv: ivBase64,
    timestamp: now,
    useCount: 1
  });
  
  return false; // IV has not been used before
};

// Define custom error types for encryption operations
export class EncryptionError extends Error {
  constructor(message: string, public errorType: string = 'ENCRYPTION_ERROR', public details?: any) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class IVReuseError extends EncryptionError {
  constructor(message: string, details?: any) {
    super(message, 'IV_REUSE_ERROR', details);
    this.name = 'IVReuseError';
  }
}

// Encrypt a file with the user's encryption key
export const encryptFile = async (
  file: File, 
  encryptionKey: string, 
  options?: { 
    maxIVCount?: number, 
    removalPeriod?: number,
    fallbackDisabled?: boolean
  }
): Promise<Blob> => {
  const { maxIVCount = DEFAULT_MAX_IV_COUNT, removalPeriod = DEFAULT_IV_REMOVAL_PERIOD, fallbackDisabled = false } = options || {};
  
  try {
    const key = await importEncryptionKey(encryptionKey);
    const fileArrayBuffer = await file.arrayBuffer();
    
    // Generate a random IV for this encryption
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Track this IV to prevent reuse
    const isReused = trackIV(iv, maxIVCount, removalPeriod);
    
    // If this IV has been used before and fallback is disabled, fail the operation
    if (isReused && fallbackDisabled) {
      throw new IVReuseError("Encryption canceled due to IV reuse. This is a security measure.");
    }
    
    // Add additional authentication data for enhanced security
    const additionalData = new TextEncoder().encode(`file:${file.name}:${file.type}`);
    
    // Encrypt the file
    const encryptedContent = await window.crypto.subtle.encrypt(
      { 
        name: 'AES-GCM', 
        iv,
        additionalData // Properly encoded as BufferSource
      },
      key,
      fileArrayBuffer
    );
    
    // Combine IV and encrypted content
    const encryptedBlob = new Blob([
      iv.buffer,
      encryptedContent
    ], { type: 'application/encrypted' });
    
    return encryptedBlob;
  } catch (error) {
    console.error("File encryption error:", error);
    
    // Handle different types of errors appropriately
    if (error instanceof IVReuseError) {
      toast({
        title: "Encryption Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
    
    // Generic encryption error
    const errorMessage = error instanceof Error ? error.message : "Unknown encryption error";
    toast({
      title: "Encryption Failed",
      description: errorMessage,
      variant: "destructive"
    });
    
    throw new EncryptionError("Failed to encrypt file", "ENCRYPTION_FAILED", error);
  }
};

// Decrypt a file with the user's encryption key
export const decryptFile = async (encryptedBlob: Blob, encryptionKey: string, originalType: string, fileName: string = ''): Promise<Blob> => {
  try {
    const key = await importEncryptionKey(encryptionKey);
    const encryptedData = await encryptedBlob.arrayBuffer();
    
    // Extract IV (first 12 bytes)
    const iv = new Uint8Array(encryptedData.slice(0, 12));
    
    // Extract encrypted content (everything after IV)
    const encryptedContent = encryptedData.slice(12);
    
    // Fix: Only create additionalData if fileName is provided
    const additionalData = fileName ? new TextEncoder().encode(`file:${fileName}:${originalType}`) : undefined;
    
    try {
      // Decrypt the file
      const decryptedContent = await window.crypto.subtle.decrypt(
        { 
          name: 'AES-GCM', 
          iv,
          ...(additionalData ? { additionalData } : {})
        },
        key,
        encryptedContent
      );
      
      // Return as blob with original type
      return new Blob([decryptedContent], { type: originalType || 'application/octet-stream' });
    } catch (error) {
      console.error('Decryption failed:', error);
      
      // Show more detailed error message
      toast({
        title: "Decryption Failed",
        description: "Unable to decrypt file. The encryption key may be incorrect or the file may be corrupted.",
        variant: "destructive"
      });
      
      throw new EncryptionError("Failed to decrypt file", "DECRYPTION_FAILED", error);
    }
  } catch (error) {
    console.error('Decryption process error:', error);
    
    // Rethrow with better error details
    const errorMessage = error instanceof Error ? error.message : "Unknown decryption error";
    throw new EncryptionError(errorMessage, "DECRYPTION_PROCESS_FAILED", error);
  }
};
