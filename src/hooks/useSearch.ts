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

  const filterBySearchTerm = useCallback(<T extends object>(
    items: T[],
    searchTerm: string,
    propertyToSearch: keyof T | ((item: T) => string) = 'name' as keyof T
  ): T[] => {
    if (!searchTerm) return items;
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    return items.filter(item => {
      if (typeof propertyToSearch === 'function') {
        return propertyToSearch(item).toLowerCase().includes(lowerCaseSearchTerm);
      }
      
      const value = item[propertyToSearch];
      return typeof value === 'string' && value.toLowerCase().includes(lowerCaseSearchTerm);
    });
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    handleSearchChange,
    filterBySearchTerm
  };
};
