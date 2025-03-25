
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBytes, getUserStorageUsage } from '@/lib/storage';
import MainLayout from '@/components/layout/MainLayout';

const Settings = () => {
  const [storageInfo, setStorageInfo] = useState({ totalSize: 0, fileCount: 0 });
  const [isAutoLockEnabled, setIsAutoLockEnabled] = useState(true);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(false);
  const [isActiveSessionsExpanded, setIsActiveSessionsExpanded] = useState(false);
  
  const handleClearCache = async () => {
    // Placeholder for clear cache functionality
    alert("Cache cleared");
  };
  
  const handleRefreshStorageUsage = async () => {
    try {
      // Get usage information
      const totalSize = await getUserStorageUsage();
      const estimatedFileCount = Math.ceil(totalSize / (2 * 1024 * 1024));
      
      setStorageInfo({
        totalSize: totalSize,
        fileCount: estimatedFileCount
      });
      
      alert("Storage usage refreshed");
    } catch (error) {
      console.error("Failed to refresh storage usage", error);
      alert("Failed to refresh storage usage");
    }
  };
  
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the app looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable dark mode for a low-light interface
                    </p>
                  </div>
                  <Switch 
                    id="dark-mode" 
                    checked={isDarkModeEnabled}
                    onCheckedChange={setIsDarkModeEnabled}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts about security events and file sharing
                    </p>
                  </div>
                  <Switch 
                    id="notifications" 
                    checked={isNotificationsEnabled}
                    onCheckedChange={setIsNotificationsEnabled}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Security</CardTitle>
                <CardDescription>Control how your session is managed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-lock">Auto-Lock</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically lock your vault after 15 minutes of inactivity
                    </p>
                  </div>
                  <Switch 
                    id="auto-lock" 
                    checked={isAutoLockEnabled}
                    onCheckedChange={setIsAutoLockEnabled}
                  />
                </div>
                
                <div>
                  <button
                    className="text-primary hover:underline text-sm font-medium"
                    onClick={() => setIsActiveSessionsExpanded(!isActiveSessionsExpanded)}
                  >
                    {isActiveSessionsExpanded ? "Hide" : "View"} Active Sessions
                  </button>
                  
                  {isActiveSessionsExpanded && (
                    <div className="mt-2 border rounded-md p-3 text-sm">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">Current Session</div>
                          <div className="text-muted-foreground">Chrome on Windows</div>
                        </div>
                        <div className="text-green-500">Active Now</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security</CardDescription>
              </CardHeader>
              <CardContent>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
                  Enable Two-Factor Authentication
                </button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="storage" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Management</CardTitle>
                <CardDescription>Manage your encrypted storage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Storage Used:</span>
                  <span className="font-medium">{formatBytes(storageInfo.totalSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Files Stored:</span>
                  <span className="font-medium">{storageInfo.fileCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage Limit:</span>
                  <span className="font-medium">2 GB (Free Plan)</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm"
                    onClick={handleRefreshStorageUsage}
                  >
                    Refresh Usage
                  </button>
                  <button 
                    className="bg-muted text-muted-foreground px-4 py-2 rounded-md text-sm"
                    onClick={handleClearCache}
                  >
                    Clear Cache
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Management</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
                  Change Password
                </button>
                <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm">
                  Delete Account
                </button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
