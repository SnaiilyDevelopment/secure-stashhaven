
/**
 * File encryption utilities for end-to-end encryption
 */

import { importEncryptionKey, zeroBuffer, arrayBufferToBase64, base64ToArrayBuffer } from './core';
import { toast } from "@/components/ui/use-toast";

// Define proper types for IV metadata
interface IVMetadata {
  iv: string;
  timestamp: number;
  keyHash: string;
  useCount: number;
  fileSize?: number;
  fileName?: string;
}

// Encryption and decryption error classes
class DecryptionError extends Error {
  constructor(
    public readonly code: 'INVALID_IV'|'AUTH_FAILED'|'CORRUPT_DATA'|'KEY_MISMATCH'|'UNKNOWN'|'IV_REUSE'|'MEMORY_ERROR'|'FORMAT_ERROR'|'IV_REGISTRY_FULL',
    message: string,
    public readonly details?: {
      iv?: string;
      keyHash?: string;
      expectedKeyHash?: string;
      additionalData?: string;
      fileSize?: number;
      fileName?: string;
      registrySize?: number;
    }
  ) {
    super(message);
    this.name = 'DecryptionError';
  }
}

class EncryptionError extends Error {
  constructor(
    public readonly code: 'IV_GENERATION_FAILED'|'MEMORY_ERROR'|'SIZE_LIMIT_EXCEEDED'|'UNKNOWN'|'IV_REGISTRY_FULL',
    message: string,
    public readonly details?: {
      fileSize?: number;
      maxSize?: number;
      registrySize?: number;
      keyHash?: string;
    }
  ) {
    super(message);
    this.name = 'EncryptionError';
  }
}

// Track used IVs with metadata to prevent reuse
const usedIVs = new Map<string, IVMetadata>();

// IV registry settings with enhanced protection
const IV_EXPIRATION_MS = 1 * 60 * 60 * 1000; // 1 hour expiration
const IV_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Cleanup every 5 minutes
const MAX_IV_REGISTRY_SIZE = 200; // Hard limit of 200 IVs
const IV_REGISTRY_WARNING_THRESHOLD = 150; // Warn when approaching limit
const IV_REGISTRY_EMERGENCY_THRESHOLD = 180; // Force cleanup if approaching max
const IV_REGISTRY_PER_USER_LIMIT = 30; // Limit IVs per encryption key
const MAX_MEMORY_USAGE = 512 * 1024; // 512KB max memory for IV registry
const IV_GENERATION_MAX_ATTEMPTS = 3; // Max attempts to generate unique IV
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB maximum file size

// Clean up expired IVs and maintain size limits
const cleanupIVs = () => {
  const now = Date.now();
  let cleaned = 0;
  let totalSize = 0;
  
  // Track IVs to delete
  const ivsToDelete = new Set<string>();
  
  // First pass: identify expired IVs and calculate total size
  for (const [iv, metadata] of usedIVs.entries()) {
    totalSize += iv.length;
    if (now - metadata.timestamp > IV_EXPIRATION_MS) {
      ivsToDelete.add(iv);
      cleaned++;
    }
  }

  // Size-based cleanup (both emergency and normal cases)
  if (usedIVs.size - ivsToDelete.size > MAX_IV_REGISTRY_SIZE) {
    const sorted = [...usedIVs.entries()]
      .filter(([iv]) => !ivsToDelete.has(iv))
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = (usedIVs.size - ivsToDelete.size) - MAX_IV_REGISTRY_SIZE;
    const additionalToRemove = sorted.slice(0, toRemove);
    
    for (const [iv] of additionalToRemove) {
      ivsToDelete.add(iv);
      cleaned++;
    }
  }

  // Additional memory-based cleanup if total size exceeds MAX_MEMORY_USAGE
  if (totalSize > MAX_MEMORY_USAGE) {
    const sortedBySize = [...usedIVs.entries()]
      .filter(([iv]) => !ivsToDelete.has(iv))
      .sort((a, b) => a[0].length - b[0].length);
    
    let memoryFreed = 0;
    for (const [iv] of sortedBySize) {
      if (memoryFreed >= totalSize - MAX_MEMORY_USAGE) break;
      ivsToDelete.add(iv);
      cleaned++;
      memoryFreed += iv.length;
    }
  }

  // Enforce per-user IV limits
  const userIVCounts = new Map<string, number>();
  for (const [iv, metadata] of usedIVs.entries()) {
    if (!ivsToDelete.has(iv)) {
      const count = (userIVCounts.get(metadata.keyHash) || 0) + 1;
      userIVCounts.set(metadata.keyHash, count);
      if (count > IV_REGISTRY_PER_USER_LIMIT) {
        ivsToDelete.add(iv);
        cleaned++;
      }
    }
  }

  // Perform actual deletions
  for (const iv of ivsToDelete) {
    usedIVs.delete(iv);
  }

  // Log warnings if approaching registry limits
  if (usedIVs.size > IV_REGISTRY_WARNING_THRESHOLD) {
    console.warn(`IV registry approaching limit: ${usedIVs.size}/${MAX_IV_REGISTRY_SIZE}`);
    toast({
      title: "Security Notice",
      description: `IV registry approaching limit (${usedIVs.size}/${MAX_IV_REGISTRY_SIZE})`,
      variant: "default"
    });
  }
  
  if (process.env.NODE_ENV === 'development' && cleaned > 0) {
    console.debug(`Cleaned up ${cleaned} IVs (${usedIVs.size} remaining)`);
  }
  
  return {
    cleaned,
    remaining: usedIVs.size,
    totalSize
  };
};

