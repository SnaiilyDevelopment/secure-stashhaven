
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Get total storage used by the current user
export const getUserStorageUsage = async (): Promise<{
  totalSize: number;
  fileCount: number;
}> => {
  try {
    // Get user's files metadata to calculate storage usage
    const { data, error } = await supabase
      .from('file_metadata')
      .select('size');
    
    if (error) {
      console.error("Error fetching storage usage:", error);
      return { totalSize: 0, fileCount: 0 };
    }
    
    // Calculate total size in bytes
    const totalSize = data.reduce((acc, file) => acc + (file.size || 0), 0);
    const fileCount = data.length;
    
    return { totalSize, fileCount };
  } catch (error) {
    console.error("Error calculating storage usage:", error);
    return { totalSize: 0, fileCount: 0 };
  }
};

// Format bytes to human-readable format
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Create a storage bucket if it doesn't exist
export const ensureStorageBucket = async (bucketName: string): Promise<boolean> => {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} doesn't exist, attempting to create it`);
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit per file
      });
      
      if (error) {
        console.error(`Error creating bucket ${bucketName}:`, error);
        return false;
      }
      
      console.log(`Bucket ${bucketName} created successfully`);
    }
    
    return true;
  } catch (error) {
    console.error("Error ensuring storage bucket:", error);
    return false;
  }
};
