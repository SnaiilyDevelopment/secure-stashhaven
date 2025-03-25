
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Key } from 'lucide-react';
import ThreeDLayout from '@/components/layout/3DLayout';
import { useAuth } from '@/hooks/useAuth';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  
  if (!user) {
    // Redirect to login if no user
    navigate('/login');
    return null;
  }

  return (
    <ThreeDLayout>
      <div className="container py-8 max-w-2xl mx-auto animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center bg-primary/10 w-20 h-20 rounded-full mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{user.email}</h1>
          <p className="text-muted-foreground">User ID: {user.id.substring(0, 8)}...</p>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-base">Email</Label>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              
              <div>
                <Label className="text-base">Account Created</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <Separator />
              
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
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/settings')}>
              Settings
            </Button>
            <Button variant="destructive" onClick={logoutUser}>
              Log Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </ThreeDLayout>
  );
};

export default Profile;
