
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
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`Error listing buckets:`, listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} doesn't exist, attempting to create it`);
      
      // Create bucket with more modest file size limit to prevent errors
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit per file (reduced from 100MB)
      });
      
      if (error) {
        console.error(`Error creating bucket ${bucketName}:`, error);
        // If creation fails, assume bucket exists but we don't have permission to create
        console.log("Assuming bucket exists but we don't have permission to create one");
        return true;
      }
      
      console.log(`Bucket ${bucketName} created successfully`);
    }
    
    return true;
  } catch (error) {
    console.error("Error ensuring storage bucket:", error);
    // Assume bucket exists to allow file uploading to continue
    return true;
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
  // Allow any file type
  if (ALLOWED_FILE_TYPES === '*/*') {
    // Only check file size
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        message: `File too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.` 
      };
    }
    return { valid: true };
  }
  
  // For specific file type restrictions (when not using '*/*')
  if (typeof ALLOWED_FILE_TYPES === 'string') {
    const fileTypePattern = new RegExp(ALLOWED_FILE_TYPES.replace('*', '.*'));
    if (!fileTypePattern.test(file.type)) {
      return { 
        valid: false, 
        message: `File type not allowed. Supported format: ${ALLOWED_FILE_TYPES}` 
      };
    }
  } else if (Array.isArray(ALLOWED_FILE_TYPES)) {
    const allowsAllTypes = ALLOWED_FILE_TYPES.includes('*/*');
    if (!allowsAllTypes && !ALLOWED_FILE_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        message: `File type not allowed. Supported formats include PDF, Word, Excel, PowerPoint, images, and common archive formats.` 
      };
    }
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      message: `File too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.` 
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
