
import { supabase } from "@/integrations/supabase/client";
import { formatBytes as formatBytesSizeUtil } from './formatUtils';
import { getUserStorageUsage } from './storageUsageUtils';

// Default quota in bytes (50MB for free tier)
const DEFAULT_QUOTA = 50 * 1024 * 1024;

export async function getStorageQuota(): Promise<number> {
  try {
    // In a real implementation, this might fetch the user's quota from a database
    // Here we're just returning a fixed quota for simplicity
    return DEFAULT_QUOTA;
  } catch (error) {
    console.error("Error getting storage quota:", error);
    return DEFAULT_QUOTA;
  }
}

export async function hasEnoughStorageSpace(fileSize: number): Promise<boolean> {
  try {
    const usage = await getUserStorageUsage();
    const quota = await getStorageQuota();
    
    if (!usage || !quota) return false;
    
    const currentUsage = typeof usage.totalSize === 'number' ? usage.totalSize : 0;
    const availableSpace = quota - currentUsage;
    
    return fileSize <= availableSpace;
  } catch (error) {
    console.error("Error checking storage space:", error);
    return false;
  }
}

export function formatBytes(bytes: number): string {
  return formatBytesSizeUtil(bytes);
}
