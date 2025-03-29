
import React, { useState } from 'react';
import FilesSection from './FilesSection';
import FolderManager from './FolderManager';
import { SharedFile } from '@/lib/filesharing';
import { FileMetadata } from '@/lib/storage';
import { getFilesSharedWithMe } from '@/lib/filesharing';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Folder, FolderPlus } from 'lucide-react';
import UploadDialog from './UploadDialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleOpenUploadDialog('file')}
            >
              <Upload className="h-4 w-4" />
              <span>Upload File</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleOpenUploadDialog('folder')}
            >
              <Folder className="h-4 w-4" />
              <span>Upload Folder</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleOpenUploadDialog('new-folder')}
            >
              <FolderPlus className="h-4 w-4" />
              <span>Create Folder</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <FilesSection
        files={files}
        sharedFiles={sharedFiles}
        isLoading={isLoading || isLoadingShared}
        searchTerm={searchQuery}
        onSearchChange={onSearchChange}
        onRefresh={onRefresh}
        onFolderCreate={onFolderCreate}
      />
      
      <UploadDialog 
        open={isUploadDialogOpen} 
        onOpenChange={setIsUploadDialogOpen}
        onUploadComplete={onRefresh}
        onFolderCreate={onFolderCreate}
      />
    </div>
  );
};

export default DashboardContent;
