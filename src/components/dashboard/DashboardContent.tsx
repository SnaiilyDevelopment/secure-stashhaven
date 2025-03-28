
import React from 'react';
import FileListHeader from '@/components/dashboard/FileListHeader';
import FileList from '@/components/dashboard/FileList';
import StorageUsageDisplay from '@/components/dashboard/StorageUsageDisplay';
import FolderManager from '@/components/dashboard/FolderManager';

interface DashboardContentProps {
  files: any[];
  folders: string[];
  currentFolder: string | null;
  isLoading: boolean;
  storageUsage: {
    totalSize: number;
    fileCount: number;
    limit: number;
  };
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onFolderCreate: (folderName: string) => void;
  onFolderSelect: (folder: string | null) => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  files,
  folders,
  currentFolder,
  isLoading,
  storageUsage,
  searchQuery,
  onSearchChange,
  onRefresh,
  onFolderCreate,
  onFolderSelect
}) => {
  const folderLabel = currentFolder ? ` in "${currentFolder}"` : '';
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      <div className="lg:col-span-1">
        <FolderManager 
          folders={folders}
          currentFolder={currentFolder}
          onFolderCreate={onFolderCreate}
          onFolderSelect={onFolderSelect}
        />
        
        <StorageUsageDisplay
          used={storageUsage.totalSize}
          limit={storageUsage.limit}
          fileCount={storageUsage.fileCount}
        />
      </div>
      
      <div className="lg:col-span-3">
        <FileListHeader
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onRefresh={onRefresh}
          isLoading={isLoading}
          currentFolder={currentFolder}
        />
        <FileList 
          files={files.map(file => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            dateAdded: file.dateAdded,
            encrypted: file.encrypted,
            filePath: file.filePath,
            folder: file.folder
          }))}
          isLoading={isLoading}
          onDeleteComplete={onRefresh}
          emptyMessage={`No files found${folderLabel}. Upload your first encrypted file.`}
        />
      </div>
    </div>
  );
};

export default DashboardContent;
