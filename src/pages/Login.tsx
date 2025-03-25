
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, RefreshCw, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthError } from '@/lib/auth';
import ThreeDBackground from '@/components/3DBackground';
import LoginForm from '@/components/auth/LoginForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { isLoading, isError, errorType, checkAuth, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Function to retry authentication
  const handleRetryAuth = () => {
    checkAuth();
  };

  // Show a simple loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-green-600 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-green-800">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Check for specific security errors that might be related to CORS
  const hasBrowserSecurityError = errorType === AuthError.SECURITY;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 animate-fade-in">
      {/* 3D Interactive Background */}
      <ThreeDBackground color="#22c55e" />
      
      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center animate-pulse-subtle">
              <LockKeyhole className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-green-800">Welcome to SafeHaven</h1>
          <p className="text-green-700/80 mt-2">Sign in to access your secure vault</p>
        </div>
        
        {/* Show special alert for security errors */}
        {hasBrowserSecurityError && (
          <Alert variant="destructive" className="mb-4 backdrop-blur-sm bg-red-50/90 border-red-200">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Browser Security Restrictions</AlertTitle>
            <AlertDescription>
              Your browser's security settings may be preventing proper authentication. Try:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                <li>Enabling third-party cookies</li>
                <li>Using a different browser</li>
                <li>Disabling tracking protection for this site</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Show error alert with retry button if there's an auth error */}
        {isError && errorType !== AuthError.SECURITY && (
          <Alert variant="destructive" className="mb-4 backdrop-blur-sm bg-red-50/90 border-red-200">
            <AlertDescription className="flex items-center justify-between">
              <span>There was a problem with authentication. Please try again.</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetryAuth} 
                className="ml-2 bg-white hover:bg-green-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Card className="animate-scale-in border-green-100 shadow-lg backdrop-blur-sm bg-white/70">
          <CardHeader>
            <CardTitle className="text-green-800">Sign In</CardTitle>
            <CardDescription className="text-green-700/70">
              Enter your credentials to access your encrypted files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-center text-sm text-green-700">
              Don't have an account?{" "}
              <Link to="/register" className="text-green-600 font-medium hover:underline transition-all">
                Create one
              </Link>
            </p>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center text-sm text-green-700/80">
          <p>Your data is end-to-end encrypted.</p>
          <p className="mt-1">Only you can access your files with your password.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
