
import React from 'react';
import { FolderPlus, FilePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileCard from './FileCard';
import { FileMetadata, SharedFile } from '@/lib/types';

interface FileListProps {
  files?: FileMetadata[];
  sharedFiles?: SharedFile[];
  searchQuery?: string;
  activeTab?: string;
  isLoading: boolean;
  setActiveTab?: (tab: string) => void;
  handleFileUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  downloadFile?: (fileId: string) => void;
  deleteFile?: (fileId: string) => void;
  onDeleteComplete?: () => void;
  emptyMessage?: string;
}

const FileList: React.FC<FileListProps> = ({
  files = [],
  sharedFiles = [],
  searchQuery = '',
  activeTab = 'all',
  isLoading,
  setActiveTab,
  handleFileUpload,
  downloadFile,
  deleteFile,
  onDeleteComplete,
  emptyMessage = "No files found"
}) => {
  // Adapt file metadata to format expected by FileCard
  const adaptedFiles = files.map(file => ({
    id: file.id,
    name: file.original_name,
    size: file.size,
    type: file.original_type,
    encryptedType: 'application/encrypted',
    dateAdded: file.created_at,
    encrypted: file.encrypted
  }));
  
  // Adapt shared files to format expected by FileCard
  const adaptedSharedFiles = sharedFiles.map(file => ({
    id: file.id,
    name: file.original_name,
    size: file.size,
    type: file.original_type,
    encryptedType: 'application/encrypted',
    dateAdded: file.shared_at,
    encrypted: true,
    isShared: true,
    owner: file.owner_email
  }));
  
  const displayFiles = sharedFiles.length > 0 ? adaptedSharedFiles : adaptedFiles;
  
  // Filter files by search query and type if needed
  const filteredFiles = displayFiles.filter(file => {
    if (!searchQuery) return true;
    return file.name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Sort files by date (newest first)
  const sortedFiles = [...filteredFiles].sort((a, b) => 
    new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
  );

  if (setActiveTab && activeTab) {
    return (
      <>
        <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
          <TabsList className="bg-green-100/80 backdrop-blur-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">All Files</TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Documents</TabsTrigger>
            <TabsTrigger value="images" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Images</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {isLoading && (
          <Card className="mb-4 border-green-200 bg-green-50/70 backdrop-blur-sm animate-pulse-subtle">
            <CardContent className="p-4 flex items-center gap-4">
              <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
              <div>
                <p className="font-medium text-green-800">Loading files...</p>
                <p className="text-sm text-green-700/80">Please wait</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {sortedFiles.length === 0 ? (
          <div className="border border-dashed border-green-200 rounded-lg p-12 text-center bg-white/50 backdrop-blur-sm animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center float-animation">
                <FolderPlus className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="font-medium text-lg mb-2 text-green-800">{emptyMessage}</h3>
            {handleFileUpload && (
              <>
                <p className="text-green-700/80 mb-4 max-w-md mx-auto">
                  Upload your first file to start building your secure encrypted storage.
                </p>
                <label htmlFor="file-upload-empty">
                  <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
                    <FilePlus className="h-4 w-4" />
                    Upload File
                    <input
                      id="file-upload-empty"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                    />
                  </Button>
                </label>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedFiles.map((file) => (
              <FileCard 
                key={file.id} 
                file={file} 
                onDownload={downloadFile} 
                onDelete={deleteFile ? (id) => {
                  deleteFile(id);
                  if (onDeleteComplete) onDeleteComplete();
                } : undefined} 
              />
            ))}
          </div>
        )}
      </>
    );
  }
  
  // Simplified version without tabs for shared files or when setActiveTab is not provided
  return (
    <>
      {isLoading && (
        <Card className="mb-4 border-green-200 bg-green-50/70 backdrop-blur-sm animate-pulse-subtle">
          <CardContent className="p-4 flex items-center gap-4">
            <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
            <div>
              <p className="font-medium text-green-800">Loading files...</p>
              <p className="text-sm text-green-700/80">Please wait</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {sortedFiles.length === 0 ? (
        <div className="border border-dashed border-green-200 rounded-lg p-12 text-center bg-white/50 backdrop-blur-sm animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center float-animation">
              <FolderPlus className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h3 className="font-medium text-lg mb-2 text-green-800">{emptyMessage}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedFiles.map((file) => (
            <FileCard 
              key={file.id} 
              file={file} 
              onDownload={downloadFile} 
              onDelete={deleteFile ? (id) => {
                deleteFile(id);
                if (onDeleteComplete) onDeleteComplete();
              } : undefined} 
            />
          ))}
        </div>
      )}
    </>
  );
};

export default FileList;
