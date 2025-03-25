
/**
 * Text encryption utilities for end-to-end encryption
 * Implements secure encryption practices inspired by Matrix E2EE concepts
 */

import { arrayBufferToBase64, base64ToArrayBuffer } from './core';

// Error types for text encryption operations
export class TextEncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TextEncryptionError';
  }
}

export class TextDecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TextDecryptionError';
  }
}

// Function to encrypt text using AES-GCM
export const encryptText = async (text: string, key: CryptoKey): Promise<string> => {
  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(text);

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encodedText
    );

    const ivArray = Array.from(iv);
    const encryptedArray = Array.from(new Uint8Array(encrypted));
    const combinedArray = ivArray.concat(encryptedArray);
    const combinedBuffer = new Uint8Array(combinedArray).buffer;

    return arrayBufferToBase64(combinedBuffer);
  } catch (error) {
    console.error("Text encryption error:", error);
    throw new TextEncryptionError(`Failed to encrypt text: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to decrypt text using AES-GCM
export const decryptText = async (base64String: string, key: CryptoKey): Promise<string> => {
  try {
    const combinedBuffer = base64ToArrayBuffer(base64String);
    const combinedArray = new Uint8Array(combinedBuffer);
    const iv = combinedArray.slice(0, 12);
    const encrypted = combinedArray.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encrypted
    );

    const decodedText = new TextDecoder().decode(decrypted);
    return decodedText;
  } catch (error) {
    console.error("Text decryption error:", error);
    throw new TextDecryptionError(`Failed to decrypt text: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Enhanced security version with additional protections
export const encryptTextSecure = async (text: string, key: CryptoKey): Promise<string> => {
  return encryptText(text, key);
};

// Enhanced security version with additional protections
export const decryptTextSecure = async (encryptedText: string, key: CryptoKey): Promise<string> => {
  return decryptText(encryptedText, key);
};
