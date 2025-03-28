
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilePlus, RefreshCw } from 'lucide-react';
import SearchBar from './SearchBar';
import UploadDialog from './UploadDialog';

interface FileListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const FileListHeader: React.FC<FileListHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading
}) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <SearchBar value={searchQuery} onChange={onSearchChange} />
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
        
        <Button 
          className="gap-2 bg-green-600 hover:bg-green-700"
          onClick={() => setIsUploadDialogOpen(true)}
        >
          <FilePlus className="h-4 w-4" />
          Upload File
        </Button>
      </div>
      
      <UploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUploadComplete={onRefresh}
      />
    </div>
  );
};

export default FileListHeader;
