
/**
 * Core encryption utilities for end-to-end encryption
 * Implements secure encryption practices inspired by Matrix E2EE concepts
 */

// Constant-time comparison with enhanced protection
export const timingSafeEqual = async (a: ArrayBuffer, b: ArrayBuffer): Promise<boolean> => {
  const aBytes = new Uint8Array(a);
  const bBytes = new Uint8Array(b);
  
  // Compare lengths first (safe since length isn't secret)
  if (aBytes.length !== bBytes.length) {
    return false;
  }

  // Fall back to Web Crypto API timingSafeEqual if available
  if ('timingSafeEqual' in crypto.subtle) {
    try {
      const subtle = crypto.subtle as typeof crypto.subtle & {
        timingSafeEqual: (a: Uint8Array, b: Uint8Array) => boolean
      };
      return subtle.timingSafeEqual(aBytes, bBytes);
    } catch {
      // Fall through to WASM implementation
    }
  }

  // Final fallback to WASM constant-time comparison
  try {
    const wasmModule = await import('./wasm/timingSafeEqual');
    return wasmModule.compare(aBytes, bBytes);
  } catch (error) {
    throw new Error(
      'No secure timing-safe comparison implementation available: ' +
      (error instanceof Error ? error.message : 'Unknown error')
    );
  }
};

// Zero out a buffer containing sensitive data
export const zeroBuffer = (buffer: ArrayBuffer): void => {
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = 0;
  }
};

// Utility to convert ArrayBuffer to base64 string
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  try {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } finally {
    zeroBuffer(buffer); // Clear sensitive data
  }
};

// Utility to convert base64 string to ArrayBuffer
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const buffer = bytes.buffer;
  zeroBuffer(buffer); // Clear sensitive data
  return buffer;
};

