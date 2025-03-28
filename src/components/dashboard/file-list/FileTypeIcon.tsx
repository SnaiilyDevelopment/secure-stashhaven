
import React from 'react';
import { FileIcon, FileText, Image, FileArchive } from 'lucide-react';

interface FileTypeIconProps {
  fileType: string;
}

const FileTypeIcon: React.FC<FileTypeIconProps> = ({ fileType }) => {
  if (fileType.includes('image/')) {
    return <Image className="h-4 w-4 text-green-500" />;
  }
  
  if (fileType.includes('application/pdf') || fileType.includes('text/')) {
    return <FileText className="h-4 w-4 text-green-600" />;
  }
  
  if (fileType.includes('application/zip') || fileType.includes('application/x-rar-compressed')) {
    return <FileArchive className="h-4 w-4 text-green-700" />;
  }
  
  return <FileIcon className="h-4 w-4 text-green-500" />;
};

export default FileTypeIcon;
