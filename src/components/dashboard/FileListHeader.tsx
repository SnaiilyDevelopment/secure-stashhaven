
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, FolderOpen, Folder } from 'lucide-react';
import SearchBar from './SearchBar';

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
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
      <div className="flex items-center">
        {currentFolder ? (
          <Folder className="h-5 w-5 text-green-600 mr-2" />
        ) : (
          <FolderOpen className="h-5 w-5 text-green-600 mr-2" />
        )}
        <h2 className="text-xl font-medium text-green-800">
          {currentFolder ? `Folder: ${currentFolder}` : 'All Files'}
        </h2>
      </div>
      
      <div className="flex w-full sm:w-auto gap-2">
        <SearchBar 
          value={searchQuery} 
          onChange={onSearchChange}
          placeholder="Search files..."
          className="w-full sm:w-64"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>
    </div>
  );
};

export default FileListHeader;
