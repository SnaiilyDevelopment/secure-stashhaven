
import React from 'react';
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
import { AlertCircle, FileIcon, FileText, Image, FileArchive, Lock, Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/storage/storageUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  dateAdded: string;
  encrypted: boolean;
  filePath: string;
}

interface FileListProps {
  files: FileItem[];
  isLoading: boolean;
  onDownload?: (id: string, filePath: string, name: string, type: string) => void;
  onDelete?: (id: string, filePath: string) => void;
  onDeleteComplete?: () => void;
  emptyMessage?: string;
}

const FileList: React.FC<FileListProps> = ({
  files,
  isLoading,
  onDownload,
  onDelete,
  onDeleteComplete,
  emptyMessage = "No files found"
}) => {
  // Get appropriate icon for file type
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('image/')) return <Image className="h-4 w-4 text-green-500" />;
    if (fileType.includes('application/pdf') || fileType.includes('text/')) {
      return <FileText className="h-4 w-4 text-green-600" />;
    }
    if (fileType.includes('application/zip') || fileType.includes('application/x-rar-compressed')) {
      return <FileArchive className="h-4 w-4 text-green-700" />;
    }
    return <FileIcon className="h-4 w-4 text-green-500" />;
  };

  if (isLoading) {
    return (
      <Card className="border-green-100 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center py-2 gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="border-green-100 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <AlertCircle className="h-10 w-10 text-green-400 mb-3" />
          <h3 className="text-lg font-medium text-green-800">No files found</h3>
          <p className="text-sm text-green-700/70 max-w-md mt-1">
            {emptyMessage}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-100 bg-white/80 backdrop-blur-sm overflow-hidden">
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
                <TableRow key={file.id} className="group">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getFileTypeIcon(file.type)}
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
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${file.name}?`)) {
                              onDelete(file.id, file.filePath);
                              onDeleteComplete?.(); // Call the onDeleteComplete callback after deletion
                            }
                          }}
                          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileList;
