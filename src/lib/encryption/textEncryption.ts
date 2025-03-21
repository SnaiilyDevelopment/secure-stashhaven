
/**
 * Text encryption utilities for end-to-end encryption
 */

import { importEncryptionKey, arrayBufferToBase64, base64ToArrayBuffer } from './core';

// Encrypt text with the user's encryption key (enhanced with authentication)
export const encryptText = async (text: string, encryptionKey: string, context: string = ''): Promise<string> => {
  const key = await importEncryptionKey(encryptionKey);
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(text);
  
  // Generate a random IV for this encryption
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Add additional authentication data for enhanced security
  // Fix: Only create additionalData if context is provided
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
  // Fix: Only create additionalData if context is provided
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
    return decoder.decode(decryptedContent);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt text. The encryption key may be incorrect.');
  }
};
