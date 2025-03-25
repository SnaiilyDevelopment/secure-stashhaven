
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileMetadata } from '@/lib/types';
import FileCard from './FileCard';

interface FileListProps {
  files: FileMetadata[];
  onFileClick?: (file: FileMetadata) => void;
  onDeleteFile?: (file: FileMetadata) => void;
  onShareFile?: (file: FileMetadata) => void;
  isLoading?: boolean;
}

const FileList: React.FC<FileListProps> = ({
  files,
  onFileClick,
  onDeleteFile,
  onShareFile,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'docs' | 'other'>('all');
  
  const filteredFiles = files.filter(file => {
    if (activeTab === 'all') return true;
    if (activeTab === 'images' && file.original_type?.startsWith('image/')) return true;
    if (activeTab === 'docs' && (
      file.original_type?.includes('document') || 
      file.original_type?.includes('pdf') ||
      file.original_type?.includes('word') ||
      file.original_type?.includes('excel') ||
      file.original_type?.includes('text') ||
      file.original_type?.includes('spreadsheet')
    )) return true;
    if (activeTab === 'other' && 
      !file.original_type?.startsWith('image/') && 
      !file.original_type?.includes('document') && 
      !file.original_type?.includes('pdf') &&
      !file.original_type?.includes('word') &&
      !file.original_type?.includes('excel') &&
      !file.original_type?.includes('text') &&
      !file.original_type?.includes('spreadsheet')
    ) return true;
    return false;
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as any)}>
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
              onClick={() => onFileClick?.(file)}
              onDelete={() => onDeleteFile?.(file)}
              onShare={() => onShareFile?.(file)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-500">
            No files found in this category
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;
