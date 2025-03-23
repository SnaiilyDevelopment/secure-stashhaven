
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Redirect based on authentication status
    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        const authenticated = await isAuthenticated();
        
        if (authenticated) {
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setError(error instanceof Error ? error.message : 'An error occurred while checking authentication');
        toast({
          title: "Authentication Error",
          description: "There was a problem checking your login status. Please try again.",
          variant: "destructive"
        });
        // After error, still navigate to login for better user experience
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Show a loading indicator while checking auth
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-50 to-green-100">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin mb-2" />
        <p className="text-green-800">Loading your secure vault...</p>
        <p className="text-xs text-green-600/70 mt-2">Checking authentication status...</p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-red-50 to-red-100">
        <ShieldAlert className="h-8 w-8 text-red-600 mb-2" />
        <p className="text-red-800 font-medium">Authentication Error</p>
        <p className="text-sm text-red-700 mt-2 max-w-md text-center">{error}</p>
        <p className="text-xs text-red-600/70 mt-4">Redirecting to login page...</p>
      </div>
    );
  }
  
  return null; // This component will redirect immediately after loading
};

export default Index;
