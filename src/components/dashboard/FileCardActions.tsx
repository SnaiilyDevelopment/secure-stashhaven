
import React, { useState } from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, Trash2, MoreVertical, Share2 } from 'lucide-react';
import { handleFileDownload } from './actions/fileDownloadAction';
import { handleFileDelete } from './actions/fileDeleteAction';
import ShareFileDialog from './ShareFileDialog';

interface FileCardActionsProps {
  filePath: string;
  fileName: string;
  fileType: string;
  onDelete: () => void;
}

const FileCardActions: React.FC<FileCardActionsProps> = ({
  filePath,
  fileName,
  fileType,
  onDelete
}) => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleFileDownload(filePath, fileName, fileType)}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => handleFileDelete(filePath, fileName, onDelete)} 
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ShareFileDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        filePath={filePath}
        fileName={fileName}
      />
    </>
  );
};

export default FileCardActions;
