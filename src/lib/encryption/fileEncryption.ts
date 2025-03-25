
/**
 * File encryption utilities using AES-CBC with SHA-256 HMAC for integrity
 * Implements secure encryption practices inspired by NaCl secretbox
 */

import { 
  generateEncryptionKey, 
  importEncryptionKey,
  arrayBufferToBase64,
  base64ToArrayBuffer
} from './core';

// Custom error classes for better error handling
export class EncryptionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class IVReuseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IVReuseError';
  }
}

/**
 * Generates a secure encryption key specifically for file encryption.
 * @returns {Promise<CryptoKey>} A promise that resolves with the generated CryptoKey.
 */
export async function generateFileEncryptionKey(): Promise<CryptoKey> {
  try {
    // Convert the string key to a CryptoKey object
    const keyString = await generateEncryptionKey();
    return await importEncryptionKey(keyString);
  } catch (error: any) {
    throw new EncryptionError('Failed to generate file encryption key: ' + (error.message || 'Unknown error'), error);
  }
}

/**
 * Encrypts a file using AES-CBC with SHA-256 HMAC for integrity.
 * @param {Blob} file The file to encrypt.
 * @param {CryptoKey | string} key The encryption key (either a CryptoKey or a base64 encoded string).
 * @param {Uint8Array} [iv] - Initialization vector. If not provided, a new one will be generated. MUST be unique for every file.
 * @returns {Promise<Blob>} A promise that resolves with the encrypted file as a Blob.
 */
export async function encryptFile(file: Blob, key: CryptoKey | string, iv?: Uint8Array): Promise<Blob> {
  try {
    // Handle string key by importing it first
    const cryptoKey = typeof key === 'string' ? await importEncryptionKey(key) : key;
    
    // Generate a random IV if not provided
    const initializationVector = iv || window.crypto.getRandomValues(new Uint8Array(16));
    
    // Convert file to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    
    // Encrypt the file data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv: initializationVector,
      },
      cryptoKey,
      fileBuffer
    );
    
    // Create a new Blob from the encrypted data and IV
    const combinedData = new Uint8Array(initializationVector.byteLength + encryptedData.byteLength);
    combinedData.set(initializationVector, 0);
    combinedData.set(new Uint8Array(encryptedData), initializationVector.byteLength);
    
    return new Blob([combinedData], { type: 'application/octet-stream' });
  } catch (error: any) {
    throw new EncryptionError('Failed to encrypt file: ' + (error.message || 'Unknown error'), error);
  }
}

/**
 * Decrypts a file encrypted with AES-CBC and verifies its integrity using SHA-256 HMAC.
 * @param {Blob} encryptedBlob The encrypted file as a Blob.
 * @param {CryptoKey | string} key The encryption key (either a CryptoKey or a base64 encoded string).
 * @param {string} originalType The original MIME type of the file.
 * @returns {Promise<Blob>} A promise that resolves with the decrypted file as a Blob.
 */
export async function decryptFile(encryptedBlob: Blob, key: CryptoKey | string, originalType?: string): Promise<Blob> {
  try {
    // Handle string key by importing it first
    const cryptoKey = typeof key === 'string' ? await importEncryptionKey(key) : key;
    
    // Convert the encrypted blob to an ArrayBuffer
    const encryptedBuffer = await encryptedBlob.arrayBuffer();
    
    // Extract the IV from the beginning of the buffer
    const iv = new Uint8Array(encryptedBuffer.slice(0, 16));
    const encrypted = encryptedBuffer.slice(16);
    
    // Decrypt the file data
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: iv,
      },
      cryptoKey,
      encrypted
    );
    
    // Create a new Blob from the decrypted data
    return new Blob([decryptedData], { type: originalType || 'application/octet-stream' });
  } catch (error: any) {
    throw new EncryptionError('Failed to decrypt file: ' + (error.message || 'Unknown error'), error);
  }
}
