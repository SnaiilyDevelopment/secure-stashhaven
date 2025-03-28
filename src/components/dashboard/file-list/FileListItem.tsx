
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Lock } from 'lucide-react';
import { formatBytes } from '@/lib/storage/storageUtils';
import { FileItem } from '../FileList';
import FileTypeIcon from './FileTypeIcon';

interface FileListItemProps {
  file: FileItem;
  onDownload?: (id: string, filePath: string, name: string, type: string) => void;
  onDelete?: (id: string, filePath: string) => void;
  onDeleteComplete?: () => void;
}

const FileListItem: React.FC<FileListItemProps> = ({ 
  file, 
  onDownload, 
  onDelete,
  onDeleteComplete
}) => {
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${file.name}?`)) {
      onDelete?.(file.id, file.filePath);
      onDeleteComplete?.();
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
      <TableCell>{new Date(file.dateAdded).toLocaleDateString()}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {onDownload && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDownload(file.id, file.filePath, file.name, file.type)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          )}
          
          {onDelete && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleDelete}
              className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default FileListItem;
