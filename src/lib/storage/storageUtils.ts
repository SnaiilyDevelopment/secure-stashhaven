
/**
 * Utility functions for Supabase Storage
 */

import { supabase } from '@/integrations/supabase/client';

// Default bucket name for file storage
export const DEFAULT_BUCKET = 'encrypted-files';

// Ensure the storage bucket exists
export const ensureStorageBucket = async (name: string = DEFAULT_BUCKET): Promise<boolean> => {
  try {
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error listing buckets:", error);
      return false;
    }
    
    // If bucket exists, return true
    if (buckets.some(bucket => bucket.name === name)) {
      console.log(`Bucket '${name}' already exists`);
      return true;
    }
    
    // Create bucket if it doesn't exist
    const { error: createError } = await supabase.storage.createBucket(name, {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
    });
    
    if (createError) {
      console.error(`Error creating bucket '${name}':`, createError);
      return false;
    }
    
    console.log(`Bucket '${name}' created successfully`);
    return true;
  } catch (error) {
    console.error("Error in ensureStorageBucket:", error);
    return false;
  }
};

// Get storage usage for the current user in bytes
export const getUserStorageUsage = async (): Promise<number> => {
  try {
    // Query file metadata to sum up file sizes
    const { data, error } = await supabase
      .from('file_metadata')
      .select('size');
    
    if (error) {
      console.error("Error getting storage usage:", error);
      return 0;
    }
    
    // Sum up file sizes
    return data.reduce((total, file) => total + (file.size || 0), 0);
  } catch (error) {
    console.error("Error in getUserStorageUsage:", error);
    return 0;
  }
};

// Format bytes to human-readable format
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
