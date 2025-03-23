
import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for search functionality with improved error handling
 * @param initialQuery Initial search query value
 * @returns Object containing search state and handlers
 */
export const useSearch = (initialQuery: string = '') => {
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [searchError, setSearchError] = useState<Error | null>(null);

  // Reset error when query changes
  useEffect(() => {
    if (searchError) {
      setSearchError(null);
    }
  }, [searchQuery, searchError]);

  const handleSearchChange = useCallback((query: string) => {
    try {
      setSearchQuery(query);
    } catch (error) {
      console.error("Error updating search query:", error);
      setSearchError(error instanceof Error ? error : new Error("Unknown error occurred"));
    }
  }, []);

  /**
   * Filter items based on search term
   * @param items Array of items to filter
   * @param searchTerm Search term to filter by
   * @param propertyToSearch Property key or function to extract searchable string
   * @returns Filtered array of items
   */
  const filterBySearchTerm = useCallback(<T extends object>(
    items: T[],
    searchTerm: string,
    propertyToSearch: keyof T | ((item: T) => string) = 'name' as keyof T
  ): T[] => {
    try {
      if (!searchTerm) return items;
      if (!items || !Array.isArray(items)) {
        console.warn("Invalid items array passed to filterBySearchTerm:", items);
        return [];
      }
      
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      
      return items.filter(item => {
        try {
          if (typeof propertyToSearch === 'function') {
            const searchableText = propertyToSearch(item);
            return typeof searchableText === 'string' && searchableText.toLowerCase().includes(lowerCaseSearchTerm);
          }
          
          const value = item[propertyToSearch];
          return typeof value === 'string' && value.toLowerCase().includes(lowerCaseSearchTerm);
        } catch (error) {
          console.error("Error filtering item:", item, error);
          return false;
        }
      });
    } catch (error) {
      console.error("Error in filterBySearchTerm:", error);
      setSearchError(error instanceof Error ? error : new Error("Search filtering failed"));
      return [];
    }
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    handleSearchChange,
    filterBySearchTerm,
    searchError
  };
};
