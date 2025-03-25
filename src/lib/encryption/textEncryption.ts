
/**
 * Text encryption utilities with enhanced security features
 * Uses AES-GCM with secure key management
 */

import { importEncryptionKey } from './core';

// Custom error classes for better error handling
export class TextEncryptionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'TextEncryptionError';
  }
}

export class TextDecryptionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'TextDecryptionError';
  }
}

// Encrypt text with enhanced error handling
export async function encryptText(text: string, key: CryptoKey | string): Promise<string> {
  try {
    // Handle string key by importing it first
    const cryptoKey = typeof key === 'string' ? await importEncryptionKey(key) : key;
    
    // Generate a random IV for each encryption operation
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(text);

    // Perform the encryption
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      cryptoKey,
      encodedText
    );

    // Combine IV and encrypted data
    const encryptedArray = new Uint8Array(encrypted);
    const result = new Uint8Array(iv.length + encryptedArray.length);
    result.set(iv, 0);
    result.set(encryptedArray, iv.length);

    // Convert to Base64
    return btoa(String.fromCharCode(...result));
  } catch (error: any) {
    throw new TextEncryptionError('Failed to encrypt text: ' + (error.message || 'Unknown error'), error);
  }
}

// Decrypt text with enhanced error handling
export async function decryptText(encrypted: string, key: CryptoKey | string): Promise<string> {
  try {
    // Handle string key by importing it first
    const cryptoKey = typeof key === 'string' ? await importEncryptionKey(key) : key;
    
    // Decode from Base64
    const encryptedData = new Uint8Array(
      atob(encrypted).split('').map(char => char.charCodeAt(0))
    );

    // Extract IV and ciphertext
    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);

    // Perform the decryption
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      cryptoKey,
      ciphertext
    );

    // Convert the result to text
    return new TextDecoder().decode(decrypted);
  } catch (error: any) {
    throw new TextDecryptionError('Failed to decrypt text: ' + (error.message || 'Unknown error'), error);
  }
}

// Aliases for backward compatibility
export const encryptTextSecure = encryptText;
export const decryptTextSecure = decryptText;
