
import React from 'react';
import SearchBar from '../SearchBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileItem } from '../FileList';

interface FileFilteringProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
}

export const FileFiltering: React.FC<FileFilteringProps> = ({
  searchTerm,
  onSearchChange,
  activeTab,
  onTabChange,
  children
}) => {
  return (
    <div className="space-y-4">
      <SearchBar value={searchTerm} onChange={onSearchChange} />
      
      <Tabs 
        value={activeTab}
        onValueChange={onTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-files">My Files</TabsTrigger>
          <TabsTrigger value="shared-with-me">Shared with me</TabsTrigger>
        </TabsList>
        
        {children}
      </Tabs>
    </div>
  );
};

export default FileFiltering;
