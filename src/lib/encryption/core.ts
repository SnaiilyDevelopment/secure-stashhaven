/**
 * Core encryption utilities for end-to-end encryption
 * Implements secure encryption practices inspired by Matrix E2EE concepts
 */

import crypto from 'crypto';

// Function to generate a random encryption key (AES-256)
export const generateEncryptionKey = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(32, (err, buffer) => {
      if (err) {
        console.error("Key generation error:", err);
        return reject(new Error("Failed to generate encryption key"));
      }
      const keyBase64 = buffer.toString('base64');
      resolve(keyBase64);
    });
  });
};

// Function to derive an encryption key from a password using PBKDF2
export const deriveKeyFromPassword = async (password: string, existingSalt?: string): Promise<{ key: CryptoKey, salt: string }> => {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const passwordBytes = new TextEncoder().encode(password);
  const saltBytes = new TextEncoder().encode(salt);

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    passwordBytes,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  return { key: derivedKey, salt: salt };
};

// Function to encrypt text using AES-GCM
export const encryptText = async (text: string, key: CryptoKey): Promise<string> => {
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
};

// Function to decrypt text using AES-GCM
export const decryptText = async (base64String: string, key: CryptoKey): Promise<string> => {
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
};

// Function to import an encryption key from a base64 string
export const importEncryptionKey = async (keyBase64: string): Promise<CryptoKey> => {
  const keyBuffer = base64ToArrayBuffer(keyBase64);
  return window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
};

// Function to export an encryption key to a base64 string
export const exportEncryptionKey = async (key: CryptoKey): Promise<string> => {
  const keyBuffer = await window.crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(keyBuffer);
};

// Helper function to convert ArrayBuffer to Base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper function to convert Base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// Securely zero out a buffer
export const zeroBuffer = (buf: ArrayBuffer): void => {
  const dataView = new DataView(buf);
  for (let i = 0; i < buf.byteLength; i++) {
    dataView.setUint8(i, 0);
  }
};
