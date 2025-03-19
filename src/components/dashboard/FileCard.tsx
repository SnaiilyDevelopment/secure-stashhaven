
import React from 'react';
import { Download, MoreHorizontal, Trash2, Lock, File, ImageIcon, FileText, FileArchive } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  encryptedType: string;
  dateAdded: string;
  encrypted: boolean;
}

interface FileCardProps {
  file: FileItem;
  onDownload: (fileId: string) => void;
  onDelete: (fileId: string) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onDownload, onDelete }) => {
  // Get appropriate icon for file type
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('image/')) return <ImageIcon className="h-8 w-8 text-green-500" />;
    if (fileType.includes('application/pdf')) return <FileText className="h-8 w-8 text-green-600" />;
    if (fileType.includes('application/zip') || fileType.includes('application/x-rar-compressed')) {
      return <FileArchive className="h-8 w-8 text-green-700" />;
    }
    return <File className="h-8 w-8 text-green-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <Card className="overflow-hidden group animate-scale-in hover:border-green-300 transition-colors border-green-100 bg-white/70 backdrop-blur-sm shadow-md leaf-shadow">
      <CardContent className="p-0">
        <div className="p-4 flex items-start gap-3">
          <div className="flex-shrink-0 float-animation-slow">
            {getFileTypeIcon(file.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate text-balance text-green-800" title={file.name}>
              {file.name}
            </h3>
            <div className="flex items-center text-xs text-green-700/70 mt-1 gap-2">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{new Date(file.dateAdded).toLocaleDateString()}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-green-700 hover:bg-green-50">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-sm border-green-100">
              <DropdownMenuItem onClick={() => onDownload(file.id)} className="text-green-700 focus:text-green-700 focus:bg-green-50">
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(file.id)}
                className="text-red-500 focus:text-red-500 focus:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
      <CardFooter className="p-2 bg-green-50/80 flex items-center justify-center gap-1 text-xs text-green-700/80">
        <Lock className="h-3 w-3" />
        <span>End-to-end encrypted</span>
      </CardFooter>
    </Card>
  );
};

export default FileCard;
