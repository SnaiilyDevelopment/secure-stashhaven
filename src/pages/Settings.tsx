
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Monitor, 
  Moon, 
  Sun, 
  Settings as SettingsIcon, 
  Trash2,
  RefreshCw,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { isAuthenticated } from '@/lib/auth';

const Settings = () => {
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [theme, setTheme] = useState('system');
  const navigate = useNavigate();
  
  // Check if authenticated
  React.useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);
  
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    // In a real app, we would apply the theme here
  };
  
  const handleDeleteAccount = () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: "Confirmation failed",
        description: "Please type 'DELETE' to confirm account deletion.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Get the current user ID
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) return;
      
      const userId = atob(authToken);
      
      // Get all users
      const users = JSON.parse(localStorage.getItem('secure_vault_users') || '[]');
      
      // Remove the current user
      const updatedUsers = users.filter((user: any) => user.id !== userId);
      localStorage.setItem('secure_vault_users', JSON.stringify(updatedUsers));
      
      // Clear all user data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('encryption_key');
      localStorage.removeItem('encrypted_files');
      
      // Clear all files
      const fileKeys = Object.keys(localStorage).filter(key => key.startsWith('file_'));
      fileKeys.forEach(key => localStorage.removeItem(key));
      
      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });
      
      // Redirect to register page
      navigate('/register');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting your account.",
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
    }
  };
  
  const clearLocalStorage = () => {
    try {
      // Only clear encrypted files, not account data
      localStorage.removeItem('encrypted_files');
      
      // Clear all files
      const fileKeys = Object.keys(localStorage).filter(key => key.startsWith('file_'));
      fileKeys.forEach(key => localStorage.removeItem(key));
      
      toast({
        title: "Storage cleared",
        description: "All your encrypted files have been removed.",
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error clearing storage:', error);
      toast({
        title: "Clear failed",
        description: "There was an error clearing your storage.",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="container py-8 max-w-4xl mx-auto animate-fade-in">
        <header className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your preferences and account settings
          </p>
        </header>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how SecureVault looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div 
                  className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all ${
                    theme === 'light' ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleThemeChange('light')}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Sun className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Light</span>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all ${
                    theme === 'dark' ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Moon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Dark</span>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all ${
                    theme === 'system' ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleThemeChange('system')}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Monitor className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">System</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Security Preferences</CardTitle>
              <CardDescription>
                Configure your security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-lock">Auto-lock vault</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically lock your vault after 15 minutes of inactivity
                    </p>
                  </div>
                  <Switch id="auto-lock" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="clear-clipboard">Clear clipboard</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically clear clipboard after copying sensitive data
                    </p>
                  </div>
                  <Switch id="clear-clipboard" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics">Usage analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve SecureVault by sharing anonymous usage data
                    </p>
                  </div>
                  <Switch id="analytics" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Manage your encrypted data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-300">Warning</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      These actions will permanently delete your encrypted data and cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={clearLocalStorage}
                >
                  <RefreshCw className="h-4 w-4" />
                  Clear Storage
                </Button>
                
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. All your encrypted files and account information will be permanently deleted.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                        <Shield className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm">
                          To confirm deletion, please type <strong>DELETE</strong> in the field below.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="delete-confirmation">Confirmation</Label>
                        <Input 
                          id="delete-confirmation" 
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="Type DELETE to confirm"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDeleteDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmation !== 'DELETE'}
                      >
                        Delete Account
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
