
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_STORAGE_LIMIT } from "../constants";
import { formatBytes } from "./formatUtils";

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
