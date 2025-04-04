
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

interface FileCardActionsProps {
  fileId: string;
  isShared?: boolean;
  onDownload?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
  onShare?: (fileId: string) => void;
}

const FileCardActions: React.FC<FileCardActionsProps> = ({
  fileId,
  isShared,
  onDownload,
  onDelete,
  onShare
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-green-700 hover:bg-green-50">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-sm border-green-100">
        {onDownload && (
          <DropdownMenuItem 
            onClick={() => onDownload(fileId)} 
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
        
        {onDelete && (
          <>
            {(onDownload || onShare) && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={() => onDelete(fileId)}
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
