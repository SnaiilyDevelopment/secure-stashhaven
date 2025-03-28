
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ThreeDLayout from '@/components/layout/3DLayout';
import { isAuthenticated } from '@/lib/auth';
import FileList from '@/components/dashboard/FileList';
import FileListHeader from '@/components/dashboard/FileListHeader';
import StorageUsageDisplay from '@/components/dashboard/StorageUsageDisplay';
import { listFiles, downloadEncryptedFile, deleteFile } from '@/lib/storage/fileOperations';
import { getUserStorageUsage } from '@/lib/storage/storageUtils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Dashboard = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [storageUsage, setStorageUsage] = useState({ totalSize: 0, fileCount: 0, limit: 0 });
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await isAuthenticated();
        if (!authStatus.authenticated) {
          if (authStatus.error) {
            console.error("Auth error:", authStatus.error, authStatus.errorMessage);
            setAuthError(authStatus.errorMessage || "Authentication failed. Please log in again.");
          }
          navigate('/login');
        } else {
          setAuthError(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setAuthError("Authentication check failed. You can try refreshing the page.");
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Load files and storage usage
  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching files and storage usage...");
      
      // Get files with retry mechanism
      let fileData = [];
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          fileData = await listFiles();
          console.log("Files fetched:", fileData);
          break; // Exit loop if successful
        } catch (error) {
          console.error(`Error fetching files (attempt ${retries + 1}/${maxRetries + 1}):`, error);
          retries++;
          
          if (retries <= maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          } else {
            toast({
              title: "Error",
              description: "Failed to load your files. Please try refreshing.",
              variant: "destructive"
            });
          }
        }
      }
      
      setFiles(fileData);
      
      // Get storage usage
      try {
        const usage = await getUserStorageUsage();
        setStorageUsage({
          totalSize: usage.totalSize,
          fileCount: usage.fileCount,
          limit: usage.limit
        });
      } catch (error) {
        console.error('Error loading storage usage:', error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load your files and storage information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data on initial render
  useEffect(() => {
    loadData();
  }, []);
  
  // Handle file download
  const handleDownloadFile = async (filePath: string, fileName: string, fileType: string) => {
    try {
      const decryptedBlob = await downloadEncryptedFile(filePath, fileName, fileType);
      
      if (decryptedBlob) {
        // Create a URL for the blob
        const url = URL.createObjectURL(decryptedBlob);
        
        // Create a link element
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        
        // Click the link to trigger the download
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };
  
  // Handle file deletion
  const handleDeleteFile = async (filePath: string) => {
    try {
      const success = await deleteFile(filePath);
      if (success) {
        // Reload data after deletion
        loadData();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };
  
  // Filter files based on search query
  const filteredFiles = searchQuery
    ? files.filter(file => 
        file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;

  const handleRetry = () => {
    setAuthError(null);
    loadData();
  };

  return (
    <ThreeDLayout>
      <div className="container py-8 animate-fade-in">
        <header className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight text-green-800">My Secure Vault</h1>
          <p className="text-green-700/80 mt-1">
            All files are end-to-end encrypted
          </p>
        </header>

        {authError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{authError}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <FileListHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onRefresh={loadData}
              isLoading={isLoading}
            />
            <FileList 
              files={filteredFiles.map(file => ({
                id: file.id,
                name: file.original_name,
                size: file.size,
                type: file.original_type,
                dateAdded: file.created_at,
                encrypted: file.encrypted,
                filePath: file.file_path
              }))}
              isLoading={isLoading}
              onDownload={(id, filePath, name, type) => 
                handleDownloadFile(filePath, name, type)
              }
              onDelete={(id, filePath) => 
                handleDeleteFile(filePath)
              }
              onDeleteComplete={loadData}
              emptyMessage="No files found. Upload your first encrypted file."
            />
          </div>
          
          <div>
            <StorageUsageDisplay
              used={storageUsage.totalSize}
              limit={storageUsage.limit}
              fileCount={storageUsage.fileCount}
            />
          </div>
        </div>
      </div>
    </ThreeDLayout>
  );
};

export default Dashboard;
