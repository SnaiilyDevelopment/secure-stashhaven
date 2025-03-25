
/**
 * File encryption utilities for end-to-end encryption
 */

import { importEncryptionKey } from './core';

interface IVMetadata {
  timestamp: number;
  keyHash: string;
  fileSize?: number;
  fileName?: string;
}

interface DecryptionErrorDetails {
  iv?: string;
  keyHash?: string;
  expectedKeyHash?: string;
  additionalData?: string;
  fileSize?: number;
  fileName?: string;
  registrySize?: number;
}

interface EncryptionErrorDetails {
  fileSize?: number;
  maxSize?: number;
  registrySize?: number;
  keyHash?: string;
}

class DecryptionError extends Error {
  constructor(
    public readonly code: 'INVALID_IV'|'AUTH_FAILED'|'CORRUPT_DATA'|'KEY_MISMATCH'|'UNKNOWN'|'IV_REUSE'|'MEMORY_ERROR'|'FORMAT_ERROR'|'IV_REGISTRY_FULL',
    message: string,
    public readonly details?: DecryptionErrorDetails & { registrySize?: number }
  ) {
    super(message);
    this.name = 'DecryptionError';
  }
}

class EncryptionError extends Error {
  constructor(
    public readonly code: 'IV_GENERATION_FAILED'|'MEMORY_ERROR'|'SIZE_LIMIT_EXCEEDED'|'UNKNOWN'|'IV_REGISTRY_FULL',
    message: string,
    public readonly details?: EncryptionErrorDetails
  ) {
    super(message);
    this.name = 'EncryptionError';
  }
}

// Helper to zero out sensitive memory
const zeroBuffer = (buffer: ArrayBuffer|Uint8Array) => {
  if (buffer instanceof ArrayBuffer) {
    new Uint8Array(buffer).fill(0);
  } else {
    buffer.fill(0);
  }
};

// Helper to convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
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

// Stream file to ArrayBuffer in chunks
const streamFileToBuffer = async (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const chunks: Uint8Array[] = [];
    const chunkSize = 10 * 1024 * 1024; // 10MB chunks
    let offset = 0;

    const readChunk = (o: number) => {
      const slice = file.slice(o, o + chunkSize);
      reader.readAsArrayBuffer(slice);
    };

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new EncryptionError('MEMORY_ERROR', 'Failed to read file chunk'));
        return;
      }
      
      const chunk = new Uint8Array(e.target.result as ArrayBuffer);
      chunks.push(chunk);
      offset += chunk.length;

      if (offset < file.size) {
        readChunk(offset);
      } else {
        // Combine chunks
        const buffer = new Uint8Array(offset);
        let position = 0;
        for (const chunk of chunks) {
          buffer.set(chunk, position);
          position += chunk.length;
          zeroBuffer(chunk); // Zero out processed chunks
        }
        resolve(buffer.buffer);
      }
    };

    reader.onerror = () => reject(new EncryptionError('MEMORY_ERROR', 'File read error'));
    readChunk(0);
  });
};

// Maximum file size (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface IVMetadata {
  timestamp: number;
  keyHash: string;
  fileSize?: number;
  fileName?: string;
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

