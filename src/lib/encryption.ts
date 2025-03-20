
/**
 * Encryption utilities for end-to-end encryption
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
      iterations: 310000, // High iteration count for stronger security
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

// Encrypt a file with the user's encryption key
export const encryptFile = async (file: File, encryptionKey: string): Promise<Blob> => {
  const key = await importEncryptionKey(encryptionKey);
  const fileArrayBuffer = await file.arrayBuffer();
  
  // Generate a random IV for this encryption
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Add additional authentication data for enhanced security
  const additionalData = new TextEncoder().encode(`file:${file.name}:${file.type}`);
  
  // Encrypt the file
  const encryptedContent = await window.crypto.subtle.encrypt(
    { 
      name: 'AES-GCM', 
      iv,
      additionalData // Add additional authenticated data for stronger security
    },
    key,
    fileArrayBuffer
  );
  
  // Combine IV and encrypted content
  const encryptedBlob = new Blob([
    iv.buffer,
    encryptedContent
  ], { type: 'application/encrypted' });
  
  return encryptedBlob;
};

// Decrypt a file with the user's encryption key
export const decryptFile = async (encryptedBlob: Blob, encryptionKey: string, originalType: string, fileName: string = ''): Promise<Blob> => {
  const key = await importEncryptionKey(encryptionKey);
  const encryptedData = await encryptedBlob.arrayBuffer();
  
  // Extract IV (first 12 bytes)
  const iv = new Uint8Array(encryptedData.slice(0, 12));
  
  // Extract encrypted content (everything after IV)
  const encryptedContent = encryptedData.slice(12);
  
  // Add additional authentication data for enhanced security
  const additionalData = new TextEncoder().encode(`file:${fileName}:${originalType}`);
  
  try {
    // Decrypt the file
    const decryptedContent = await window.crypto.subtle.decrypt(
      { 
        name: 'AES-GCM', 
        iv,
        additionalData: fileName ? additionalData : undefined // Use additionalData if available
      },
      key,
      encryptedContent
    );
    
    // Return as blob with original type
    return new Blob([decryptedContent], { type: originalType || 'application/octet-stream' });
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt file. The encryption key may be incorrect.');
  }
};

// Encrypt text with the user's encryption key (enhanced with authentication)
export const encryptText = async (text: string, encryptionKey: string, context: string = ''): Promise<string> => {
  const key = await importEncryptionKey(encryptionKey);
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(text);
  
  // Generate a random IV for this encryption
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Add additional authentication data for enhanced security
  const additionalData = context ? encoder.encode(context) : undefined;
  
  // Encrypt the text
  const encryptedContent = await window.crypto.subtle.encrypt(
    { 
      name: 'AES-GCM', 
      iv,
      additionalData 
    },
    key,
    encodedText
  );
  
  // Combine IV and encrypted content and convert to base64
  const combinedContent = new Uint8Array(iv.byteLength + encryptedContent.byteLength);
  combinedContent.set(iv, 0);
  combinedContent.set(new Uint8Array(encryptedContent), iv.byteLength);
  
  return arrayBufferToBase64(combinedContent);
};

// Decrypt text with the user's encryption key
export const decryptText = async (encryptedText: string, encryptionKey: string, context: string = ''): Promise<string> => {
  const key = await importEncryptionKey(encryptionKey);
  const encryptedData = base64ToArrayBuffer(encryptedText);
  
  // Extract IV (first 12 bytes)
  const iv = new Uint8Array(encryptedData.slice(0, 12));
  
  // Extract encrypted content (everything after IV)
  const encryptedContent = encryptedData.slice(12);
  
  // Add additional authentication data for enhanced security
  const additionalData = context ? new TextEncoder().encode(context) : undefined;
  
  try {
    // Decrypt the text
    const decryptedContent = await window.crypto.subtle.decrypt(
      { 
        name: 'AES-GCM', 
        iv,
        additionalData 
      },
      key,
      encryptedContent
    );
    
    // Decode from UTF-8
    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt text. The encryption key may be incorrect.');
  }
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

// Generate device verification keys (Matrix E2EE inspired)
export const generateDeviceKeys = async (): Promise<{publicKey: string, privateKey: string}> => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-384", // Using P-384 for stronger security
    },
    true,
    ["deriveKey", "deriveBits"]
  );
  
  const publicKeyExported = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );
  
  const privateKeyExported = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );
  
  return {
    publicKey: arrayBufferToBase64(publicKeyExported),
    privateKey: arrayBufferToBase64(privateKeyExported)
  };
};

// Import device keys
export const importDeviceKeys = async (publicKeyBase64: string, privateKeyBase64: string): Promise<{publicKey: CryptoKey, privateKey: CryptoKey}> => {
  const publicKeyData = base64ToArrayBuffer(publicKeyBase64);
  const privateKeyData = base64ToArrayBuffer(privateKeyBase64);
  
  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    publicKeyData,
    {
      name: "ECDH",
      namedCurve: "P-384",
    },
    true,
    []
  );
  
  const privateKey = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyData,
    {
      name: "ECDH",
      namedCurve: "P-384",
    },
    true,
    ["deriveKey", "deriveBits"]
  );
  
  return { publicKey, privateKey };
};
