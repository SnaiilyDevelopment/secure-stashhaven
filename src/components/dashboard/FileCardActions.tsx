
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
import { downloadEncryptedFile, deleteFile } from '@/lib/storage';
import { toast } from '@/components/ui/use-toast';
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

  const handleDownload = async () => {
    try {
      const decryptedBlob = await downloadEncryptedFile(filePath, fileType, fileName);
      
      if (decryptedBlob) {
        // Create a URL for the blob
        const url = URL.createObjectURL(decryptedBlob);
        
        // Create a link element
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        
        // Click the link to trigger the download
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download complete",
          description: `${fileName} has been decrypted and downloaded.`
        });
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download or decrypt the file.",
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
      const success = await deleteFile(filePath);
      if (success) {
        onDelete();
      }
    }
  };

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
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
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
