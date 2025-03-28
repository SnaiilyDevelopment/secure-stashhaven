
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, Plus, ChevronRight, FolderOpen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface FolderManagerProps {
  folders: string[];
  currentFolder: string | null;
  onFolderCreate: (folderName: string) => void;
  onFolderSelect: (folder: string | null) => void;
}

const FolderManager: React.FC<FolderManagerProps> = ({
  folders,
  currentFolder,
  onFolderCreate,
  onFolderSelect,
}) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const { toast } = useToast();

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Folder name required",
        description: "Please enter a name for your new folder",
        variant: "destructive"
      });
      return;
    }
    
    if (folders.includes(newFolderName)) {
      toast({
        title: "Folder already exists",
        description: `A folder named "${newFolderName}" already exists`,
        variant: "destructive"
      });
      return;
    }
    
    onFolderCreate(newFolderName);
    setNewFolderName('');
    setIsCreatingFolder(false);
    
    toast({
      title: "Folder created",
      description: `Folder "${newFolderName}" has been created`
    });
  };

  return (
    <Card className="border-green-100 bg-white/80 backdrop-blur-sm mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Folders</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
            className="h-8 px-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Folder
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isCreatingFolder && (
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="New folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="h-8"
            />
            <Button size="sm" onClick={handleCreateFolder} className="h-8">Create</Button>
          </div>
        )}
        
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
