
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, HardDrive, Key, Users, Download } from 'lucide-react';
import ThreeDLayout from '@/components/layout/3DLayout';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [backupEnabled, setBackupEnabled] = useState(false);
  
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <ThreeDLayout>
      <div className="container max-w-4xl py-8 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Configure your account and preferences</p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
        
        {/* Security Settings Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Enable two-factor authentication for enhanced security
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically log out after 30 minutes of inactivity
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
        
        {/* Storage Settings Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-green-600" />
              Storage Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Automatic File Backup</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically back up your encrypted files
                </p>
              </div>
              <Switch checked={backupEnabled} onChange={() => setBackupEnabled(!backupEnabled)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Cloud Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Sync your encrypted files across devices
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
        
        {/* Account Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Download Encryption Keys</Label>
                <p className="text-sm text-muted-foreground">
                  Download a backup of your encryption keys
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Regenerate Keys</Label>
                <p className="text-sm text-muted-foreground">
                  Create new encryption keys (will re-encrypt all files)
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Key className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button variant="destructive" onClick={logout}>
              Log Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </ThreeDLayout>
  );
};

export default Settings;
