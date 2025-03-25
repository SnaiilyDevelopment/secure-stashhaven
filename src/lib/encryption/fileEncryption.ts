
/**
 * File encryption utilities 
 * Secure file encryption for sensitive data with integrity protection
 */

import { toast } from "@/components/ui/use-toast";
import { IVReuseAlert } from '@/components/encryption/IVReuseAlert';
import { importEncryptionKey, arrayBufferToBase64, base64ToArrayBuffer, zeroBuffer } from './core';

// Track used IVs to prevent reuse (security risk)
const usedIVs = new Set<string>();

// Error classes
export class EncryptionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class IVReuseError extends EncryptionError {
  constructor(message: string, public filePath: string) {
    super(message);
    this.name = 'IVReuseError';
  }
}

// Generate a secure, random 96-bit IV for AES-GCM
const generateIV = (): Uint8Array => {
  const iv = new Uint8Array(12); // 96 bits
  window.crypto.getRandomValues(iv);
  return iv;
};

// Check if an IV has been used before
const checkIVUniqueness = (iv: Uint8Array, filePath: string): boolean => {
  const ivString = arrayBufferToBase64(iv.buffer);
  
  if (usedIVs.has(ivString)) {
    console.warn(`IV reuse detected for file: ${filePath}`);
    // This is a serious security issue - must alert user
    throw new IVReuseError(
      `IV reuse detected for file: ${filePath}. This is a security risk.`,
      filePath
    );
  }
  
  // Add IV to used set
  usedIVs.add(ivString);
  return true;
};

// Convert file to ArrayBuffer
const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Calculate hash of file for integrity verification
const calculateFileHash = async (buffer: ArrayBuffer): Promise<string> => {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return arrayBufferToBase64(hashBuffer);
  } catch (error: any) {
    console.error("Hash calculation error:", error);
    throw new EncryptionError("Failed to calculate file hash", error);
  }
};

// Encrypt a file with AES-GCM
export const encryptFile = async (
  file: File,
  key: CryptoKey | string,
  filePath: string
): Promise<{ 
  encrypted: Blob, 
  iv: string, 
  originalName: string, 
  originalType: string 
}> => {
  try {
    console.log(`Beginning encryption for file: ${file.name}`);
    
    // Convert string key to CryptoKey if necessary
    const cryptoKey = typeof key === 'string' 
      ? await importEncryptionKey(key) 
      : key;
    
    // Generate a unique IV
    const iv = generateIV();
    
    // Ensure IV hasn't been used before (prevents critical security issues)
    try {
      checkIVUniqueness(iv, filePath);
    } catch (error) {
      if (error instanceof IVReuseError) {
        // Show warning but allow operation to continue with new IV
        console.warn("IV reuse detected, generating new IV");
        
        // Notify user with toast
        toast({
          title: "Security notice",
          description: "Enhancing security for file upload",
          variant: "default"
        });
        
        // Generate a new IV and continue
        const newIV = generateIV();
        return await encryptFile(file, cryptoKey, filePath);
      } else {
        throw error;
      }
    }
    
    // Read file as array buffer
    const fileData = await fileToArrayBuffer(file);
    
    // Add metadata to the beginning of the file
    const fileInfo = {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    };
    
    const infoJson = JSON.stringify(fileInfo);
    const infoBytes = new TextEncoder().encode(infoJson);
    
    // Length prefix (4 bytes) + metadata + file data
    const infoLength = new Uint32Array([infoBytes.length]);
    const combinedData = new Uint8Array(
      4 + infoBytes.length + fileData.byteLength
    );
    
    // Assemble combined data
    combinedData.set(new Uint8Array(infoLength.buffer), 0);
    combinedData.set(infoBytes, 4);
    combinedData.set(new Uint8Array(fileData), 4 + infoBytes.length);
    
    // Encrypt the combined data
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128 // Authentication tag size in bits
      },
      cryptoKey,
      combinedData
    );
    
    // Format for storage: IV (12 bytes) + Encrypted data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to Blob for storage
    const encryptedBlob = new Blob([result], { type: 'application/octet-stream' });
    
    console.log(`Encryption complete for file: ${file.name}`);
    return {
      encrypted: encryptedBlob,
      iv: arrayBufferToBase64(iv.buffer),
      originalName: file.name,
      originalType: file.type
    };
  } catch (error: any) {
    console.error("File encryption error:", error);
    throw new EncryptionError(
      `Failed to encrypt file: ${error.message || 'Unknown error'}`, 
      error
    );
  }
};

// Decrypt a file with AES-GCM
export const decryptFile = async (
  encryptedData: ArrayBuffer,
  key: CryptoKey | string,
  onIVReuseDetected?: (filePath: string) => void,
  filePath?: string
): Promise<{ 
  decrypted: Blob, 
  fileName: string, 
  fileType: string 
}> => {
  try {
    console.log("Beginning file decryption");
    
    // Convert string key to CryptoKey if necessary
    const cryptoKey = typeof key === 'string' 
      ? await importEncryptionKey(key) 
      : key;
    
    // Extract IV from the beginning of the encrypted data
    const dataArray = new Uint8Array(encryptedData);
    const iv = dataArray.slice(0, 12);
    const ciphertext = dataArray.slice(12);
    
    // Record IV to detect future reuse
    const ivString = arrayBufferToBase64(iv.buffer);
    
    // Check if IV has been used before (excluding current decryption)
    if (usedIVs.has(ivString) && filePath) {
      console.warn(`IV reuse detected during decryption for: ${filePath}`);
      if (onIVReuseDetected) {
        onIVReuseDetected(filePath);
      }
    } else if (filePath) {
      // Add to used IVs set
      usedIVs.add(ivString);
    }
    
    // Decrypt the data
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128 // Must match encryption
      },
      cryptoKey,
      ciphertext
    );
    
    // Extract metadata and file content
    const decryptedArray = new Uint8Array(decrypted);
    
    // Read metadata length (first 4 bytes)
    const metadataLengthArray = decryptedArray.slice(0, 4);
    const metadataLength = new Uint32Array(metadataLengthArray.buffer)[0];
    
    // Extract metadata JSON
    const metadataBytes = decryptedArray.slice(4, 4 + metadataLength);
    const metadataJson = new TextDecoder().decode(metadataBytes);
    const metadata = JSON.parse(metadataJson);
    
    // Extract file data
    const fileData = decryptedArray.slice(4 + metadataLength);
    
    // Create blob with original file type
    const decryptedBlob = new Blob([fileData], { type: metadata.type });
    
    console.log(`Decryption complete, file: ${metadata.name}`);
    return {
      decrypted: decryptedBlob,
      fileName: metadata.name,
      fileType: metadata.type
    };
  } catch (error: any) {
    console.error("File decryption error:", error);
    
    // Provide user-friendly error messages
    let errorMessage = "Failed to decrypt file";
    
    if (error.name === 'OperationError') {
      errorMessage = "Invalid encryption key or corrupted file";
    }
    
    throw new EncryptionError(errorMessage, error);
  }
};
