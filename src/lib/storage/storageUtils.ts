// Re-export all utility functions from their respective modules
export { formatBytes } from './utils/formatUtils';
export { validateFile } from './utils/validationUtils';
export { ensureStorageBucket } from './utils/bucketUtils';
export { 
  getUserStorageUsage, 
  hasEnoughStorageSpace, 
  getStorageQuota 
} from './utils/storageUsageUtils';

// Update the validateFile function to handle errors better
export const validateFile = (file: File): { valid: boolean; message: string } => {
  // Check file size (max 50MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
  
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File size exceeds the maximum limit of ${formatBytes(MAX_FILE_SIZE)}.`
    };
  }
  
  return { valid: true, message: '' };
};

// Ensure the bucket exists (with better error handling for row-level security)
export const ensureStorageBucket = async (bucketName: string): Promise<boolean> => {
  try {
    // First check if bucket exists
    const { data: buckets, error: getBucketError } = await supabase.storage.listBuckets();
    
    if (getBucketError) {
      console.error('Error checking for bucket:', getBucketError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} doesn't exist, creating...`);
      
      // Create the bucket with public access
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024 // 50 MB
      });
      
      if (createError) {
        // Handle potential RLS error (non-fatal)
        console.error('Error creating bucket:', createError);
        
        if (typeof createError?.message === 'string' && 
            (createError.message.includes('security') || 
             createError.message.includes('policy'))) {
          console.log('RLS policy error - this might be expected when using user accounts without admin rights');
          // We can continue as the bucket might actually exist but the user doesn't have permission to create
          return true;
        }
        
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
};
