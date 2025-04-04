
import React, { useState, useEffect } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import FileList from './FileList';
import { FileMetadata } from '@/lib/storage';
import { SharedFile } from '@/lib/filesharing';
import { useSearch } from '@/hooks/useSearch';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Upload } from 'lucide-react';
import { FileItem } from './FileList';
import ShareFileDialog from './ShareFileDialog';
import FileFiltering from './file-list/FileFiltering';

interface FilesSectionProps {
  files: FileMetadata[];
  sharedFiles: SharedFile[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onFolderCreate?: (name: string) => void;
  onUploadDialogOpen: () => void;
}

const FilesSection: React.FC<FilesSectionProps> = ({
  files,
  sharedFiles,
  isLoading,
  searchTerm,
  onSearchChange,
  onRefresh,
  onFolderCreate,
  onUploadDialogOpen
}) => {
  const [activeTab, setActiveTab] = useState<'my-files' | 'shared-with-me'>('my-files');
  const { filterBySearchTerm, searchError } = useSearch();
  const [filterError, setFilterError] = useState<Error | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ id: string; name: string; path: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    if (searchError) {
      toast({
        title: "Search error",
        description: searchError.message,
        variant: "destructive"
      });
    }
  }, [searchError]);
  
  // Drag and drop handlers for the entire dashboard
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    onUploadDialogOpen();
  };
  
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
  
  const handleShareFile = (id: string) => {
    const fileToShare = adaptedFiles.find(file => file.id === id);
    if (fileToShare) {
      setSelectedFile({
        id: fileToShare.id,
        name: fileToShare.name,
        path: fileToShare.filePath
      });
      setShareDialogOpen(true);
    }
  };
  
  const filteredFiles = safeFilter(
    files, 
    searchTerm, 
    (file) => file.original_name
  );
  
  const filteredSharedFiles = safeFilter(
    sharedFiles, 
    searchTerm, 
    (file) => file.original_name
  );

  const adaptedFiles = filteredFiles.map(file => {
    try {
      return {
        id: file.id,
        name: file.original_name,
        size: file.size,
        type: file.original_type,
        dateAdded: file.created_at,
        encrypted: file.encrypted,
        filePath: file.file_path,
        folder: file.file_path.includes('/') ? file.file_path.split('/')[0] : undefined,
        isShared: false
      } as FileItem;
    } catch (error) {
      console.error("Error adapting file metadata:", file, error);
      return null;
    }
  }).filter(Boolean) as FileItem[];
  
  const adaptedSharedFiles = filteredSharedFiles.map(file => {
    try {
      return {
        id: file.id,
        name: file.original_name,
        size: file.size,
        type: file.original_type,
        dateAdded: file.shared_at,
        encrypted: true,
        filePath: file.file_path,
        isShared: true,
        owner: file.owner_email
      } as FileItem;
    } catch (error) {
      console.error("Error adapting shared file:", file, error);
      return null;
    }
  }).filter(Boolean) as FileItem[];

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
    <div 
      className={`space-y-4 relative min-h-[400px] rounded-lg transition-all duration-200 ${
        isDragging ? 'ring-2 ring-green-500 bg-green-50/30 before:absolute before:inset-0 before:z-10' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-50/80 backdrop-blur-sm z-20 rounded-lg border-2 border-dashed border-green-500">
          <div className="text-center p-8 rounded-xl">
            <Upload className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-700 mb-2">Drop files to upload</h3>
            <p className="text-green-600">Files will be encrypted and secured in your vault</p>
          </div>
        </div>
      )}

      <FileFiltering
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        activeTab={activeTab}
        onTabChange={(value) => setActiveTab(value as 'my-files' | 'shared-with-me')}
      >
        <TabsContent value="my-files" className="mt-6">
          <FileList 
            files={adaptedFiles}
            isLoading={isLoading}
            onUpload={onUploadDialogOpen}
            onDeleteComplete={onRefresh}
            onShare={handleShareFile}
            emptyMessage="No files found. Upload your first encrypted file."
            isDropTarget={true}
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
      </FileFiltering>
      
      {selectedFile && (
        <ShareFileDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          filePath={selectedFile.path}
          fileName={selectedFile.name}
        />
      )}
    </div>
  );
};

export default FilesSection;
