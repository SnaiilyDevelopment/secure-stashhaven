
import React, { useState, useEffect } from 'react';
import FilesSection from './FilesSection';
import FolderManager from './FolderManager';
import { SharedFile } from '@/lib/filesharing';
import { FileMetadata } from '@/lib/storage';
import { getFilesSharedWithMe } from '@/lib/filesharing';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import UploadDialog from './UploadDialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddContentActions from './actions/AddContentActions';

interface DashboardContentProps {
  files: FileMetadata[];
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
  const [uploadDialogAction, setUploadDialogAction] = useState<'file' | 'folder' | 'new-folder'>('file');
  
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
  
  const handleOpenUploadDialog = (action: 'file' | 'folder' | 'new-folder') => {
    setUploadDialogAction(action);
    setIsUploadDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <FolderManager 
          folders={folders}
          currentFolder={currentFolder}
          onFolderCreate={onFolderCreate}
          onFolderSelect={onFolderSelect}
        />
        
        <AddContentActions onActionSelect={handleOpenUploadDialog} />
      </div>
      
      <FilesSection
        files={files}
        sharedFiles={sharedFiles}
        isLoading={isLoading || isLoadingShared}
        searchTerm={searchQuery}
        onSearchChange={onSearchChange}
        onRefresh={onRefresh}
        onFolderCreate={onFolderCreate}
        onUploadDialogOpen={() => setIsUploadDialogOpen(true)}
      />
      
      <UploadDialog 
        open={isUploadDialogOpen} 
        onOpenChange={setIsUploadDialogOpen}
        onUploadComplete={onRefresh}
        onFolderCreate={onFolderCreate}
        initialAction={uploadDialogAction}
      />
    </div>
  );
};

export default DashboardContent;