// Generate a secure encryption key
export const generateEncryptionKey = async (): Promise<string> => {
  try {
    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    ).catch(err => {
      throw new Error(`Key generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    });
    
    // Export the key to raw format
    const exportedKey = await window.crypto.subtle.exportKey('raw', key).catch(err => {
      throw new Error(`Key export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    });
    
    // Convert to base64 for storage
    return arrayBufferToBase64(exportedKey);
  } catch (error) {
    throw new Error(`Encryption key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Key cache with expiration (1 hour)
const keyCache = new Map<string, {key: CryptoKey, expires: number}>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Import an existing encryption key with caching and rotation check
export const importEncryptionKey = async (keyBase64: string): Promise<CryptoKey> => {
  // Check cache first
  const cached = keyCache.get(keyBase64);
  if (cached) {
    if (cached.expires > Date.now()) {
      return cached.key;
    }
    // Remove expired key from cache
    keyCache.delete(keyBase64);
  }

  try {
    const keyData = base64ToArrayBuffer(keyBase64);
    
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    ).catch(err => {
      throw new Error(`Key import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    });
    
    // Check if key needs rotation
    const currentKey = getCurrentUserEncryptionKey();
    if (currentKey && currentKey.version < CURRENT_KEY_VERSION) {
      try {
        const newKey = await rotateEncryptionKey(keyBase64, true);
        // Retry with new key if rotation succeeded
        return importEncryptionKey(newKey);
      } catch (rotationError) {
        console.error('Key rotation failed:', rotationError);
        throw new Error('Failed to rotate encryption key - please try again');
      }
    }
    
    // Cache the key with expiration
    keyCache.set(keyBase64, {
      key,
      expires: Date.now() + CACHE_TTL_MS
    });
    
    return key;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Key rotated')) {
      throw error; // Re-throw rotation errors
    }
    throw new Error(`Failed to import key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Key versioning and rotation policy
const CURRENT_KEY_VERSION = 3; // Incremented for new security policy
const KEY_VERSION_SEPARATOR = ':';
const KEY_ROTATION_INTERVAL_DAYS = 30; // More frequent rotation
const KEY_ROTATION_WARNING_DAYS = 7; // Warn users before rotation
const MIN_PBKDF2_ITERATIONS = 600000;
const MAX_PBKDF2_ITERATIONS = 1000000; // Upper bound for security
const TARGET_PBKDF2_DURATION_MS = navigator.hardwareConcurrency > 4 ? 2000 : 1000;
const MIN_KEY_LIFETIME_MS = 24 * 60 * 60 * 1000; // Minimum 1 day between rotations

// Benchmark PBKDF2 iterations with enhanced security
const benchmarkPBKDF2Iterations = async (): Promise<number> => {
  try {
    const testPassword = 'benchmark-test-password-' + Math.random().toString(36).slice(2);
    const salt = window.crypto.getRandomValues(new Uint8Array(32));
    
    // Run benchmark 5 times for better accuracy
    const durations: number[] = [];
    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();
      
      // Use temporary key material that gets cleaned up
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(testPassword),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      
      const derivedKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: MIN_PBKDF2_ITERATIONS,
          hash: 'SHA-512'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Clean up temporary keys
      await window.crypto.subtle.exportKey('raw', derivedKey).then(zeroBuffer);
      durations.push(performance.now() - startTime);
    }
    
    // Get median duration
    durations.sort();
    const medianDuration = durations[2];
    
    // Scale iterations to target duration with bounds
    const scaledIterations = Math.max(
      MIN_PBKDF2_ITERATIONS,
      Math.min(
        MAX_PBKDF2_ITERATIONS,
        Math.floor((MIN_PBKDF2_ITERATIONS * TARGET_PBKDF2_DURATION_MS) / medianDuration)
      )
    );
    
    // Round to nearest 10,000 for consistent security
    return Math.ceil(scaledIterations / 10000) * 10000;
  } catch (error) {
    console.error('PBKDF2 benchmark failed:', error);
    return MIN_PBKDF2_ITERATIONS; // Fallback to minimum
  }
};

// Check if key rotation is needed soon
export const isKeyRotationNeededSoon = (): boolean => {
  const lastRotation = localStorage.getItem('last_key_rotation');
  if (!lastRotation) return true;
  
  const lastRotationTime = parseInt(lastRotation, 10);
  const daysSinceRotation = (Date.now() - lastRotationTime) / (24 * 60 * 60 * 1000);
  return daysSinceRotation > (KEY_ROTATION_INTERVAL_DAYS - KEY_ROTATION_WARNING_DAYS);
};

// Get the current user's encryption key from localStorage
export const getCurrentUserEncryptionKey = (): {key: string, version: number} | null => {
  const storedValue = localStorage.getItem('encryption_key');
  if (!storedValue) return null;
  
  // Check if key has version info (new format)
  if (storedValue.includes(KEY_VERSION_SEPARATOR)) {
    const [versionStr, key] = storedValue.split(KEY_VERSION_SEPARATOR);
    const version = parseInt(versionStr, 10);
    return {key, version};
  }
  
  // Legacy key (no version info)
  return {key: storedValue, version: 0};
};

// Rotate encryption key with enhanced security checks
export const rotateEncryptionKey = async (oldKey: string, force = false): Promise<string> => {
  try {
    // Check last rotation time
    const lastRotation = localStorage.getItem('last_key_rotation');
    const lastRotationTime = lastRotation ? parseInt(lastRotation, 10) : 0;
    const currentTime = Date.now();
    
    // Enforce minimum time between rotations
    if (!force && currentTime - lastRotationTime < MIN_KEY_LIFETIME_MS) {
      throw new Error(`Key rotation too soon - must wait at least ${MIN_KEY_LIFETIME_MS / (24 * 60 * 60 * 1000)} days`);
    }

    // Skip rotation if not forced and within rotation interval
    if (!force && currentTime - lastRotationTime < KEY_ROTATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000) {
      return oldKey;
    }

    // If rotation is needed soon but not forced, warn user
    if (!force && isKeyRotationNeededSoon()) {
      console.warn('Key rotation recommended soon - consider rotating your encryption key');
    }

    // Import old key (without rotation check to avoid recursion)
    const keyData = base64ToArrayBuffer(oldKey);
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Generate new key with additional entropy
    const newKey = await generateEncryptionKey();
    
    // Store with current version and rotation time
    localStorage.setItem('encryption_key', `${CURRENT_KEY_VERSION}${KEY_VERSION_SEPARATOR}${newKey}`);
    localStorage.setItem('last_key_rotation', Date.now().toString());
    
    // Clear cache for old key
    keyCache.delete(oldKey);
    
    // Zero out old key material
    zeroBuffer(keyData);
    
    // Log rotation (debug only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Key rotated from version ${getCurrentUserEncryptionKey()?.version || 0} to ${CURRENT_KEY_VERSION}`);
    }
    
    return newKey;
  } catch (error) {
    console.error('Key rotation error:', error);
    throw new Error(`Key rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

// Secure key derivation with enhanced memory protection
export const deriveKeyFromPassword = async (password: string, salt?: ArrayBuffer | string): Promise<{ key: string, salt: string }> => {
  try {
    // Generate a salt if one isn't provided
    let generatedSalt: Uint8Array | null = null;
    if (!salt) {
      generatedSalt = window.crypto.getRandomValues(new Uint8Array(32)); // Larger salt
      salt = generatedSalt;
    } else if (typeof salt === 'string') {
      salt = base64ToArrayBuffer(salt);
    }

    // Derive a key using PBKDF2 with dynamic iteration count
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Get dynamic iteration count based on current device performance
    const iterations = await benchmarkPBKDF2Iterations();
    
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-512' // Stronger hash
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const exportedKey = await window.crypto.subtle.exportKey('raw', derivedKey);
    const keyBase64 = arrayBufferToBase64(exportedKey);
    const saltBase64 = arrayBufferToBase64(salt);
    
    // Clean up sensitive data
    zeroBuffer(exportedKey);
    if (generatedSalt) {
      zeroBuffer(generatedSalt);
    }
    
    return {
      key: keyBase64,
      salt: saltBase64
    };
  } catch (error) {
    console.error('Key derivation failed:', error);
    throw new Error(`Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
