
import React from 'react';
import { Lock, File, ImageIcon, FileText, FileArchive } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import FileCardActions from './FileCardActions';
import { formatBytes } from '@/lib/storage';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  encryptedType?: string;
  dateAdded: string;
  encrypted: boolean;
  isShared?: boolean;
  owner?: string;
}

interface FileCardProps {
  file: FileItem;
  onDownload?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
  onShare?: (fileId: string) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onDownload, onDelete, onShare }) => {
  // Get appropriate icon for file type
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('image/')) return <ImageIcon className="h-8 w-8 text-green-500" />;
    if (fileType.includes('application/pdf')) return <FileText className="h-8 w-8 text-green-600" />;
    if (fileType.includes('application/zip') || fileType.includes('application/x-rar-compressed')) {
      return <FileArchive className="h-8 w-8 text-green-700" />;
    }
    return <File className="h-8 w-8 text-green-500" />;
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
              <span>{formatBytes(file.size)}</span>
              <span>•</span>
              <span>{new Date(file.dateAdded).toLocaleDateString()}</span>
              {file.isShared && file.owner && (
                <>
                  <span>•</span>
                  <span>From: {file.owner}</span>
                </>
              )}
            </div>
          </div>
          <FileCardActions 
            fileId={file.id}
            isShared={file.isShared}
            onDownload={onDownload}
            onDelete={onDelete}
            onShare={onShare}
          />
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
