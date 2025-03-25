
/**
 * File management operations for Supabase Storage
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserEncryptionKey } from '@/lib/auth';

// File metadata type
export interface FileMetadata {
  id: string;
  file_path: string;
  original_name: string;
  original_type: string;
  size: number;
  encrypted: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// List user's files
export const listUserFiles = async (): Promise<FileMetadata[]> => {
  try {
    // Ensure the user is authenticated
    const encryptionKey = getCurrentUserEncryptionKey();
    if (!encryptionKey) {
      console.error("No encryption key found - user not authenticated");
      return [];
    }
    
    // Query file metadata from database
    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching files:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in listUserFiles:", error);
    return [];
  }
};

// Get metadata for a specific file
export const getFileMetadata = async (filePath: string): Promise<FileMetadata | null> => {
  try {
    // Query specific file metadata
    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('file_path', filePath)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // no rows returned
        return null;
      }
      console.error("Error fetching file metadata:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getFileMetadata:", error);
    return null;
  }
};
