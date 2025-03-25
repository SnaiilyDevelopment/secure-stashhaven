/**
 * Text encryption utilities using AES-GCM
 * Implements secure encryption practices with authentication
 */

import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from './core';

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

/**
 * Encrypts text using AES-GCM.
 * @param {string} text - The text to encrypt.
 * @param {CryptoKey} key - The encryption key.
 * @returns {Promise<string>} A promise that resolves with the encrypted text as a base64 string.
 */
export async function encryptText(text: string, key: CryptoKey): Promise<string> {
  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(text);
    
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encodedText
    );
    
    // Combine IV and ciphertext
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedData), iv.length);
    
    return arrayBufferToBase64(result.buffer);
  } catch (error: any) {
    throw new TextEncryptionError(`Failed to encrypt text: ${error.message || 'Unknown error'}`, error);
  }
}

/**
 * Decrypts text using AES-GCM.
 * @param {string} encryptedText - The encrypted text as a base64 string.
 * @param {CryptoKey} key - The decryption key.
 * @returns {Promise<string>} A promise that resolves with the decrypted text.
 */
export async function decryptText(encryptedText: string, key: CryptoKey): Promise<string> {
  try {
    const encryptedBuffer = base64ToArrayBuffer(encryptedText);
    const encryptedArray = new Uint8Array(encryptedBuffer);
    
    // Extract IV (first 12 bytes)
    const iv = encryptedArray.slice(0, 12);
    const ciphertext = encryptedArray.slice(12);
    
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decryptedData);
  } catch (error: any) {
    throw new TextDecryptionError(`Failed to decrypt text: ${error.message || 'Unknown error'}`, error);
  }
}

/**
 * Enhanced text encryption with additional security measures.
 * Uses authenticated encryption with associated data (AEAD).
 */
export async function encryptTextSecure(
  text: string,
  key: CryptoKey,
  associatedData?: string
): Promise<string> {
  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(text);
    const encodedAssociatedData = associatedData 
      ? new TextEncoder().encode(associatedData) 
      : new Uint8Array(0);
    
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
        additionalData: encodedAssociatedData
      },
      key,
      encodedText
    );
    
    // Combine IV and ciphertext
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedData), iv.length);
    
    return arrayBufferToBase64(result.buffer);
  } catch (error: any) {
    throw new TextEncryptionError(`Secure encryption failed: ${error.message || 'Unknown error'}`, error);
  }
}

/**
 * Enhanced text decryption with additional security measures.
 * Uses authenticated encryption with associated data (AEAD).
 */
export async function decryptTextSecure(
  encryptedText: string,
  key: CryptoKey,
  associatedData?: string
): Promise<string> {
  try {
    const encryptedBuffer = base64ToArrayBuffer(encryptedText);
    const encryptedArray = new Uint8Array(encryptedBuffer);
    
    // Extract IV (first 12 bytes)
    const iv = encryptedArray.slice(0, 12);
    const ciphertext = encryptedArray.slice(12);
    const encodedAssociatedData = associatedData 
      ? new TextEncoder().encode(associatedData) 
      : new Uint8Array(0);
    
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
        additionalData: encodedAssociatedData
      },
      key,
      ciphertext
    );
    
    const decoded = new TextDecoder().decode(decryptedData);
    return decoded;
  } catch (error: any) {
    throw new TextDecryptionError(`Secure decryption failed: ${error.message || 'Unknown error'}`, error);
  }
}
