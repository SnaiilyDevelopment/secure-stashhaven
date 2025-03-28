
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder } from 'lucide-react';

interface FolderSelectorProps {
  folders: string[];
  selectedFolder: string | null;
  onFolderChange: (folder: string | null) => void;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
  folders,
  selectedFolder,
  onFolderChange
}) => {
  return (
    <div className="mb-4">
      <Label htmlFor="folder-select" className="text-sm font-medium">
        Select Folder
      </Label>
      <Select 
        value={selectedFolder || "root"} 
        onValueChange={(value) => onFolderChange(value === "root" ? null : value)}
      >
        <SelectTrigger id="folder-select" className="w-full mt-1">
          <div className="flex items-center">
            <Folder className="h-4 w-4 mr-2 text-green-600" />
            <SelectValue placeholder="Select a folder" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="root">
            <div className="flex items-center">
              <Folder className="h-4 w-4 mr-2 text-green-600" />
              <span>Root (No folder)</span>
            </div>
          </SelectItem>
          {folders.map((folder) => (
            <SelectItem key={folder} value={folder}>
              <div className="flex items-center">
                <Folder className="h-4 w-4 mr-2 text-green-600" />
                <span>{folder}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FolderSelector;
