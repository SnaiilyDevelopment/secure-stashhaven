
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import ThreeDLayout from '@/components/layout/3DLayout';
import { User, Mail, Shield, HardDrive, Database, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getUserStorageUsage, formatBytes } from '@/lib/storage/storageUtils';

interface UserProfile {
  id: string;
  email: string;
  providers: string[];
  created_at: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageUsage, setStorageUsage] = useState({ totalSize: 0, fileCount: 0 });
  
  // Storage limit in bytes (1GB)
  const storageLimit = 1 * 1024 * 1024 * 1024;
  
  // Calculate storage usage percentage
  const usagePercentage = Math.min(100, (storageUsage.totalSize / storageLimit) * 100);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("User not found");
        }
        
        // Get user's storage usage
        const usage = await getUserStorageUsage();
        
        setProfile({
          id: user.id,
          email: user.email || 'No email',
          providers: [user.app_metadata.provider || 'email'],
          created_at: user.created_at || new Date().toISOString(),
        });
        
        setStorageUsage(usage);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile information.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);
  
  if (isLoading) {
    return (
      <ThreeDLayout>
        <div className="container flex items-center justify-center py-24">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-green-100"></div>
            <div className="h-6 w-40 bg-green-100 rounded mt-4"></div>
            <div className="h-4 w-60 bg-green-100 rounded mt-2"></div>
          </div>
        </div>
      </ThreeDLayout>
    );
  }
  
  if (!profile) {
    return (
      <ThreeDLayout>
        <div className="container py-8">
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto text-gray-400" />
                <h2 className="mt-2 text-xl font-medium">Profile Not Available</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please log in to view your profile.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ThreeDLayout>
    );
  }
  
  return (
    <ThreeDLayout>
      <div className="container py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-green-800">My Profile</h1>
            <p className="text-green-700/80 mt-1">Manage your account information</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="" alt={profile.email} />
                  <AvatarFallback className="text-2xl bg-green-100 text-green-800">
                    {profile.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{profile.email}</CardTitle>
              <CardDescription>
                User since {new Date(profile.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-green-600" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Auth Provider: {profile.providers[0]}</span>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Storage Usage Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-green-600" />
                <CardTitle>Storage Usage</CardTitle>
              </div>
              <CardDescription>
                Your storage usage information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{formatBytes(storageUsage.totalSize)} used</span>
                    <span>{formatBytes(storageLimit)} total</span>
                  </div>
                  <Progress value={usagePercentage} className="h-3" />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-6 w-6 text-green-600" />
                      <div>
                        <div className="text-2xl font-semibold">
                          {storageUsage.fileCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Files Stored
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-6 w-6 text-green-600" />
                      <div>
                        <div className="text-2xl font-semibold">
                          {formatBytes(storageLimit - storageUsage.totalSize)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Available Storage
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {usagePercentage > 80 && (
                  <div className="p-4 bg-amber-50 rounded-md border border-amber-200">
                    <p className="text-amber-800">
                      <strong>Note:</strong> You are approaching your storage limit. 
                      Consider removing unused files to free up space.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ThreeDLayout>
  );
};

export default Profile;
