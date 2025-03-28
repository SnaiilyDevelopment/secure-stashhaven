
import React from 'react';
import { FileIcon, FileText } from 'lucide-react';
import { formatBytes } from '@/lib/storage/storageUtils';

interface FilePreviewProps {
  file: File;
  isValid: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({ 
  file,
  isValid
}) => {
  const getFileIcon = () => {
    if (file.type.includes('image/')) {
      return <FileIcon className="h-6 w-6 text-blue-500" />;
    } else if (file.type.includes('application/pdf') || 
               file.type.includes('text/')) {
      return <FileText className="h-6 w-6 text-green-500" />;
    } else {
      return <FileIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  if (!isValid) return null;

  return (
    <div className="flex items-center gap-2 text-sm p-3 bg-green-50 rounded-md text-green-700">
      {getFileIcon()}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{file.name}</div>
        <div className="text-xs">{formatBytes(file.size)}</div>
      </div>
    </div>
  );
};

export default FilePreview;
