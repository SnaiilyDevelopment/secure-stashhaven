
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import ThreeDLayout from '@/components/layout/3DLayout';
import { Progress } from '@/components/ui/progress';
import { Database, Shield, HardDrive, RefreshCw } from 'lucide-react';
import { getUserStorageUsage, formatBytes } from '@/lib/storage/storageUtils';

const Settings = () => {
  const [storageUsage, setStorageUsage] = useState({ totalSize: 0, fileCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // Storage limit in bytes (1GB)
  const storageLimit = 1 * 1024 * 1024 * 1024;
  
  // Calculate storage usage percentage
  const usagePercentage = Math.min(100, (storageUsage.totalSize / storageLimit) * 100);
  
  const fetchStorageUsage = async () => {
    setIsLoading(true);
    try {
      const usage = await getUserStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      console.error("Error fetching storage usage:", error);
      toast({
        title: "Error",
        description: "Failed to load storage usage information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStorageUsage();
  }, []);
  
  return (
    <ThreeDLayout>
      <div className="container py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-green-800">Settings</h1>
            <p className="text-green-700/80 mt-1">Manage your account and preferences</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Storage Usage Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-green-600" />
                  <CardTitle>Storage Usage</CardTitle>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={fetchStorageUsage} 
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <CardDescription>
                Your storage usage information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used: {formatBytes(storageUsage.totalSize)}</span>
                    <span>Total: {formatBytes(storageLimit)}</span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {storageUsage.fileCount} file{storageUsage.fileCount !== 1 ? 's' : ''} stored
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-md">
                  <div className="flex items-start gap-2">
                    <Database className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">Storage Information</h4>
                      <p className="text-sm text-green-700/80 mt-1">
                        All files are encrypted before storage for maximum security.
                        {usagePercentage > 80 && (
                          <span className="block mt-2 text-amber-600 font-medium">
                            Warning: Your storage is almost full. Consider removing some files.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Security Settings Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <CardTitle>Security</CardTitle>
              </div>
              <CardDescription>
                Manage your security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-green-800">Encryption Keys</h3>
                  <p className="text-sm text-green-700/80 mt-1">
                    Your encryption keys are stored locally in your browser. 
                    Clearing browser data will remove these keys and you'll need to log in again.
                  </p>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <Button variant="destructive" className="w-full">
                    Reset Encryption Keys
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Warning: This will make all your previously encrypted files inaccessible.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ThreeDLayout>
  );
};

export default Settings;
