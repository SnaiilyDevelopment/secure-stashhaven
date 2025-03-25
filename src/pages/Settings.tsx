import { useState } from 'react';
import { Settings as SettingsIcon, Bell, Eye, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import CardWrapper from '@/components/layout/CardWrapper';
import { toast } from '@/components/ui/use-toast';

interface Settings {
  darkMode: boolean;
  animations: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  fileSharingNotifications: boolean;
}

interface PrivacySettings {
  allowAnalytics: boolean;
  sendCrashReports: boolean;
}

interface SecuritySettings {
  autoLogout: boolean;
}

const SettingsPage = () => {
  const [generalSettings, setGeneralSettings] = useState<Settings>({
    darkMode: false,
    animations: true,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    fileSharingNotifications: true,
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    allowAnalytics: true,
    sendCrashReports: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    autoLogout: false,
  });

  const updateSettings = (type: string, newSettings: any) => {
    switch (type) {
      case 'general':
        setGeneralSettings(prev => ({ ...prev, ...newSettings }));
        break;
      case 'notifications':
        setNotificationSettings(prev => ({ ...prev, ...newSettings }));
        break;
      case 'privacy':
        setPrivacySettings(prev => ({ ...prev, ...newSettings }));
        break;
      case 'security':
        setSecuritySettings(prev => ({ ...prev, ...newSettings }));
        break;
      default:
        console.warn('Unknown settings type');
    }

    toast({
      title: "Settings updated",
      description: "Your settings have been successfully updated.",
    });
  };

  const resetAllSettings = () => {
    setGeneralSettings({ darkMode: false, animations: true });
    setNotificationSettings({ emailNotifications: true, fileSharingNotifications: true });
    setPrivacySettings({ allowAnalytics: true, sendCrashReports: true });
    setSecuritySettings({ autoLogout: false });

    toast({
      title: "Settings reset",
      description: "All settings have been reset to their default values.",
    });
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>
        
        <CardWrapper>
          <div className="flex items-start">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-medium">General</h2>
              <p className="text-muted-foreground mt-1">General application settings</p>
            </div>
          </div>
          
          <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable dark mode for the application
                </p>
              </div>
              <Switch 
                id="dark-mode" 
                checked={generalSettings.darkMode} 
                onCheckedChange={(checked) => updateSettings('general', { darkMode: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="animations">Animations</Label>
                <p className="text-sm text-muted-foreground">
                  Enable UI animations
                </p>
              </div>
              <Switch 
                id="animations" 
                checked={generalSettings.animations} 
                onCheckedChange={(checked) => updateSettings('general', { animations: checked })}
              />
            </div>
          </div>
        </CardWrapper>
        
        <CardWrapper>
          <div className="flex items-start">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-medium">Notifications</h2>
              <p className="text-muted-foreground mt-1">Manage notification preferences</p>
            </div>
          </div>
          
          <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications about your account
                </p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={notificationSettings.emailNotifications} 
                onCheckedChange={(checked) => updateSettings('notifications', { emailNotifications: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="file-sharing-notifications">File sharing notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications when files are shared with you
                </p>
              </div>
              <Switch 
                id="file-sharing-notifications" 
                checked={notificationSettings.fileSharingNotifications} 
                onCheckedChange={(checked) => updateSettings('notifications', { fileSharingNotifications: checked })}
              />
            </div>
          </div>
        </CardWrapper>
        
        <CardWrapper>
          <div className="flex items-start">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-medium">Privacy</h2>
              <p className="text-muted-foreground mt-1">Manage your privacy settings</p>
            </div>
          </div>
          
          <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics">Allow analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Help us improve by allowing anonymous usage data collection
                </p>
              </div>
              <Switch 
                id="analytics" 
                checked={privacySettings.allowAnalytics} 
                onCheckedChange={(checked) => updateSettings('privacy', { allowAnalytics: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="crash-reports">Send crash reports</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send crash reports to help fix issues
                </p>
              </div>
              <Switch 
                id="crash-reports" 
                checked={privacySettings.sendCrashReports} 
                onCheckedChange={(checked) => updateSettings('privacy', { sendCrashReports: checked })}
              />
            </div>
          </div>
        </CardWrapper>
        
        <CardWrapper>
          <div className="flex justify-between items-center">
            <div className="flex items-start">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-medium">Security</h2>
                <p className="text-muted-foreground mt-1">Secure your account</p>
              </div>
            </div>
            
            <Button 
              variant="destructive" 
              onClick={resetAllSettings}
            >
              Reset All Settings
            </Button>
          </div>
          
          <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-logout">Auto logout</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically log out after 30 minutes of inactivity
                </p>
              </div>
              <Switch 
                id="auto-logout" 
                checked={securitySettings.autoLogout} 
                onCheckedChange={(checked) => updateSettings('security', { autoLogout: checked })}
              />
            </div>
          </div>
        </CardWrapper>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
