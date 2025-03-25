
/**
 * Text encryption utilities for end-to-end encryption
 */

import { importEncryptionKey, arrayBufferToBase64, base64ToArrayBuffer, zeroBuffer } from './core';
import { toast } from "@/components/ui/use-toast";

// Custom error classes for text encryption operations
export class TextEncryptionError extends Error {
  constructor(message: string, public errorType: string = 'ENCRYPTION_ERROR', public details?: any) {
    super(message);
    this.name = 'TextEncryptionError';
  }
}

export class TextDecryptionError extends Error {
  constructor(message: string, public errorType: string = 'DECRYPTION_ERROR', public details?: any) {
    super(message);
    this.name = 'TextDecryptionError';
  }
}

// Validate IV for encryption
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

// Encrypt text with the user's encryption key
export const encryptText = async (text: string, encryptionKey: string, context: string = ''): Promise<string> => {
  try {
    const key = await importEncryptionKey(encryptionKey);
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);
    
    // Generate a random IV for this encryption
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Validate the IV
    if (!validateIV(iv)) {
      // Generate a new IV if this one is invalid
      window.crypto.getRandomValues(iv);
      if (!validateIV(iv)) {
        throw new TextEncryptionError('Failed to generate a secure IV', 'IV_GENERATION_FAILED');
      }
    }
    
    // Add additional authentication data for enhanced security
    const additionalData = context ? encoder.encode(context) : undefined;
    
    // Encrypt the text
    const encryptedContent = await window.crypto.subtle.encrypt(
      { 
        name: 'AES-GCM', 
        iv,
        ...(additionalData ? { additionalData } : {})
      },
      key,
      encodedText
    );
    
    // Combine IV and encrypted content and convert to base64
    const combinedContent = new Uint8Array(iv.byteLength + encryptedContent.byteLength);
    combinedContent.set(iv, 0);
    combinedContent.set(new Uint8Array(encryptedContent), iv.byteLength);
    
    // Convert to base64 and cleanup sensitive data
    const result = arrayBufferToBase64(combinedContent);
    
    // Zero out sensitive data
    zeroBuffer(encodedText.buffer);
    zeroBuffer(combinedContent.buffer);
    if (additionalData) {
      zeroBuffer(additionalData.buffer);
    }
    
    return result;
  } catch (error) {
    console.error('Text encryption failed:', error);
    
    // Handle and rethrow with better error info
    if (error instanceof TextEncryptionError) {
      throw error;
    }
    
    throw new TextEncryptionError(
      `Failed to encrypt text: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'ENCRYPTION_FAILED',
      { contextProvided: !!context }
    );
  }
};

// Decrypt text with the user's encryption key
export const decryptText = async (encryptedText: string, encryptionKey: string, context: string = ''): Promise<string> => {
  try {
    const key = await importEncryptionKey(encryptionKey);
    
    // Decode from base64
    const encryptedData = base64ToArrayBuffer(encryptedText);
    
    // Validate minimum length (IV + tag)
    if (encryptedData.byteLength < 12 + 16) {
      throw new TextDecryptionError('Invalid encrypted data format', 'FORMAT_ERROR');
    }
    
    // Extract IV (first 12 bytes)
    const iv = new Uint8Array(encryptedData.slice(0, 12));
    
    // Validate the IV
    if (!validateIV(iv)) {
      throw new TextDecryptionError('Invalid IV in encrypted data', 'INVALID_IV');
    }
    
    // Extract encrypted content (everything after IV)
    const encryptedContent = encryptedData.slice(12);
    
    // Add additional authentication data if context provided
    const additionalData = context ? new TextEncoder().encode(context) : undefined;
    
    try {
      // Decrypt the text
      const decryptedContent = await window.crypto.subtle.decrypt(
        { 
          name: 'AES-GCM', 
          iv,
          ...(additionalData ? { additionalData } : {})
        },
        key,
        encryptedContent
      );
      
      // Decode from UTF-8
      const decoder = new TextDecoder();
      const result = decoder.decode(decryptedContent);
      
      // Zero out sensitive data
      zeroBuffer(decryptedContent);
      zeroBuffer(encryptedData);
      if (additionalData) {
        zeroBuffer(additionalData.buffer);
      }
      
      return result;
    } catch (error) {
      console.error('Decryption operation failed:', error);
      
      // Determine error type from error message
      let errorType = 'UNKNOWN';
      
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('authentication') || msg.includes('integrity')) {
          errorType = 'AUTH_FAILED';
        } else if (msg.includes('iv') || msg.includes('vector')) {
          errorType = 'INVALID_IV';
        } else if (msg.includes('key')) {
          errorType = 'KEY_ERROR';
        } else if (msg.includes('format') || msg.includes('encoding')) {
          errorType = 'FORMAT_ERROR';
        }
      }
      
      throw new TextDecryptionError(
        'Failed to decrypt text. The encryption key may be incorrect.',
        errorType,
        { contextProvided: !!context }
      );
    }
  } catch (error) {
    if (error instanceof TextDecryptionError) {
      throw error;
    }
    
    console.error('Text decryption failed:', error);
    throw new TextDecryptionError(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'DECRYPTION_FAILED'
    );
  }
};
