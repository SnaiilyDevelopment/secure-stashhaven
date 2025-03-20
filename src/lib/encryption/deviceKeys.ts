
/**
 * Device verification keys utilities for end-to-end encryption
 * Inspired by Matrix E2EE concepts
 */

import { arrayBufferToBase64, base64ToArrayBuffer } from './core';

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
