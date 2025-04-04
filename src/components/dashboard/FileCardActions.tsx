
import React from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, Trash2, MoreHorizontal, Share } from 'lucide-react';
import { handleFileDownload } from './actions/fileDownloadAction';
import { handleFileDelete } from './actions/fileDeleteAction';

interface FileCardActionsProps {
  fileId: string;
  filePath?: string;
  fileName?: string;
  fileType?: string;
  isShared?: boolean;
  onDownload?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
  onShare?: (fileId: string) => void;
  onDeleteComplete?: () => void;
}

const FileCardActions: React.FC<FileCardActionsProps> = ({
  fileId,
  filePath,
  fileName,
  fileType,
  isShared,
  onDownload,
  onDelete,
  onShare,
  onDeleteComplete
}) => {
  const handleDownloadClick = async () => {
    if (onDownload) {
      onDownload(fileId);
    } else if (filePath && fileName && fileType) {
      await handleFileDownload(filePath, fileName, fileType);
    }
  };

  const handleDeleteClick = async () => {
    if (onDelete) {
      onDelete(fileId);
    } else if (filePath && fileName) {
      const success = await handleFileDelete(filePath, fileName);
      if (success && onDeleteComplete) {
        onDeleteComplete();
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-green-700 hover:bg-green-50">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-sm border-green-100">
        {(onDownload || (filePath && fileName && fileType)) && (
          <DropdownMenuItem 
            onClick={handleDownloadClick}
            className="text-green-700 focus:text-green-700 focus:bg-green-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </DropdownMenuItem>
        )}
        
        {onShare && !isShared && (
          <DropdownMenuItem 
            onClick={() => onShare(fileId)}
            className="text-green-700 focus:text-green-700 focus:bg-green-50"
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
        )}
        
        {(onDelete || (filePath && fileName)) && (
          <>
            {(onDownload || onShare) && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={handleDeleteClick}
              className="text-red-500 focus:text-red-500 focus:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FileCardActions;
