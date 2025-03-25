
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Lock, Key, Shield, Download, Trash2 } from 'lucide-react';
import ThreeDLayout from '@/components/layout/3DLayout';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getUserStorageUsage, formatBytes } from '@/lib/storage';
import { toast } from '@/components/ui/use-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const [storageUsage, setStorageUsage] = React.useState<number>(0);
  
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Get storage usage
    getUserStorageUsage()
      .then(bytes => {
        setStorageUsage(bytes);
      })
      .catch(err => {
        console.error('Error getting storage usage:', err);
      });
  }, [user, navigate]);
  
  if (!user) {
    return null;
  }
  
  const handleExportKeys = () => {
    toast({
      title: "Feature Coming Soon",
      description: "The ability to export your encryption keys will be available in a future update."
    });
  };
  
  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast({
        title: "Account Deletion",
        description: "Account deletion functionality is not fully implemented yet.",
        variant: "destructive"
      });
    }
  };

  return (
    <ThreeDLayout>
      <div className="container py-8 max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Account
              </CardTitle>
              <CardDescription>
                Manage your account settings and profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Email</Label>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                
                <div>
                  <Label className="text-base">User ID</Label>
                  <p className="text-sm text-muted-foreground">{user.id}</p>
                </div>
                
                <div>
                  <Label className="text-base">Storage Usage</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(storageUsage)} used
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your security settings and encryption keys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-base flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Encryption Keys
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your encryption keys are securely stored locally in your browser.
                    They never leave your device.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={handleExportKeys}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Keys
                  </Button>
                </div>
                
                <Separator />
                
                <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Danger Zone</AlertTitle>
                  <AlertDescription>
                    Deleting your account will permanently remove all your data and files.
                    This action cannot be undone.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Back
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </ThreeDLayout>
  );
};

export default Settings;
