
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FilesSection from './FilesSection';
import FolderManager from './FolderManager';
import { SharedFile } from '@/lib/filesharing';
import { getFilesSharedWithMe } from '@/lib/filesharing';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import UploadDialog from './UploadDialog';
import { FileItem } from './FileList';

interface DashboardContentProps {
  files: FileItem[];
  folders: string[];
  currentFolder: string | null;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onFolderCreate: (name: string) => void;
  onFolderSelect: (folder: string | null) => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  files,
  folders,
  currentFolder,
  isLoading,
  searchQuery,
  onSearchChange,
  onRefresh,
  onFolderCreate,
  onFolderSelect
}) => {
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [isLoadingShared, setIsLoadingShared] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  // Load shared files
  useEffect(() => {
    const loadSharedFiles = async () => {
      try {
        setIsLoadingShared(true);
        const shared = await getFilesSharedWithMe();
        setSharedFiles(shared);
      } catch (error) {
        console.error("Error loading shared files:", error);
      } finally {
        setIsLoadingShared(false);
      }
    };
    
    loadSharedFiles();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <FolderManager 
          folders={folders}
          currentFolder={currentFolder}
          onFolderCreate={onFolderCreate}
          onFolderSelect={onFolderSelect}
        />
        
        <Button 
          onClick={() => setIsUploadDialogOpen(true)} 
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Upload File
        </Button>
      </div>
      
      <FilesSection
        files={files}
        sharedFiles={sharedFiles}
        isLoading={isLoading || isLoadingShared}
        searchTerm={searchQuery}
        onSearchChange={onSearchChange}
        onRefresh={onRefresh}
      />
      
      <UploadDialog 
        open={isUploadDialogOpen} 
        onOpenChange={setIsUploadDialogOpen}
        onUploadComplete={onRefresh}
      />
    </div>
  );
};

export default DashboardContent;
