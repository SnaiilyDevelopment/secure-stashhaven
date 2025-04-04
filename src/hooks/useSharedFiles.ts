
import { useState, useEffect } from 'react';
import { SharedFile } from '@/lib/filesharing';
import { getFilesSharedWithMe } from '@/lib/filesharing';

export const useSharedFiles = () => {
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [isLoadingShared, setIsLoadingShared] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load shared files
  useEffect(() => {
    const loadSharedFiles = async () => {
      try {
        setIsLoadingShared(true);
        const shared = await getFilesSharedWithMe();
        setSharedFiles(shared);
      } catch (error) {
        console.error("Error loading shared files:", error);
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsLoadingShared(false);
      }
    };
    
    loadSharedFiles();
  }, []);

  return {
    sharedFiles,
    isLoadingShared,
    error
  };
};
