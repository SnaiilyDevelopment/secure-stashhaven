
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Lock, Share2 } from 'lucide-react';
import { formatBytes } from '@/lib/storage/storageUtils';
import { FileItem } from '../FileList';
import FileTypeIcon from './FileTypeIcon';
import { handleFileDownload } from '../actions/fileDownloadAction';
import { handleFileDelete } from '../actions/fileDeleteAction';

interface FileListItemProps {
  file: FileItem;
  onDownload?: (id: string, filePath: string, name: string, type: string) => void;
  onDelete?: (id: string, filePath: string) => void;
  onDeleteComplete?: () => void;
  onShare?: (id: string) => void;
}

const FileListItem: React.FC<FileListItemProps> = ({ 
  file, 
  onDownload, 
  onDelete,
  onDeleteComplete,
  onShare
}) => {
  const handleDownloadClick = async () => {
    if (onDownload) {
      onDownload(file.id, file.filePath, file.name, file.type);
    } else {
      await handleFileDownload(file.filePath, file.name, file.type);
    }
  };

  const handleDeleteClick = async () => {
    if (confirm(`Are you sure you want to delete ${file.name}?`)) {
      if (onDelete) {
        onDelete(file.id, file.filePath);
      } else {
        const success = await handleFileDelete(file.filePath, file.name);
        if (success && onDeleteComplete) {
          onDeleteComplete();
        }
      }
    }
  };

  // Format date properly
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Unknown date";
      }
      return date.toLocaleDateString();
    } catch (e) {
      console.error("Invalid date:", dateString, e);
      return "Unknown date";
    }
  };

  return (
    <TableRow key={file.id} className="group">
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <FileTypeIcon fileType={file.type} />
          <span className="truncate max-w-[200px]">{file.name}</span>
          {file.encrypted && (
            <Lock className="h-3 w-3 text-green-600" />
          )}
        </div>
      </TableCell>
      <TableCell>{formatBytes(file.size)}</TableCell>
      <TableCell>{formatDate(file.dateAdded)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleDownloadClick}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
          
          {onShare && !file.isShared && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onShare(file.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Share</span>
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleDeleteClick}
            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default FileListItem;
