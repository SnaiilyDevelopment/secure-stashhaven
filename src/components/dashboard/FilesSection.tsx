
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileList from './FileList';
import SearchBar from './SearchBar';
import { FileItemAdapter, adaptFileMetadataToFileItem, adaptSharedFileToFileItem } from '@/lib/types';
import { FileMetadata } from '@/lib/storage';
import { SharedFile } from '@/lib/filesharing';

interface FilesSectionProps {
  files: FileMetadata[];
  sharedFiles: SharedFile[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

const FilesSection: React.FC<FilesSectionProps> = ({
  files,
  sharedFiles,
  isLoading,
  searchTerm,
  onSearchChange,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'my-files' | 'shared-with-me'>('my-files');
  
  // Filter files based on search term
  const filteredFiles = files.filter(file => 
    file.original_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredSharedFiles = sharedFiles.filter(file => 
    file.original_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Convert FileMetadata to FileItemAdapter using our adapter
  const adaptedFiles = filteredFiles.map(adaptFileMetadataToFileItem);
  
  // Convert SharedFile to FileItemAdapter using our adapter
  const adaptedSharedFiles = filteredSharedFiles.map(adaptSharedFileToFileItem);

  return (
    <div className="space-y-4">
      <SearchBar value={searchTerm} onChange={onSearchChange} />
      
      <Tabs 
        defaultValue="my-files" 
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'my-files' | 'shared-with-me')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-files">My Files</TabsTrigger>
          <TabsTrigger value="shared-with-me">Shared with me</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-files" className="mt-6">
          <FileList 
            files={adaptedFiles}
            isLoading={isLoading}
            onDeleteComplete={onRefresh}
            emptyMessage="No files found. Upload your first encrypted file."
          />
        </TabsContent>
        
        <TabsContent value="shared-with-me" className="mt-6">
          <FileList 
            files={adaptedSharedFiles}
            isLoading={isLoading}
            onDeleteComplete={onRefresh}
            emptyMessage="No files have been shared with you yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FilesSection;
