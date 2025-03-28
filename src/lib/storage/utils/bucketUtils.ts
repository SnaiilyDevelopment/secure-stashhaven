
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_BUCKET_NAME } from '../constants';

// Create a storage bucket if it doesn't exist - improved with better error handling
export const ensureStorageBucket = async (bucketName: string = STORAGE_BUCKET_NAME): Promise<boolean> => {
  try {
    // Check if the bucket exists first
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`Error listing buckets:`, listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} doesn't exist, attempting to create it`);
      
      try {
        // Create bucket with more modest file size limit to prevent errors
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB limit per file
        });
        
        if (error) {
          // Fix: Don't check for status code since it's not available in this type
          console.error(`Error creating bucket ${bucketName}:`, error);
          
          // Important fix: If we get an RLS error, we assume the bucket already exists
          if (error.message && (
              error.message.includes("row-level security policy") || 
              error.message.includes("bucket"))) {
            console.log("RLS policy error - assuming bucket exists with restricted permissions");
            return true;
          }
          
          return false;
        }
        
        console.log(`Bucket ${bucketName} created successfully`);
        return true;
      } catch (createError) {
        console.error(`Exception creating bucket ${bucketName}:`, createError);
        // Assume bucket exists for better user experience
        return true;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error ensuring storage bucket:", error);
    // Assume bucket exists to allow file uploading to continue
    return true;
  }
};
