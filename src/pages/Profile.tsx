
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, FileBox, ArrowUpRight, LogOut } from 'lucide-react';
import ThreeDLayout from '@/components/layout/3DLayout';
import { Separator } from '@/components/ui/separator';
import CardWrapper from '@/components/layout/CardWrapper';
import { useAuth } from '@/hooks/useAuth';
import { getUserStorageUsage, formatBytes } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';

interface StorageStats {
  totalSize: number;
  fileCount: number;
}

const Profile = () => {
  const { user } = useAuth();
  const [storageStats, setStorageStats] = useState<StorageStats>({ totalSize: 0, fileCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch storage usage stats
  useEffect(() => {
    const fetchStorageStats = async () => {
      try {
        setIsLoading(true);
        
        // Get total storage usage
        const totalBytes = await getUserStorageUsage();
        
        // Get file count
        const { count } = await supabase
          .from('file_metadata')
          .select('*', { count: 'exact', head: true });
        
        setStorageStats({
          totalSize: totalBytes,
          fileCount: count || 0
        });
      } catch (error) {
        console.error("Error fetching storage stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchStorageStats();
    }
  }, [user]);
  
  // Check if account is free or premium
  const accountType = "Free";
  const storageLimit = 1024 * 1024 * 500; // 500MB for free accounts
  const storagePercentage = Math.min(100, (storageStats.totalSize / storageLimit) * 100);
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Not Signed In</CardTitle>
            <CardDescription>Please sign in to view your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ThreeDLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile sidebar */}
          <div className="md:col-span-1">
            <CardWrapper>
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} />
                  <AvatarFallback>{user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{user.email}</h2>
                <p className="text-sm text-gray-500 mt-1">{accountType} Account</p>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">User ID</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{user.id.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Account Created</span>
                  <span className="text-sm">{new Date(user.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/settings">
                    Account Settings
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardWrapper>
          </div>
          
          {/* Main content area */}
          <div className="md:col-span-2 space-y-6">
            {/* Storage usage card */}
            <CardWrapper>
              <div className="flex items-center mb-4">
                <FileBox className="h-5 w-5 mr-2 text-green-600" />
                <h2 className="text-lg font-medium">Storage Usage</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Used storage</span>
                  <span className="font-medium">{formatBytes(storageStats.totalSize)}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${storagePercentage}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{formatBytes(storageStats.totalSize)} of {formatBytes(storageLimit)} used</span>
                  <span>{storagePercentage.toFixed(1)}%</span>
                </div>
                
                <div className="pt-2 pb-1">
                  <div className="flex justify-between items-center">
                    <span>Total files</span>
                    <span className="font-medium">{storageStats.fileCount}</span>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard">Manage Files</Link>
                </Button>
              </div>
            </CardWrapper>
            
            {/* Security card */}
            <CardWrapper>
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                <h2 className="text-lg font-medium">Security Settings</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">End-to-end encryption</h3>
                    <p className="text-sm text-gray-600">Your data is secured with end-to-end encryption</p>
                  </div>
                  <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Enabled</div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Key rotation</h3>
                    <p className="text-sm text-gray-600">Change your encryption keys periodically</p>
                  </div>
                  <Button size="sm" variant="outline">Rotate Key</Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Recovery Keys</h3>
                    <p className="text-sm text-gray-600">Back up your encryption keys for recovery</p>
                  </div>
                  <Button size="sm" variant="outline">Generate</Button>
                </div>
              </div>
            </CardWrapper>
          </div>
        </div>
      </div>
    </ThreeDLayout>
  );
};

export default Profile;
