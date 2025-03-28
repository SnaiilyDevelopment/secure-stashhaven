
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { DEFAULT_STORAGE_LIMIT, STORAGE_BUCKET_NAME, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "./constants";

// Get total storage used by the current user
export const getUserStorageUsage = async (): Promise<{
  totalSize: number;
  fileCount: number;
  limit: number;
  percentUsed: number;
}> => {
  try {
    // Get user's files metadata to calculate storage usage
    const { data, error } = await supabase
      .from('file_metadata')
      .select('size');
    
    if (error) {
      console.error("Error fetching storage usage:", error);
      return { totalSize: 0, fileCount: 0, limit: DEFAULT_STORAGE_LIMIT, percentUsed: 0 };
    }
    
    // Calculate total size in bytes
    const totalSize = data.reduce((acc, file) => acc + (file.size || 0), 0);
    const fileCount = data.length;
    
    // Get user's storage limit (could be customized per user in the future)
    const storageLimit = DEFAULT_STORAGE_LIMIT;
    const percentUsed = (totalSize / storageLimit) * 100;
    
    return { 
      totalSize, 
      fileCount, 
      limit: storageLimit,
      percentUsed
    };
  } catch (error) {
    console.error("Error calculating storage usage:", error);
    return { 
      totalSize: 0, 
      fileCount: 0, 
      limit: DEFAULT_STORAGE_LIMIT,
      percentUsed: 0 
    };
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
export const ensureStorageBucket = async (bucketName: string = STORAGE_BUCKET_NAME): Promise<boolean> => {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} doesn't exist, attempting to create it`);
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE, // 50MB limit per file
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

// Check if user has enough storage space for a file
export const hasEnoughStorageSpace = async (fileSize: number): Promise<boolean> => {
  try {
    const { totalSize, limit } = await getUserStorageUsage();
    const newTotalSize = totalSize + fileSize;
    
    return newTotalSize <= limit;
  } catch (error) {
    console.error("Error checking storage space:", error);
    return false;
  }
};

// Validate file type and size
export const validateFile = (file: File): { valid: boolean; message?: string } => {
  // Check if file type is allowed
  if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
    return { 
      valid: false, 
      message: `File type not allowed. Supported formats include PDF, Word, Excel, PowerPoint, images, and common archive formats.` 
    };
  }
  
  // Check if file size is within the allowed limit for this type
  const typeLimit = ALLOWED_FILE_TYPES[file.type];
  if (file.size > typeLimit) {
    return { 
      valid: false, 
      message: `File too large. Maximum size for ${file.type} is ${formatBytes(typeLimit)}.` 
    };
  }
  
  return { valid: true };
};

// Get user's storage quota details
export const getStorageQuota = async (): Promise<{
  used: number;
  limit: number;
  available: number;
  percentUsed: number;
  formattedUsed: string;
  formattedLimit: string;
  formattedAvailable: string;
}> => {
  const { totalSize, limit } = await getUserStorageUsage();
  const available = Math.max(0, limit - totalSize);
  const percentUsed = (totalSize / limit) * 100;
  
  return {
    used: totalSize,
    limit,
    available,
    percentUsed,
    formattedUsed: formatBytes(totalSize),
    formattedLimit: formatBytes(limit),
    formattedAvailable: formatBytes(available)
  };
};
