
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading, isError } = useAuth();
  
  useEffect(() => {
    const redirectUser = () => {
      if (!isLoading) {
        if (user) {
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      }
    };
    
    redirectUser();
    
    // Set a timeout to force navigation if check takes too long
    const navigationTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("Forcing navigation to login after timeout");
        navigate('/login');
      }
    }, 3000); // Shorter timeout for better UX
    
    return () => clearTimeout(navigationTimeout);
  }, [navigate, user, isLoading]);
  
  // Show a loading indicator while checking auth
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-50 to-green-100">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin mb-2" />
        <p className="text-green-800">Loading your secure vault...</p>
        <p className="text-xs text-green-600/70 mt-2">Checking authentication status...</p>
      </div>
    );
  }
  
  // Show error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-red-50 to-red-100">
        <ShieldAlert className="h-8 w-8 text-red-600 mb-2" />
        <p className="text-red-800 font-medium">Authentication Error</p>
        <p className="text-sm text-red-700 mt-2 max-w-md text-center">
          There was a problem checking your authentication status.
        </p>
        <p className="text-xs text-red-600/70 mt-4">Redirecting to login page...</p>
      </div>
    );
  }
  
  return null; // This component will redirect immediately after loading
};

export default Index;
