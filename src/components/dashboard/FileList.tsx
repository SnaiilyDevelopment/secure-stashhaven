
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
import { AlertCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FileListItem from './file-list/FileListItem';
import EmptyFileList from './file-list/EmptyFileList';
import FileListSkeleton from './file-list/FileListSkeleton';

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
  onDownload?: (id: string, filePath: string, name: string, type: string) => void;
  onDelete?: (id: string, filePath: string) => void;
  onDeleteComplete?: () => void;
  onShare?: (id: string) => void;
  emptyMessage?: string;
}

const FileList: React.FC<FileListProps> = ({
  files,
  isLoading,
  onDownload,
  onDelete,
  onDeleteComplete,
  onShare,
  emptyMessage = "No files found"
}) => {
  if (isLoading) {
    return <FileListSkeleton />;
  }

  if (files.length === 0) {
    return <EmptyFileList message={emptyMessage} />;
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
  );
};

export default FileList;
