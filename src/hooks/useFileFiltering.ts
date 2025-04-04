
import { FileMetadata } from '@/lib/storage';
import { useCallback } from 'react';

export const useFileFiltering = () => {
  // Filter files based on search query and current folder
  const filterFilesBySearchAndFolder = useCallback(
    (files: FileMetadata[], searchQuery: string, currentFolder: string | null): FileMetadata[] => {
      return files.filter(file => {
        const matchesSearch = searchQuery 
          ? file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
          
        const matchesFolder = currentFolder === null 
          ? file.file_path.indexOf('/') === -1 // Files not in folders
          : file.file_path.startsWith(`${currentFolder}/`); // Files in the selected folder
          
        return matchesSearch && matchesFolder;
      });
    },
    []
  );

  return { filterFilesBySearchAndFolder };
};
