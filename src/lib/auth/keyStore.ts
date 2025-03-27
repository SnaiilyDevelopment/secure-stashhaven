
import { supabase } from '@/integrations/supabase/client';

/**
 * Saves the encryption key to local storage and optionally to server
 * @param key The encryption key to save
 * @param saveToServer Whether to save the key to the server as well
 */
export const saveEncryptionKey = (key: string, saveToServer: boolean = false) => {
  localStorage.setItem('encryption_key', key);
  
  if (saveToServer) {
    // Implementation for server storage if needed
    console.log('Server storage of encryption keys not implemented yet');
  }
};

/**
 * Retrieves the encryption key from storage
 * @returns The encryption key or null if not found
 */
export const getEncryptionKey = (): string | null => {
  return localStorage.getItem('encryption_key');
};

/**
 * Clears the encryption key from local storage
 */
export const clearEncryptionKey = () => {
  localStorage.removeItem('encryption_key');
};