// Clean up expired IVs and maintain size limits
const cleanupIVs = () => {
  const now = Date.now();
  let cleaned = 0;
  let totalSize = 0;
  
  // Track IVs to delete
  const ivsToDelete = new Set<string>();
  
  // First pass: identify expired IVs and calculate total size
  for (const [iv, {timestamp}] of usedIVs.entries()) {
    totalSize += iv.length;
    if (now - timestamp > IV_EXPIRATION_MS) {
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

  // Additional memory-based cleanup if total size exceeds 1MB
  const MAX_MEMORY_USAGE = 1024 * 1024; // 1MB
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
  for (const [iv, {keyHash}] of usedIVs.entries()) {
    if (!ivsToDelete.has(iv)) {
      const count = (userIVCounts.get(keyHash) || 0) + 1;
      userIVCounts.set(keyHash, count);
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
setInterval(cleanupIVs, IV_CLEANUP_INTERVAL_MS);
cleanupIVs();

// Stream encryption for large files with progress reporting
const streamEncrypt = async (
  file: File, 
  key: CryptoKey, 
  iv: Uint8Array, 
  additionalData: Uint8Array,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const chunkSize = 5 * 1024 * 1024; // Reduced to 5MB chunks for better memory management
  let offset = 0;
  const encryptedChunks: ArrayBuffer[] = [iv.buffer];
  const totalSize = file.size;

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
};

// Encrypt a file with the user's encryption key
export const encryptFile = async (file: File, encryptionKey: string): Promise<Blob> => {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new EncryptionError(
      'SIZE_LIMIT_EXCEEDED',
      `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      { fileSize: file.size, maxSize: MAX_FILE_SIZE }
    );
  }

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
      
      // Ensure IV is unique and registry has space
      if (!usedIVs.has(ivString)) {
        ivGenerated = true;
      } else if (attempts >= IV_GENERATION_MAX_ATTEMPTS) {
        throw new EncryptionError(
          'IV_GENERATION_FAILED',
          `Failed to generate unique IV after ${IV_GENERATION_MAX_ATTEMPTS} attempts`,
          { registrySize: usedIVs.size }
        );
      }
    } catch (error) {
      if (attempts >= IV_GENERATION_MAX_ATTEMPTS) {
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
      throw new EncryptionError(
        'IV_REGISTRY_FULL',
        'System busy - please try again later',
        { registrySize: usedIVs.size }
      );
    }
  }
  } catch (error) {
    throw new EncryptionError(
      'IV_GENERATION_FAILED',
      `Failed to generate secure IV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
  
  // Track IV with metadata using streaming hash
  const keyHash = await (async () => {
    const keyBytes = new TextEncoder().encode(encryptionKey);
    const chunkSize = 64 * 1024; // 64KB chunks
    const hash = await crypto.subtle.digest('SHA-256', keyBytes);
    return arrayBufferToBase64(hash);
  })();
  // Track IV with strict size limits
  const metadata: IVMetadata = {
    timestamp: Date.now(),
    keyHash,
    fileName: file.name,
    fileSize: file.size
  };

  // Check per-user IV limit
  const userIVCount = [...usedIVs.values()].filter(
    m => m.keyHash === keyHash
  ).length;

  if (userIVCount >= IV_REGISTRY_PER_USER_LIMIT) {
    throw new EncryptionError(
      'IV_REGISTRY_FULL',
      'Too many active encryption sessions for this key',
      { 
        registrySize: usedIVs.size,
        keyHash
      }
    );
  }

  usedIVs.set(ivString, metadata);
  
  const additionalData = new TextEncoder().encode(`file:${file.name}:${file.type}`);
  
  // Use streaming for files larger than 10MB
  if (file.size > 10 * 1024 * 1024) {
    return streamEncrypt(file, key, iv, additionalData);
  }

  // Small files can be processed in memory
  try {
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
    
    return new Blob([iv.buffer, encryptedContent], { type: 'application/encrypted' });
  } catch (error) {
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
};

// Decrypt a file with the user's encryption key (with optional progress reporting)
export const decryptFile = async (
  encryptedBlob: Blob, 
  encryptionKey: string, 
  originalType: string, 
  fileName: string = '',
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const key = await importEncryptionKey(encryptionKey);
  
  // Extract IV (first 12 bytes)
  const iv = new Uint8Array(await encryptedBlob.slice(0, 12).arrayBuffer());
  
  // Fix: Only create additionalData if fileName is provided
  const additionalData = fileName ? new TextEncoder().encode(`file:${fileName}:${originalType}`) : undefined;
  
  try {
    // Use streaming for files larger than 10MB
    if (encryptedBlob.size > 10 * 1024 * 1024) {
      const result = await streamDecrypt(encryptedBlob, key, iv, additionalData, onProgress);
      return new Blob([result], { type: originalType || 'application/octet-stream' });
    }

    // Small files can be processed in memory
    const encryptedData = await encryptedBlob.arrayBuffer();
    const encryptedContent = encryptedData.slice(12);
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
    const details: DecryptionErrorDetails = {
      iv: arrayBufferToBase64(iv.buffer),
      fileSize: encryptedBlob.size
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
        const keyHash = await (async () => {
          const keyBytes = new TextEncoder().encode(encryptionKey);
          return arrayBufferToBase64(await crypto.subtle.digest('SHA-256', keyBytes));
        })();
        details.keyHash = keyHash;
        const ivMeta = usedIVs.get(Array.from(iv).join(','));
        if (ivMeta) {
          details.expectedKeyHash = ivMeta.keyHash;
        }
      } else if (error.message.includes('memory') || error.message.includes('allocation')) {
        errorCode = 'MEMORY_ERROR';
      } else if (error.message.includes('format') || error.message.includes('structure')) {
        errorCode = 'FORMAT_ERROR';
      } else if (error.message.includes('reuse') || error.message.includes('duplicate')) {
        errorCode = 'IV_REUSE';
      }
    }

    throw new DecryptionError(
      errorCode,
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details
    );
  }
};
