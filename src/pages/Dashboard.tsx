
import React from 'react';
import ThreeDLayout from '@/components/layout/3DLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardContent from '@/components/dashboard/DashboardContent';
import AuthErrorAlert from '@/components/dashboard/AuthErrorAlert';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useDashboardData } from '@/hooks/useDashboardData';

const Dashboard = () => {
  const { authError, handleRetry } = useAuthCheck();
  const { 
    filteredFiles, 
    isLoading, 
    storageUsage, 
    searchQuery, 
    setSearchQuery, 
    loadData 
  } = useDashboardData();
  
  const handleRetryWithRefresh = () => {
    handleRetry();
    loadData();
  };

  return (
    <ThreeDLayout>
      <div className="container py-8 animate-fade-in">
        <DashboardHeader 
          title="My Secure Vault"
          subtitle="All files are end-to-end encrypted"
        />

        <AuthErrorAlert 
          error={authError} 
          onRetry={handleRetryWithRefresh} 
        />
        
        <DashboardContent 
          files={filteredFiles}
          isLoading={isLoading}
          storageUsage={storageUsage}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={loadData}
        />
      </div>
    </ThreeDLayout>
  );
};

export default Dashboard;
