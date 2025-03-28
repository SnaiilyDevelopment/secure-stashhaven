
import React from 'react';
import FileListHeader from '@/components/dashboard/FileListHeader';
import FileList from '@/components/dashboard/FileList';
import StorageUsageDisplay from '@/components/dashboard/StorageUsageDisplay';

interface DashboardContentProps {
  files: any[];
  isLoading: boolean;
  storageUsage: {
    totalSize: number;
    fileCount: number;
    limit: number;
  };
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  files,
  isLoading,
  storageUsage,
  searchQuery,
  onSearchChange,
  onRefresh
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        <FileListHeader
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onRefresh={onRefresh}
          isLoading={isLoading}
        />
        <FileList 
          files={files.map(file => ({
            id: file.id,
            name: file.original_name,
            size: file.size,
            type: file.original_type,
            dateAdded: file.created_at,
            encrypted: file.encrypted,
            filePath: file.file_path
          }))}
          isLoading={isLoading}
          onDeleteComplete={onRefresh}
          emptyMessage="No files found. Upload your first encrypted file."
        />
      </div>
      
      <div>
        <StorageUsageDisplay
          used={storageUsage.totalSize}
          limit={storageUsage.limit}
          fileCount={storageUsage.fileCount}
        />
      </div>
    </div>
  );
};

export default DashboardContent;
