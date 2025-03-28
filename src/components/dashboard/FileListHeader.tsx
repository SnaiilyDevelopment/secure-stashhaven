
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, FolderPlus, Upload } from 'lucide-react';
import SearchBar from './SearchBar';
import UploadDialog from './UploadDialog';

interface FileListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  currentFolder: string | null;
}

const FileListHeader: React.FC<FileListHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
  currentFolder
}) => {
  const [showUploadDialog, setShowUploadDialog] = React.useState(false);
  
  return (
    <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="w-full md:w-2/3">
        <SearchBar 
          value={searchQuery} 
          onChange={onSearchChange} 
        />
      </div>
      
      <div className="w-full md:w-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh files"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        
        <Button
          variant="secondary"
          onClick={() => setShowUploadDialog(true)}
          className="ml-auto"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>
      
      <UploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUploadComplete={onRefresh}
      />
    </div>
  );
};

export default FileListHeader;
