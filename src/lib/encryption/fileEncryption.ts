
/**
 * File encryption utilities for end-to-end encryption
 */

import { importEncryptionKey, arrayBufferToBase64, base64ToArrayBuffer } from './core';

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
