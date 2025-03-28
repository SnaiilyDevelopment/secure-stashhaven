
import { useState, useEffect, useCallback } from 'react';
import { listFiles } from '@/lib/storage/fileOperations';
import { getUserStorageUsage } from '@/lib/storage/storageUtils';
import { toast } from '@/components/ui/use-toast';
import { FileItem } from '@/components/dashboard/FileList';

export interface StorageUsage {
  totalSize: number;
  fileCount: number;
  limit: number;
}

export interface DashboardState {
  files: FileItem[];
  filteredFiles: FileItem[];
  folders: string[];
  currentFolder: string | null;
  isLoading: boolean;
  storageUsage: StorageUsage;
  searchQuery: string;
}

export const useDashboardData = (initialLoad = true) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [storageUsage, setStorageUsage] = useState<StorageUsage>({ 
    totalSize: 0, 
    fileCount: 0, 
    limit: 0 
  });
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("Fetching files and storage usage...");
      
      // Get files with retry mechanism
      let fileData = [];
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          const rawFiles = await listFiles();
          console.log("Files fetched:", rawFiles);
          
          // Process files to extract folder information
          const extractedFolders = new Set<string>();
          
          fileData = rawFiles.map(file => {
            // Check if the filename contains folder information (e.g., "folder/filename.ext")
            const filePath = file.file_path;
            const pathParts = filePath.split('/');
            let folder: string | undefined = undefined;
            
            // If we have a path like "folder/file.txt"
            if (pathParts.length > 1 && pathParts[0] !== '') {
              folder = pathParts[0];
              extractedFolders.add(folder);
            }
            
            return {
              id: file.id,
              name: file.original_name,
              size: file.size,
              type: file.original_type,
              dateAdded: file.created_at,
              encrypted: file.encrypted,
              filePath: file.file_path,
              folder
            };
          });
          
          // Update folders list
          setFolders(Array.from(extractedFolders));
          
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
  }, []);
  
  // Create folder
  const createFolder = useCallback((folderName: string) => {
    if (folders.includes(folderName)) return;
    setFolders(prev => [...prev, folderName]);
  }, [folders]);
  
  // Select folder
  const selectFolder = useCallback((folder: string | null) => {
    setCurrentFolder(folder);
  }, []);
  
  // Load data on initial render
  useEffect(() => {
    if (initialLoad) {
      loadData();
    }
  }, [initialLoad, loadData]);
  
  // Filter files based on search query and current folder
  const filteredFiles = files.filter(file => {
    const matchesSearch = searchQuery 
      ? file.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
      
    const matchesFolder = currentFolder === null 
      ? true 
      : file.folder === currentFolder;
      
    return matchesSearch && matchesFolder;
  });
    
  return {
    files,
    filteredFiles,
    folders,
    currentFolder,
    isLoading,
    storageUsage,
    searchQuery,
    setSearchQuery,
    loadData,
    createFolder,
    selectFolder
  };
};
