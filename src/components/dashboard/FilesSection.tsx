
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileList from './FileList';
import SearchBar from './SearchBar';
import { FileItemAdapter, adaptFileMetadataToFileItem, adaptSharedFileToFileItem } from '@/lib/adapters/fileAdapter';
import { FileMetadata } from '@/lib/storage';
import { SharedFile } from '@/lib/filesharing';
import { useSearch } from '@/hooks/useSearch';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle } from 'lucide-react';

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
  const { filterBySearchTerm, searchError } = useSearch();
  const [filterError, setFilterError] = useState<Error | null>(null);
  
  // Show toast for search errors
  useEffect(() => {
    if (searchError) {
      toast({
        title: "Search error",
        description: searchError.message,
        variant: "destructive"
      });
    }
  }, [searchError]);
  
  // Safe filtering with error handling
  const safeFilter = <T extends object>(
    items: T[] | undefined | null,
    searchValue: string,
    accessor: (item: T) => string
  ): T[] => {
    try {
      if (!items || !Array.isArray(items)) return [];
      
      return filterBySearchTerm(items, searchValue, accessor);
    } catch (error) {
      console.error("Error filtering items:", error);
      setFilterError(error instanceof Error ? error : new Error("Error filtering items"));
      return [];
    }
  };
  
  // Filter files based on search term, using original_name property
  const filteredFiles = safeFilter(
    files, 
    searchTerm, 
    (file) => file.original_name
  );
  
  // Filter shared files based on search term, using original_name property
  const filteredSharedFiles = safeFilter(
    sharedFiles, 
    searchTerm, 
    (file) => file.original_name
  );

  // Convert FileMetadata to FileItemAdapter using our adapter with error handling
  const adaptedFiles = filteredFiles.map(file => {
    try {
      return adaptFileMetadataToFileItem(file);
    } catch (error) {
      console.error("Error adapting file metadata:", file, error);
      return null;
    }
  }).filter(Boolean) as FileItemAdapter[];
  
  // Convert SharedFile to FileItemAdapter using our adapter with error handling
  const adaptedSharedFiles = filteredSharedFiles.map(file => {
    try {
      return adaptSharedFileToFileItem(file);
    } catch (error) {
      console.error("Error adapting shared file:", file, error);
      return null;
    }
  }).filter(Boolean) as FileItemAdapter[];

  // If there's a filter error, show an error message
  if (filterError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-destructive/10 rounded-lg">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <h3 className="text-lg font-medium text-destructive">Error displaying files</h3>
        <p className="text-sm text-muted-foreground mt-2">{filterError.message}</p>
        <button 
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          onClick={() => {
            setFilterError(null);
            onRefresh();
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

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
