
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import AuthErrorAlert from '@/components/dashboard/AuthErrorAlert';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { useDashboardData } from '@/hooks/useDashboardData';
import { FileItem } from '@/components/dashboard/FileList';

const Dashboard = () => {
  const { 
    filteredFiles, 
    folders, 
    currentFolder, 
    isLoading, 
    searchQuery, 
    setSearchQuery, 
    loadData, 
    createFolder, 
    selectFolder 
  } = useDashboardData(true);
  
  const { authError, handleRetry, isCheckingAuth } = useAuthCheck();
  
  // Track total storage used
  const [storageUsed, setStorageUsed] = useState<number>(0);
  
  // Update storage used whenever files change
  useEffect(() => {
    if (!isLoading && !isCheckingAuth) {
      // Calculate total storage used
      const totalSize = filteredFiles.reduce((total, file) => {
        return total + (file.size || 0);
      }, 0);
      
      setStorageUsed(totalSize);
    }
  }, [filteredFiles, isLoading, isCheckingAuth]);
  
  if (isCheckingAuth) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 max-w-6xl">
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
              <p className="text-muted-foreground">Verifying credentials...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-6xl">
        <AuthErrorAlert 
          error={authError}
          onRetry={handleRetry}
        />
        
        <DashboardHeader
          storageUsed={storageUsed}
        />
        
        <DashboardContent 
          files={filteredFiles}
          folders={folders}
          currentFolder={currentFolder}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={loadData}
          onFolderCreate={createFolder}
          onFolderSelect={selectFolder}
        />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
