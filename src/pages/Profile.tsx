
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { getUserStorageUsage, formatBytes } from '@/lib/storage';
import MainLayout from '@/components/layout/MainLayout';

const Profile = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [storageInfo, setStorageInfo] = useState({ totalSize: 0, fileCount: 0 });
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);
  
  useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        setIsLoadingStorage(true);
        
        // Get total storage usage
        const totalSize = await getUserStorageUsage();
        
        // For now, we're using a simple estimation for file count
        // In a real app, this would come from a separate API call
        // that counts the number of files in the database
        const estimatedFileCount = Math.ceil(totalSize / (2 * 1024 * 1024)); // Assume average 2MB per file
        
        setStorageInfo({
          totalSize,
          fileCount: estimatedFileCount
        });
      } catch (error) {
        console.error("Error loading storage info:", error);
      } finally {
        setIsLoadingStorage(false);
      }
    };
    
    if (user) {
      loadStorageInfo();
    }
  }, [user]);
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (!user) {
    return null; // Will redirect in the effect
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your personal account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p>{user.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Account Type</h3>
                <p>Standard</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
                <p>{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage</CardTitle>
              <CardDescription>Your encrypted storage statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Storage Used</h3>
                <p>{isLoadingStorage ? "Calculating..." : formatBytes(storageInfo.totalSize)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Files Stored</h3>
                <p>{isLoadingStorage ? "Calculating..." : storageInfo.fileCount}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Storage Limit</h3>
                <p>2 GB (Free Plan)</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full"
                  style={{ 
                    width: `${Math.min(100, (storageInfo.totalSize / (2 * 1024 * 1024 * 1024)) * 100)}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoadingStorage 
                  ? "Calculating storage usage..." 
                  : `${((storageInfo.totalSize / (2 * 1024 * 1024 * 1024)) * 100).toFixed(1)}% of 2GB used`
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
