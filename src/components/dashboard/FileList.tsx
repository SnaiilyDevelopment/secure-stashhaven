
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileItemAdapter } from '@/lib/types';
import FileCard from './FileCard';

interface FileListProps {
  files: FileItemAdapter[];
  activeTab?: string;
  setActiveTab?: React.Dispatch<React.SetStateAction<string>>;
  downloadFile?: (fileId: string) => Promise<void>;
  deleteFile?: (fileId: string) => void;
  onDeleteComplete?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

const FileList: React.FC<FileListProps> = ({
  files,
  activeTab = 'all',
  setActiveTab,
  downloadFile,
  deleteFile,
  onDeleteComplete,
  isLoading = false,
  emptyMessage = "No files found"
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<'all' | 'images' | 'docs' | 'other'>('all');
  
  // Use either the prop or the local state for the active tab
  const currentActiveTab = setActiveTab ? activeTab as 'all' | 'images' | 'docs' | 'other' : localActiveTab;
  const handleTabChange = (value: string) => {
    if (setActiveTab) {
      setActiveTab(value);
    } else {
      setLocalActiveTab(value as 'all' | 'images' | 'docs' | 'other');
    }
  };
  
  const filteredFiles = files.filter(file => {
    if (currentActiveTab === 'all') return true;
    if (currentActiveTab === 'images' && file.type?.startsWith('image/')) return true;
    if (currentActiveTab === 'docs' && (
      file.type?.includes('document') || 
      file.type?.includes('pdf') ||
      file.type?.includes('word') ||
      file.type?.includes('excel') ||
      file.type?.includes('text') ||
      file.type?.includes('spreadsheet')
    )) return true;
    if (currentActiveTab === 'other' && 
      !file.type?.startsWith('image/') && 
      !file.type?.includes('document') && 
      !file.type?.includes('pdf') &&
      !file.type?.includes('word') &&
      !file.type?.includes('excel') &&
      !file.type?.includes('text') &&
      !file.type?.includes('spreadsheet')
    ) return true;
    return false;
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" value={currentActiveTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={`skeleton-${i}`} 
              className="bg-gray-100 animate-pulse rounded-lg h-48"
            />
          ))
        ) : filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDelete={() => {
                if (deleteFile) {
                  deleteFile(file.id);
                }
                if (onDeleteComplete) {
                  onDeleteComplete();
                }
              }}
              onDownload={downloadFile ? () => downloadFile(file.id) : undefined}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;
