import { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import CardWrapper from '@/components/layout/CardWrapper';
import { useAuth } from '@/hooks/useAuth';
import { listUserFiles } from '@/lib/storage';

interface Stats {
  fileCount: number;
  totalSize: number;
}

const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const Profile = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats>({ fileCount: 0, totalSize: 0 });
  
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const files = await listUserFiles();
        let totalSize = 0;
        files.forEach(file => {
          totalSize += file.size;
        });
        setStats({ fileCount: files.length, totalSize });
      } catch (error) {
        console.error("Error fetching user files:", error);
        toast({
          title: "Error fetching files",
          description: "Failed to retrieve file statistics.",
          variant: "destructive"
        });
      }
    };
    
    fetchFiles();
  }, []);
  
  const handleResetPassword = async () => {
    try {
      if (!user?.email) {
        toast({
          title: "Error",
          description: "No email associated with this account.",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password reset email sent",
        description: `An email has been sent to ${user.email} with instructions to reset your password.`,
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Password reset failed",
        description: error.message || "Failed to send password reset email.",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Account Profile</h1>
        
        <CardWrapper>
          <div className="flex items-start">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-medium">Account Information</h2>
              <p className="text-muted-foreground mt-1">Your personal account details</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <span>{user?.email || 'No email available'}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Created</label>
              <div className="mt-1">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </div>
        </CardWrapper>
        
        <CardWrapper>
          <div className="flex items-start">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
              <File className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-medium">Storage Usage</h2>
              <p className="text-muted-foreground mt-1">Your secure storage statistics</p>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span>Files stored:</span>
              <span className="font-medium">{stats.fileCount}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Total storage used:</span>
              <span className="font-medium">{formatBytes(stats.totalSize)}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, (stats.totalSize / (1024 * 1024 * 100)) * 100)}%` }}
              ></div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {Math.round((stats.totalSize / (1024 * 1024 * 100)) * 100)}% of 100MB used
            </p>
          </div>
        </CardWrapper>
        
        <CardWrapper>
          <div className="flex items-start">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-medium">Security</h2>
              <p className="text-muted-foreground mt-1">Manage your account security</p>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div>
              <Button variant="outline" onClick={handleResetPassword}>
                Reset Password
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                You'll receive an email with instructions to reset your password.
              </p>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm">Your data is end-to-end encrypted</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                All your files are encrypted with a key that only you have access to. 
                Not even we can see your files.
              </p>
            </div>
          </div>
        </CardWrapper>
      </div>
    </MainLayout>
  );
};

export default Profile;
