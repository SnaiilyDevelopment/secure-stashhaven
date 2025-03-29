
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Folder, FolderPlus } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AddContentActionsProps {
  onActionSelect: (action: 'file' | 'folder' | 'new-folder') => void;
}

const AddContentActions: React.FC<AddContentActionsProps> = ({ onActionSelect }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onActionSelect('file')}
        >
          <Upload className="h-4 w-4" />
          <span>Upload File</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onActionSelect('folder')}
        >
          <Folder className="h-4 w-4" />
          <span>Upload Folder</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onActionSelect('new-folder')}
        >
          <FolderPlus className="h-4 w-4" />
          <span>Create Folder</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddContentActions;
