// src/lib/auth/keyStore.ts

/**
 * WARNING: This key is stored in JavaScript memory and will be lost on page refresh or closure.
 * Application logic must handle re-authentication or re-derivation/fetching the key as needed.
 */

// Use a closure to store the key, preventing global access.
const keyStore = (() => {
  let sessionEncryptionKey: string | null = null;

  const setKey = (key: string): void => {
    sessionEncryptionKey = key;
    // Avoid logging the key itself in production - REMOVED console.log
    // console.log("Encryption key stored in memory for session.");
  };

  const getKey = (): string | null => {
    return sessionEncryptionKey;
  };

  const clearKey = (): void => {
    // Overwrite with null. More robust clearing is difficult for strings in JS.
    sessionEncryptionKey = null;
    // REMOVED console.log
    // console.log("Encryption key cleared from memory.");
  };

  return { setKey, getKey, clearKey };
})();

/**
 * Stores the encryption key in memory for the current session (scoped within the module).
 * @param key The base64 encoded encryption key.
 */
export const setSessionKey = keyStore.setKey;

/**
 * Retrieves the encryption key from memory for the current session.
 * @returns The base64 encoded encryption key or null if not set.
 */
export const getSessionKey = keyStore.getKey;

/**
 * Clears the encryption key from memory.
 */
export const clearSessionKey = keyStore.clearKey;