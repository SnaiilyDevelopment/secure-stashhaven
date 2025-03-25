
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, Bell, Lock, Trash2, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ThreeDLayout from '@/components/layout/3DLayout';
import CardWrapper from '@/components/layout/CardWrapper';
import { useAuth } from '@/hooks/useAuth';
import { getUserStorageUsage, formatBytes } from '@/lib/storage';

interface StorageStats {
  totalSize: number;
  fileCount: number;
}

const Settings = () => {
  const { user, logoutUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [storageStats, setStorageStats] = useState<StorageStats>({ totalSize: 0, fileCount: 0 });
  
  useEffect(() => {
    const fetchStorageStats = async () => {
      try {
        setIsLoading(true);
        const totalBytes = await getUserStorageUsage();
        setStorageStats({
          totalSize: totalBytes,
          fileCount: 0 // Will be updated later
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
  
  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // Code to delete account would go here
      alert("Account deletion functionality will be implemented soon.");
    }
  };
  
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Not Signed In</CardTitle>
            <CardDescription>Please sign in to view your settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/login'}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ThreeDLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-gray-600">Manage your account preferences and security settings</p>
        </div>
        
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
            <CardWrapper>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Account Information</h2>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Email</Label>
                    <div className="font-medium mt-1">{user.email}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Account Type</Label>
                    <div className="font-medium mt-1">Free</div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-500">Storage Used</Label>
                  <div className="font-medium mt-1">
                    {formatBytes(storageStats.totalSize)} of {formatBytes(1024 * 1024 * 500)} (Free Plan)
                  </div>
                </div>
              </div>
            </CardWrapper>
            
            <CardWrapper>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Danger Zone</h2>
              </div>
              
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Deleting your account will permanently remove all your files and data. This action cannot be undone.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4">
                <Button 
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardWrapper>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <CardWrapper>
              <div className="flex items-center mb-4">
                <Lock className="h-5 w-5 mr-2 text-green-600" />
                <h2 className="text-lg font-medium">Security Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">End-to-End Encryption</Label>
                    <p className="text-sm text-gray-600">Your data is always encrypted</p>
                  </div>
                  <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Enabled</div>
                </div>
                
                <div className="pt-2">
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Download Encryption Keys
                  </Button>
                </div>
              </div>
            </CardWrapper>
            
            <CardWrapper>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Change Password</h2>
              </div>
              
              <div className="space-y-4">
                <Button variant="outline" className="w-full">Change Password</Button>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Changing your password will require re-encrypting your data with a new key.
                  </AlertDescription>
                </Alert>
              </div>
            </CardWrapper>
            
            <CardWrapper>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Sessions</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Current Session</Label>
                    <p className="text-sm text-gray-600">Started {new Date().toLocaleDateString()}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>Sign Out</Button>
                </div>
              </div>
            </CardWrapper>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <CardWrapper>
              <div className="flex items-center mb-4">
                <Bell className="h-5 w-5 mr-2 text-green-600" />
                <h2 className="text-lg font-medium">Notification Preferences</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive alerts about security and account activity</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">File Share Notifications</Label>
                    <p className="text-sm text-gray-600">Get notified when files are shared with you</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Marketing Updates</Label>
                    <p className="text-sm text-gray-600">Receive news and special offers</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardWrapper>
          </TabsContent>
        </Tabs>
      </div>
    </ThreeDLayout>
  );
};

export default Settings;
