
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Shield, 
  Home, 
  Key
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import ThreeDLayout from '@/components/layout/3DLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ProfileCard = ({ children }: { children: React.ReactNode }) => (
  <Card className="mb-6 overflow-hidden">
    {children}
  </Card>
);

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  const handleNavigate = (path: string) => {
    navigate(path);
  };
  
  const handleDownloadEncryptionKey = () => {
    try {
      const encryptionKey = localStorage.getItem('encryption_key');
      if (!encryptionKey) {
        toast({
          title: "Key not found",
          description: "Your encryption key could not be found. Please log in again.",
          variant: "destructive"
        });
        return;
      }
      
      const keyData = JSON.stringify({
        key: encryptionKey,
        email: user?.email,
        created: new Date().toISOString()
      }, null, 2);
      
      const blob = new Blob([keyData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `secureVault-key-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Key downloaded",
        description: "Keep this file in a safe place. You'll need it to recover your account if you forget your password."
      });
    } catch (error) {
      console.error('Error downloading key:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading your encryption key.",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  return (
    <ThreeDLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">User Profile</h1>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <ProfileCard>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-green-500" />
                  Account Information
                </CardTitle>
                <CardDescription>Your account details and preferences</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Account created</p>
                    <p className="font-medium">{new Date(user.created_at || '').toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last sign in</p>
                    <p className="font-medium">{new Date(user.last_sign_in_at || '').toLocaleDateString()} at {new Date(user.last_sign_in_at || '').toLocaleTimeString()}</p>
                  </div>
                </div>
              </CardContent>
            </ProfileCard>
            
            <ProfileCard>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-green-500" />
                  Security
                </CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <h3 className="text-green-800 font-medium mb-2 flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      End-to-End Encryption Enabled
                    </h3>
                    <p className="text-green-700 text-sm">
                      Your files are protected with end-to-end encryption. Only you can access your files with your encryption key.
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleDownloadEncryptionKey}
                  >
                    Download Encryption Key
                  </Button>
                </div>
              </CardContent>
              
              <CardFooter>
                <p className="text-sm text-gray-500">
                  Keep your encryption key in a safe place. If you lose it, you won't be able to recover your files.
                </p>
              </CardFooter>
            </ProfileCard>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your account</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleNavigate('/dashboard')}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleNavigate('/settings')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => logout()}
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ThreeDLayout>
  );
};

export default Profile;
