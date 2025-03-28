
import { useState, useEffect } from 'react';
import { listFiles } from '@/lib/storage/fileOperations';
import { getUserStorageUsage } from '@/lib/storage/storageUtils';
import { toast } from '@/components/ui/use-toast';

export interface StorageUsage {
  totalSize: number;
  fileCount: number;
  limit: number;
}

export const useDashboardData = (initialLoad = true) => {
  const [files, setFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [storageUsage, setStorageUsage] = useState<StorageUsage>({ 
    totalSize: 0, 
    fileCount: 0, 
    limit: 0 
  });
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching files and storage usage...");
      
      // Get files with retry mechanism
      let fileData = [];
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          fileData = await listFiles();
          console.log("Files fetched:", fileData);
          break; // Exit loop if successful
        } catch (error) {
          console.error(`Error fetching files (attempt ${retries + 1}/${maxRetries + 1}):`, error);
          retries++;
          
          if (retries <= maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          } else {
            toast({
              title: "Error",
              description: "Failed to load your files. Please try refreshing.",
              variant: "destructive"
            });
          }
        }
      }
      
      setFiles(fileData);
      
      // Get storage usage
      try {
        const usage = await getUserStorageUsage();
        setStorageUsage({
          totalSize: usage.totalSize,
          fileCount: usage.fileCount,
          limit: usage.limit
        });
      } catch (error) {
        console.error('Error loading storage usage:', error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load your files and storage information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data on initial render
  useEffect(() => {
    if (initialLoad) {
      loadData();
    }
  }, [initialLoad]);
  
  // Filter files based on search query
  const filteredFiles = searchQuery
    ? files.filter(file => 
        file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;
    
  return {
    files,
    filteredFiles,
    isLoading,
    storageUsage,
    searchQuery,
    setSearchQuery,
    loadData
  };
};
