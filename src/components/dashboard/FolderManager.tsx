
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Folder, ChevronRight } from 'lucide-react';

interface FolderManagerProps {
  folders: string[];
  currentFolder: string | null;
  onFolderCreate: (folderName: string) => void;
  onFolderSelect: (folder: string | null) => void;
}

const FolderManager: React.FC<FolderManagerProps> = ({
  folders,
  currentFolder,
  onFolderSelect,
}) => {
  return (
    <Card className="border-green-100 bg-white/80 backdrop-blur-sm mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          <span>Storage Locations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div 
            className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-green-50 ${!currentFolder ? 'bg-green-100' : ''}`}
            onClick={() => onFolderSelect(null)}
          >
            <FolderOpen className="h-4 w-4 mr-2 text-green-600" />
            <span className="text-sm">All Files</span>
          </div>
          
          {folders.map((folder) => (
            <div 
              key={folder}
              className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-green-50 ${currentFolder === folder ? 'bg-green-100' : ''}`}
              onClick={() => onFolderSelect(folder)}
            >
              <Folder className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-sm">{folder}</span>
              <ChevronRight className="h-4 w-4 ml-auto text-green-400" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FolderManager;
