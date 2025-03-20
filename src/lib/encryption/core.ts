
/**
 * Core encryption utilities for end-to-end encryption
 * Implements secure encryption practices inspired by Matrix E2EE concepts
 */

// Utility to convert ArrayBuffer to base64 string
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Utility to convert base64 string to ArrayBuffer
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Generate a secure encryption key
export const generateEncryptionKey = async (): Promise<string> => {
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  // Export the key to raw format
  const exportedKey = await window.crypto.subtle.exportKey('raw', key);
  
  // Convert to base64 for storage
  return arrayBufferToBase64(exportedKey);
};

// Import an existing encryption key
export const importEncryptionKey = async (keyBase64: string): Promise<CryptoKey> => {
  const keyData = base64ToArrayBuffer(keyBase64);
  
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Get the current user's encryption key from localStorage
export const getCurrentUserEncryptionKey = (): string | null => {
  return localStorage.getItem('encryption_key');
};

// Generate a secure random password with improved entropy
export const generateSecurePassword = (length = 20): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=<>?{}[]|:;,.';
  const values = new Uint8Array(length);
  window.crypto.getRandomValues(values);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }
  
  return password;
};

// Matrix-inspired key derivation with stronger parameters
export const deriveKeyFromPassword = async (password: string, salt?: ArrayBuffer | string): Promise<{ key: string, salt: string }> => {
  // Generate a salt if one isn't provided
  if (!salt) {
    salt = window.crypto.getRandomValues(new Uint8Array(16));
  } else if (typeof salt === 'string') {
    salt = base64ToArrayBuffer(salt);
  }
  
  // Derive a key using PBKDF2 with higher iteration count for better security
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 310000, // Increased from 100000 for stronger security
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const exportedKey = await window.crypto.subtle.exportKey('raw', derivedKey);
  
  return {
    key: arrayBufferToBase64(exportedKey),
    salt: arrayBufferToBase64(salt)
  };
};