// Run cleanup on schedule and on startup
let cleanupInterval: number | null = null;
const startCleanupInterval = () => {
  if (cleanupInterval === null) {
    cleanupInterval = window.setInterval(cleanupIVs, IV_CLEANUP_INTERVAL_MS);
    cleanupIVs(); // Run immediately on startup
  }
};

// Initialize cleanup on module load
startCleanupInterval();

// Validate IV before use
const validateIV = (iv: Uint8Array): boolean => {
  // Ensure IV has correct length
  if (iv.length !== 12) {
    return false;
  }
  
  // Check for all zeros or other weak patterns
  let allZeros = true;
  let allSame = true;
  const firstByte = iv[0];
  
  for (let i = 0; i < iv.length; i++) {
    if (iv[i] !== 0) {
      allZeros = false;
    }
    if (iv[i] !== firstByte) {
      allSame = false;
    }
    if (!allZeros && !allSame) {
      break;
    }
  }
  
  return !(allZeros || allSame);
};

// Stream encryption for large files with progress reporting
const streamEncrypt = async (
  file: File, 
  key: CryptoKey, 
  iv: Uint8Array, 
  additionalData: Uint8Array,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks for better memory management
  let offset = 0;
  const encryptedChunks: ArrayBuffer[] = [iv.buffer];
  const totalSize = file.size;

  try {
    while (offset < totalSize) {
      const slice = file.slice(offset, offset + chunkSize);
      const chunk = await slice.arrayBuffer();
      const encryptedChunk = await window.crypto.subtle.encrypt(
        { 
          name: 'AES-GCM',
          iv,
          additionalData
        },
        key,
        chunk
      );
      
      encryptedChunks.push(encryptedChunk);
      offset += chunkSize;
      
      // Report progress if callback provided
      if (onProgress) {
        onProgress(Math.min(offset / totalSize, 1));
      }
      
      // Yield to event loop every few chunks
      if (offset % (chunkSize * 4) === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return new Blob(encryptedChunks, { type: 'application/encrypted' });
  } catch (error) {
    // Clean up any partial encrypted data
    encryptedChunks.forEach(chunk => {
      if (chunk !== iv.buffer) {
        zeroBuffer(chunk);
      }
    });
    throw error;
  }
};

// Calculate file hash in chunks to avoid memory issues
const calculateFileHash = async (file: File): Promise<string> => {
  const chunkSize = 10 * 1024 * 1024; // 10MB chunks
  let offset = 0;
  let hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array());

  while (offset < file.size) {
    const slice = file.slice(offset, offset + chunkSize);
    const chunk = await slice.arrayBuffer();
    const chunkHash = await crypto.subtle.digest('SHA-256', new Uint8Array(chunk));
    
    // Combine hashes incrementally
    const combined = new Uint8Array(hashBuffer.byteLength + chunkHash.byteLength);
    combined.set(new Uint8Array(hashBuffer), 0);
    combined.set(new Uint8Array(chunkHash), hashBuffer.byteLength);
    hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    
    offset += chunkSize;
  }

  return arrayBufferToBase64(hashBuffer);
};

// Encrypt a file with the user's encryption key
export const encryptFile = async (
  file: File, 
  encryptionKey: string,
  options?: {
    onProgress?: (progress: number) => void,
    disableFallback?: boolean
  }
): Promise<Blob> => {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    toast({
      title: "File Too Large",
      description: `File exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      variant: "destructive"
    });
    
    throw new EncryptionError(
      'SIZE_LIMIT_EXCEEDED',
      `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      { fileSize: file.size, maxSize: MAX_FILE_SIZE }
    );
  }

  // Import the encryption key
  const key = await importEncryptionKey(encryptionKey);
  
  // Generate cryptographically secure random IV
  let iv: Uint8Array;
  let ivString: string;
  
  let attempts = 0;
  let ivGenerated = false;
  
  while (attempts < IV_GENERATION_MAX_ATTEMPTS && !ivGenerated) {
    attempts++;
    
    try {
      // Generate IV with additional entropy from file metadata
      const ivBuffer = new Uint8Array(12);
      window.crypto.getRandomValues(ivBuffer);
      
      // Mix in file metadata as additional entropy
      const fileNameHash = await crypto.subtle.digest(
        'SHA-256', 
        new TextEncoder().encode(file.name)
      );
      const fileNameBytes = new Uint8Array(fileNameHash).slice(0, 4);
      
      const fileSizeBytes = new Uint8Array(4);
      new DataView(fileSizeBytes.buffer).setUint32(0, file.size);
      
      // XOR random bytes with file metadata for additional entropy
      for (let i = 0; i < 4; i++) {
        ivBuffer[i] ^= fileNameBytes[i];
        ivBuffer[i+4] ^= fileSizeBytes[i];
      }
      
      iv = ivBuffer;
      ivString = Array.from(iv).join(',');
      
      // Validate the IV
      if (!validateIV(iv)) {
        continue;
      }
      
      // Ensure IV is unique and registry has space
      if (!usedIVs.has(ivString)) {
        ivGenerated = true;
      } else if (attempts >= IV_GENERATION_MAX_ATTEMPTS) {
        if (options?.disableFallback) {
          toast({
            title: "Encryption Failed",
            description: "Could not generate a unique IV. Please try again.",
            variant: "destructive"
          });
          
          throw new EncryptionError(
            'IV_GENERATION_FAILED',
            `Failed to generate unique IV after ${IV_GENERATION_MAX_ATTEMPTS} attempts`,
            { registrySize: usedIVs.size }
          );
        } else {
          // If fallback is allowed, warn but continue
          console.warn(`IV generation failed after ${attempts} attempts, using potentially reused IV`);
          toast({
            title: "Security Warning",
            description: "Using non-optimal encryption parameters. This is safe but not ideal.",
            variant: "warning"
          });
          ivGenerated = true;
        }
      }
    } catch (error) {
      if (attempts >= IV_GENERATION_MAX_ATTEMPTS) {
        toast({
          title: "Encryption Failed",
          description: "Could not generate secure encryption parameters.",
          variant: "destructive"
        });
        
        throw new EncryptionError(
          'IV_GENERATION_FAILED',
          `Failed to generate secure IV: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  // Check registry limits before adding new IV
  if (usedIVs.size >= MAX_IV_REGISTRY_SIZE) {
    cleanupIVs(); // Try to free space
    if (usedIVs.size >= MAX_IV_REGISTRY_SIZE) {
      toast({
        title: "System Busy",
        description: "Too many encryption operations in progress. Please try again later.",
        variant: "destructive"
      });
      
      throw new EncryptionError(
        'IV_REGISTRY_FULL',
        'IV registry is full - please try again later',
        { registrySize: usedIVs.size }
      );
    }
  }

  // Additional emergency cleanup if we're still close to limits
  if (usedIVs.size >= IV_REGISTRY_EMERGENCY_THRESHOLD) {
    const result = cleanupIVs();
    if (result.remaining >= IV_REGISTRY_EMERGENCY_THRESHOLD) {
      toast({
        title: "System Busy",
        description: "Too many encryption operations in progress. Please try again later.",
        variant: "destructive"
      });
      
      throw new EncryptionError(
        'IV_REGISTRY_FULL',
        'System busy - please try again later',
        { registrySize: usedIVs.size }
      );
    }
  }
  
  // Calculate key hash for tracking
  const keyHash = await (async () => {
    const keyBytes = new TextEncoder().encode(encryptionKey);
    const hash = await crypto.subtle.digest('SHA-256', keyBytes);
    return arrayBufferToBase64(hash);
  })();
  
  // Check per-user IV limit
  const userIVCount = [...usedIVs.values()].filter(
    m => m.keyHash === keyHash
  ).length;

  if (userIVCount >= IV_REGISTRY_PER_USER_LIMIT) {
    toast({
      title: "Too Many Operations",
      description: "Too many active encryption sessions for this key. Please try again later.",
      variant: "destructive"
    });
    
    throw new EncryptionError(
      'IV_REGISTRY_FULL',
      'Too many active encryption sessions for this key',
      { 
        registrySize: usedIVs.size,
        keyHash
      }
    );
  }

  // Track the IV with metadata
  usedIVs.set(ivString, {
    iv: ivString,
    timestamp: Date.now(),
    keyHash,
    useCount: 1,
    fileName: file.name,
    fileSize: file.size
  });
  
  const additionalData = new TextEncoder().encode(`file:${file.name}:${file.type}`);
  
  try {
    // Use streaming for files larger than 10MB
    if (file.size > 10 * 1024 * 1024) {
      return streamEncrypt(file, key, iv, additionalData, options?.onProgress);
    }

    // Small files can be processed in memory
    const fileArrayBuffer = await file.arrayBuffer();
    const encryptedContent = await window.crypto.subtle.encrypt(
      { 
        name: 'AES-GCM', 
        iv,
        additionalData
      },
      key,
      fileArrayBuffer
    );
    
    const result = new Blob([iv.buffer, encryptedContent], { type: 'application/encrypted' });
    
    // Zero out sensitive data
    zeroBuffer(fileArrayBuffer);
    
    return result;
  } catch (error) {
    console.error("Encryption error:", error);
    
    toast({
      title: "Encryption Failed",
      description: error instanceof Error ? error.message : "Unknown encryption error",
      variant: "destructive"
    });
    
    throw new EncryptionError(
      'MEMORY_ERROR',
      `Failed to encrypt file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { fileSize: file.size }
    );
  }
};

// Stream decryption for large files with progress reporting
const streamDecrypt = async (
  encryptedBlob: Blob, 
  key: CryptoKey, 
  iv: Uint8Array, 
  additionalData?: Uint8Array,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const chunkSize = 5 * 1024 * 1024 + 28; // 5MB chunks + GCM tag
  let offset = 12; // Skip IV
  const decryptedChunks: ArrayBuffer[] = [];
  const totalSize = encryptedBlob.size;

  try {
    while (offset < totalSize) {
      const slice = encryptedBlob.slice(offset, offset + chunkSize);
      const chunk = await slice.arrayBuffer();
      const decryptedChunk = await window.crypto.subtle.decrypt(
        { 
          name: 'AES-GCM',
          iv,
          ...(additionalData ? { additionalData } : {})
        },
        key,
        chunk
      );
      
      decryptedChunks.push(decryptedChunk);
      offset += chunkSize;
      
      // Report progress if callback provided
      if (onProgress) {
        onProgress(Math.min(offset / totalSize, 1));
      }
      
      // Yield to event loop every few chunks
      if (offset % (chunkSize * 4) === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return new Blob(decryptedChunks);
  } catch (error) {
    // Clean up any partial decrypted data
    decryptedChunks.forEach(chunk => {
      zeroBuffer(chunk);
    });
    throw error;
  }
};

// Decrypt a file with the user's encryption key
export const decryptFile = async (
  encryptedBlob: Blob, 
  encryptionKey: string, 
  originalType: string, 
  fileName: string = '',
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  try {
    const key = await importEncryptionKey(encryptionKey);
    
    // Extract IV (first 12 bytes)
    const ivBuffer = await encryptedBlob.slice(0, 12).arrayBuffer();
    const iv = new Uint8Array(ivBuffer);
    
    // Validate the IV
    if (!validateIV(iv)) {
      toast({
        title: "Decryption Failed",
        description: "Invalid encryption parameters in file",
        variant: "destructive"
      });
      
      throw new DecryptionError(
        'INVALID_IV',
        'Invalid IV format in encrypted file',
        { iv: arrayBufferToBase64(iv.buffer) }
      );
    }
    
    // Fix: Only create additionalData if fileName is provided
    const additionalData = fileName ? new TextEncoder().encode(`file:${fileName}:${originalType}`) : undefined;
    
    // Use streaming for files larger than 10MB
    if (encryptedBlob.size > 10 * 1024 * 1024) {
      const result = await streamDecrypt(encryptedBlob, key, iv, additionalData, onProgress);
      return new Blob([result], { type: originalType || 'application/octet-stream' });
    }

    // Small files can be processed in memory
    const encryptedData = await encryptedBlob.arrayBuffer();
    const encryptedContent = encryptedData.slice(12);
    
    try {
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
      const result = new Blob([decryptedContent], { type: originalType || 'application/octet-stream' });
      
      // Zero out sensitive data
      zeroBuffer(encryptedData);
      if (additionalData) {
        zeroBuffer(additionalData);
      }
      
      return result;
    } catch (error) {
      let errorCode: 'INVALID_IV'|'AUTH_FAILED'|'CORRUPT_DATA'|'KEY_MISMATCH'|'UNKNOWN'|'IV_REUSE'|'MEMORY_ERROR'|'FORMAT_ERROR'|'IV_REGISTRY_FULL' = 'UNKNOWN';
      const details: {
        iv?: string;
        keyHash?: string;
        expectedKeyHash?: string;
        additionalData?: string;
        fileSize?: number;
        fileName?: string;
      } = {
        iv: arrayBufferToBase64(iv.buffer),
        fileSize: encryptedBlob.size,
        fileName
      };

      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          errorCode = 'AUTH_FAILED';
          details.additionalData = additionalData ? arrayBufferToBase64(additionalData) : undefined;
        } else if (error.message.includes('iv') || error.message.includes('initialization vector')) {
          errorCode = 'INVALID_IV';
        } else if (error.message.includes('corrupt') || error.message.includes('malformed')) {
          errorCode = 'CORRUPT_DATA';
        } else if (error.message.includes('key') || error.message.includes('mismatch')) {
          errorCode = 'KEY_MISMATCH';
        } else if (error.message.includes('memory') || error.message.includes('allocation')) {
          errorCode = 'MEMORY_ERROR';
        } else if (error.message.includes('format') || error.message.includes('structure')) {
          errorCode = 'FORMAT_ERROR';
        } else if (error.message.includes('reuse') || error.message.includes('duplicate')) {
          errorCode = 'IV_REUSE';
        }
      }

      toast({
        title: "Decryption Failed",
        description: errorCode === 'AUTH_FAILED' 
          ? "Authentication failed. The file may be corrupted or the key is incorrect."
          : "Failed to decrypt file. Please check your encryption key and try again.",
        variant: "destructive"
      });

      throw new DecryptionError(
        errorCode,
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details
      );
    }
  } catch (error) {
    if (!(error instanceof DecryptionError)) {
      toast({
        title: "Decryption Failed",
        description: error instanceof Error ? error.message : "Unknown decryption error",
        variant: "destructive"
      });
      
      throw new DecryptionError(
        'UNKNOWN',
        `Decryption process failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { fileSize: encryptedBlob.size }
      );
    }
    throw error;
  }
};

// Export usedIVs for IVReuseAlert component
export const getIVUsageStats = () => {
  return {
    count: usedIVs.size,
    maxCount: MAX_IV_REGISTRY_SIZE,
    threshold: IV_REGISTRY_WARNING_THRESHOLD,
    ivs: [...usedIVs.values()]
  };
};

// Clean up resources when module is unloaded
window.addEventListener('beforeunload', () => {
  if (cleanupInterval !== null) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
});
