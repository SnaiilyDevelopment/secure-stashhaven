
import React from 'react';

export const useFileDragHandlers = (
  isDropTarget: boolean = false,
  onDrop?: () => void
) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!isDropTarget) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, [isDropTarget]);

  const handleDragLeave = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!isDropTarget) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, [isDropTarget]);

  const handleDrop = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!isDropTarget) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && onDrop) {
      onDrop();
    }
  }, [isDropTarget, onDrop]);

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};
