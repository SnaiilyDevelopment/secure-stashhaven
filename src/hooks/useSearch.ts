
import { useState, useCallback } from 'react';

/**
 * Custom hook for search functionality
 * @param initialQuery Initial search query value
 * @returns Object containing search state and handlers
 */
export const useSearch = (initialQuery: string = '') => {
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filterBySearchTerm = useCallback(<T extends { name: string }>(
    items: T[],
    searchTerm: string
  ): T[] => {
    if (!searchTerm) return items;
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    handleSearchChange,
    filterBySearchTerm
  };
};
