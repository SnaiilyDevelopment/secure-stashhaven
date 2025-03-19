
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Shield, 
  KeyRound, 
  AlertTriangle, 
  Loader2, 
  CheckCircle,
  Copy,
  EyeOff
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
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { isAuthenticated, getCurrentUserEncryptionKey } from '@/lib/auth';
import { generateSecurePassword } from '@/lib/encryption';

const Profile = () => {
  const [userEmail, setUserEmail] = useState<string>('');
  const [recoveryKey, setRecoveryKey] = useState<string>('');
  const [isGeneratingKey, setIsGeneratingKey] = useState<boolean>(false);
  const [showRecoveryKey, setShowRecoveryKey] = useState<boolean>(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    // Get user email
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) return;
      
      const userId = atob(authToken);
      const users = JSON.parse(localStorage.getItem('secure_vault_users') || '[]');
      const user = users.find((u: any) => u.id === userId);
      
      if (user) {
        setUserEmail(user.email);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [navigate]);
  
  const generateRecoveryKey = async () => {
    setIsGeneratingKey(true);
    
    try {
      // In a real app, we would generate a recovery key that can be used to recover the account
      // For this demo, we'll just generate a secure password
      const key = generateSecurePassword(24);
      setRecoveryKey(key);
      setShowRecoveryKey(true);
      
      // In a real app, we would store this recovery key (encrypted) on the server
      
      toast({
        title: "Recovery key generated",
        description: "Please save this key in a secure location. It can be used to recover your account if you lose your password.",
      });
    } catch (error) {
      console.error('Error generating recovery key:', error);
      toast({
        title: "Failed to generate recovery key",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingKey(false);
    }
  };
  
  const copyRecoveryKey = () => {
    navigator.clipboard.writeText(recoveryKey);
    toast({
      title: "Recovery key copied",
      description: "The recovery key has been copied to your clipboard.",
    });
  };
  
  const calculateStorageUsed = () => {
    try {
      const files = JSON.parse(localStorage.getItem('encrypted_files') || '[]');
      const totalBytes = files.reduce((total: number, file: any) => total + file.size, 0);
      
      return formatFileSize(totalBytes);
    } catch (error) {
      console.error('Error calculating storage used:', error);
      return '0 B';
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };
  
  const getFileCount = () => {
    try {
      const files = JSON.parse(localStorage.getItem('encrypted_files') || '[]');
      return files.length;
    } catch (error) {
      console.error('Error getting file count:', error);
      return 0;
    }
  };

  return (
    <MainLayout>
      <div className="container py-8 max-w-4xl mx-auto animate-fade-in">
        <header className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and security
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your basic account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{userEmail}</h3>
                    <p className="text-muted-foreground text-sm">Joined {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="border rounded-lg divide-y">
                  <div className="flex justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Email Address</h4>
                        <p className="text-sm text-muted-foreground">Your primary email</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p>{userEmail}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between p-4">
                    <div className="flex items-center gap-3">
                      <KeyRound className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Password</h4>
                        <p className="text-sm text-muted-foreground">Your secure password</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p>••••••••••</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security & Recovery</CardTitle>
                <CardDescription>
                  Protect your account and encrypted data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-300">Important Security Information</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                        Your files are protected with end-to-end encryption. If you lose your password, 
                        you may not be able to recover your data without a recovery key.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Recovery Key</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Generate a recovery key to regain access to your encrypted files if you lose your password.
                        Keep this key in a safe place.
                      </p>
                    </div>
                  </div>
                  
                  {recoveryKey ? (
                    <div className="mt-4">
                      <div className="relative">
                        <div className="p-3 rounded bg-muted font-mono text-sm break-all">
                          {showRecoveryKey ? recoveryKey : '•'.repeat(24)}
                        </div>
                        <div className="absolute right-2 top-2 flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setShowRecoveryKey(!showRecoveryKey)}
                            className="h-8 w-8"
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={copyRecoveryKey}
                            className="h-8 w-8"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Recovery key generated. Save this in a secure location.
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={generateRecoveryKey}
                      disabled={isGeneratingKey}
                      className="mt-2"
                    >
                      {isGeneratingKey ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          Generate Recovery Key
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Storage Statistics</CardTitle>
                <CardDescription>
                  Your secure storage usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Storage Used</h4>
                    <p className="text-2xl font-medium">{calculateStorageUsed()}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Encrypted Files</h4>
                    <p className="text-2xl font-medium">{getFileCount()}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Encryption Status</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <p className="text-sm">Active and Secured</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
