
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  searchQuery?: string; // Add this for backward compatibility
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, searchQuery }) => {
  // Use searchQuery as fallback if provided
  const inputValue = searchQuery !== undefined ? searchQuery : value;
  
  return (
    <div className="relative flex-1 md:w-64">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-green-600/60" />
      </div>
      <Input
        placeholder="Search files..."
        className="pl-10 border-green-200 focus:ring-green-500"
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
