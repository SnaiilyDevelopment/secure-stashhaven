
import React from 'react';
import { FolderPlus, FilePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileCard from './FileCard';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  encryptedType: string;
  dateAdded: string;
  encrypted: boolean;
}

interface FileListProps {
  files: FileItem[];
  searchQuery: string;
  activeTab: string;
  isUploading: boolean;
  setActiveTab: (tab: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  downloadFile: (fileId: string) => void;
  deleteFile: (fileId: string) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  searchQuery,
  activeTab,
  isUploading,
  setActiveTab,
  handleFileUpload,
  downloadFile,
  deleteFile
}) => {
  // Filter files by search query and type
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeTab === 'all' || 
                        (activeTab === 'documents' && file.type.includes('application/')) ||
                        (activeTab === 'images' && file.type.includes('image/'));
    return matchesSearch && matchesType;
  });
  
  // Sort files by date (newest first)
  const sortedFiles = [...filteredFiles].sort((a, b) => 
    new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
  );

  return (
    <>
      <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="bg-green-100/80 backdrop-blur-sm">
          <TabsTrigger value="all" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">All Files</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Documents</TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Images</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {isUploading && (
        <Card className="mb-4 border-green-200 bg-green-50/70 backdrop-blur-sm animate-pulse-subtle">
          <CardContent className="p-4 flex items-center gap-4">
            <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
            <div>
              <p className="font-medium text-green-800">Encrypting and uploading files...</p>
              <p className="text-sm text-green-700/80">This may take a moment depending on file size</p>
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
          <h3 className="font-medium text-lg mb-2 text-green-800">No files yet</h3>
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
                disabled={isUploading}
              />
            </Button>
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedFiles.map((file) => (
            <FileCard 
              key={file.id} 
              file={file} 
              onDownload={downloadFile} 
              onDelete={deleteFile} 
            />
          ))}
        </div>
      )}
    </>
  );
};

export default FileList;
