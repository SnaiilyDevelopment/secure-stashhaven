
import React, { useState } from 'react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Loader2, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FileListItem from './file-list/FileListItem';
import EmptyFileList from './file-list/EmptyFileList';
import FileListSkeleton from './file-list/FileListSkeleton';
import { toast } from '@/components/ui/use-toast';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  dateAdded: string;
  encrypted: boolean;
  filePath: string;
  folder?: string;
  isShared?: boolean;
  owner?: string;
}

interface FileListProps {
  files: FileItem[];
  isLoading: boolean;
  onUpload?: () => void;
  onDownload?: (id: string, filePath: string, name: string, type: string) => void;
  onDelete?: (id: string, filePath: string) => void;
  onDeleteComplete?: () => void;
  onShare?: (id: string) => void;
  emptyMessage?: string;
  isDropTarget?: boolean;
}

const FileList: React.FC<FileListProps> = ({
  files,
  isLoading,
  onUpload,
  onDownload,
  onDelete,
  onDeleteComplete,
  onShare,
  emptyMessage = "No files found",
  isDropTarget = false
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!isDropTarget || !onUpload) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Trigger the upload dialog
      onUpload();
    }
  };

  if (isLoading) {
    return <FileListSkeleton />;
  }

  if (files.length === 0) {
    return (
      <div
        onDragOver={isDropTarget ? handleDragOver : undefined}
        onDragLeave={isDropTarget ? handleDragLeave : undefined}
        onDrop={isDropTarget ? handleDrop : undefined}
        className={`transition-all duration-200 ${isDragging ? 'ring-2 ring-green-500 bg-green-50/30' : ''}`}
      >
        <EmptyFileList message={emptyMessage} />
      </div>
    );
  }

  return (
    <div
      onDragOver={isDropTarget ? handleDragOver : undefined}
      onDragLeave={isDropTarget ? handleDragLeave : undefined}
      onDrop={isDropTarget ? handleDrop : undefined}
      className={`transition-all duration-200 ${isDragging ? 'ring-2 ring-green-500 bg-green-50/30' : ''}`}
    >
      <Card className={`border-green-100 bg-white/80 backdrop-blur-sm overflow-hidden ${isDragging ? 'ring-2 ring-green-500' : ''}`}>
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-50/80 backdrop-blur-sm z-10">
            <div className="text-center p-4 rounded-lg">
              <Upload className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium">Drop files to upload</p>
            </div>
          </div>
        )}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <FileListItem 
                    key={file.id}
                    file={file}
                    onDownload={onDownload}
                    onDelete={onDelete}
                    onDeleteComplete={onDeleteComplete}
                    onShare={onShare}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileList;
