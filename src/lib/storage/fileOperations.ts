
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface FileMetadata {
  id: string;
  user_id: string;
  original_name: string;
  file_path: string;
  size: number;
  original_type: string;
  created_at: string;
  updated_at: string;
  encrypted: boolean;
}

/**
 * Uploads a file to Supabase storage and saves its metadata.
 * @param {File} file The file to upload.
 * @param {string} userId The ID of the user uploading the file.
 * @returns {Promise<FileMetadata>} A promise that resolves with the file metadata.
 */
export const uploadFile = async (file: File, userId: string): Promise<FileMetadata> => {
  const fileId = uuidv4();
  const filePath = `uploads/${userId}/${fileId}-${file.name}`;
  
  try {
    // Upload the file to Supabase storage
    const { data, error: uploadError } = await supabase.storage
      .from('secure-vault-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      throw new Error(`File upload failed: ${uploadError.message}`);
    }
    
    if (!data?.path) {
      throw new Error('File path not returned from upload');
    }
    
    // Save file metadata to Supabase database
    const currentTime = new Date().toISOString();
    const fileMetadata: FileMetadata = {
      id: fileId,
      user_id: userId,
      original_name: file.name,
      file_path: data.path,
      size: file.size,
      original_type: file.type,
      created_at: currentTime,
      updated_at: currentTime,
      encrypted: true // Assuming all files are encrypted
    };
    
    const { error: metadataError } = await supabase
      .from('file_metadata')  // Changed from 'files' to 'file_metadata' to match the database schema
      .insert([fileMetadata]);
    
    if (metadataError) {
      // Attempt to delete the file from storage if metadata saving fails
      await supabase.storage
        .from('secure-vault-files')
        .remove([filePath]);
      
      throw new Error(`Failed to save file metadata: ${metadataError.message}`);
    }
    
    return fileMetadata;
  } catch (error: any) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Deletes a file from Supabase storage and removes its metadata.
 * @param {string} fileId The ID of the file to delete.
 * @returns {Promise<boolean>} A promise that resolves with true when the file is deleted.
 */
export const deleteFile = async (fileId: string): Promise<boolean> => {
  try {
    // Get the file metadata from the database
    const { data: fileMetadata, error: selectError } = await supabase
      .from('file_metadata')  // Changed from 'files' to 'file_metadata'
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (selectError) {
      throw new Error(`Failed to get file metadata: ${selectError.message}`);
    }
    
    if (!fileMetadata) {
      throw new Error('File not found');
    }
    
    // Delete the file from Supabase storage
    const { error: deleteError } = await supabase.storage
      .from('secure-vault-files')
      .remove([fileMetadata.file_path]);
    
    if (deleteError) {
      throw new Error(`Failed to delete file from storage: ${deleteError.message}`);
    }
    
    // Remove the file metadata from the database
    const { error: removeError } = await supabase
      .from('file_metadata')  // Changed from 'files' to 'file_metadata'
      .delete()
      .eq('id', fileId);
    
    if (removeError) {
      throw new Error(`Failed to remove file metadata: ${removeError.message}`);
    }

    return true;
  } catch (error: any) {
    console.error('Delete error:', error);
    throw error;
  }
};

/**
 * Retrieves all files metadata for a specific user.
 * @param {string} userId The ID of the user.
 * @returns {Promise<FileMetadata[]>} A promise that resolves with an array of file metadata.
 */
export const getUserFiles = async (userId: string): Promise<FileMetadata[]> => {
  try {
    const { data, error } = await supabase
      .from('file_metadata')  // Changed from 'files' to 'file_metadata'
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to get user files: ${error.message}`);
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Get user files error:', error);
    throw error;
  }
};

/**
 * Retrieves the storage usage for a specific user.
 * @returns {Promise<number>} A promise that resolves with the total storage used in bytes.
 */
export const getUserStorageUsage = async (): Promise<number> => {
  try {
    // List all the objects in the storage bucket for the user
    const { data, error } = await supabase.storage
      .from('secure-vault-files')
      .list('uploads/', { 
        search: '',
        sortBy: { column: 'created_at', order: 'asc' },
      });
    
    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
    
    // Calculate the total size of all files
    const totalBytes = data?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;
    return totalBytes;
  } catch (error: any) {
    console.error('Get user storage usage error:', error);
    throw error;
  }
};
