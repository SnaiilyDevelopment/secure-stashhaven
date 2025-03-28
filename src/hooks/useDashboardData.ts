
import { useState, useEffect, useCallback } from 'react';
import { listUserFiles, FileMetadata } from '@/lib/storage';
import { toast } from '@/components/ui/use-toast';
import { STORAGE_BUCKET_NAME } from '@/lib/storage/constants';

export const useDashboardData = (initialLoad = true) => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("Fetching files...");
      
      // Get files with retry mechanism
      let fileData: FileMetadata[] = [];
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          // Use listUserFiles from the storage module
          fileData = await listUserFiles(STORAGE_BUCKET_NAME);
          console.log("Files fetched:", fileData);
          
          // Process files to extract folder information
          const extractedFolders = new Set<string>();
          
          fileData.forEach(file => {
            // Check if the filename contains folder information (e.g., "folder/filename.ext")
            const filePath = file.file_path;
            const pathParts = filePath.split('/');
            
            // If we have a path like "folder/file.txt"
            if (pathParts.length > 1 && pathParts[0] !== '') {
              extractedFolders.add(pathParts[0]);
            }
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
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load your files.",
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
      ? file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
      
    const matchesFolder = currentFolder === null 
      ? file.file_path.indexOf('/') === -1 // Files not in folders
      : file.file_path.startsWith(`${currentFolder}/`); // Files in the selected folder
      
    return matchesSearch && matchesFolder;
  });
    
  return {
    files,
    filteredFiles,
    folders,
    currentFolder,
    isLoading,
    searchQuery,
    setSearchQuery,
    loadData,
    createFolder,
    selectFolder
  };
};
