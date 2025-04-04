import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, RefreshCw, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { isAuthenticated, handleAuthError, AuthError, AuthStatus } from '@/lib/auth';
import ThreeDBackground from '@/components/3DBackground';
import LoginForm from '@/components/auth/LoginForm';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const MAX_AUTH_ATTEMPTS = 3;
const AUTH_CHECK_TIMEOUT = 5000; // Increased timeout

const Login = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [authAttempts, setAuthAttempts] = useState(0);

  const checkAuth = async () => {
    // Prevent excessive auth checks
    if (authAttempts >= MAX_AUTH_ATTEMPTS) {
      console.log(`Reached max auth attempts (${MAX_AUTH_ATTEMPTS}), skipping check`);
      setCheckingAuth(false);
      setAuthStatus({
        authenticated: false,
        error: AuthError.UNKNOWN,
        errorMessage: "Too many authentication attempts. Please try logging in manually.",
        retryable: false
      });
      return;
    }

    setAuthAttempts(prev => prev + 1);

    try {
      setCheckingAuth(true);
      console.log("Checking authentication status...");

      try {
        // First check if we have a session and encryption key (fast path)
        const { data: sessionData } = await supabase.auth.getSession();
        const hasEncryptionKey = !!localStorage.getItem('encryption_key');

        if (sessionData.session && hasEncryptionKey) {
          console.log("Session and encryption key found, redirecting to dashboard");
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (e) {
        console.error("Error in fast path session check:", e);
        // Continue to full auth check
      }

      // Fallback to enhanced authentication check with better error handling
      const status = await isAuthenticated();

      if (status.error) {
        console.error("Authentication error detected by isAuthenticated:", status.error, status.errorMessage);
        // Add specific logging for the potential OAuth key missing state
        const { data: sessionData } = await supabase.auth.getSession(); // Check session again for context
        if (sessionData.session && status.error === AuthError.MISSING_ENCRYPTION_KEY) {
          console.warn("OAuth Login State Issue Suspected: Session exists but encryption key is missing in localStorage. The application needs to handle key setup after OAuth login (e.g., fetch metadata, prompt for password if needed).");
        }
        setAuthStatus(status);
        handleAuthError(status); // Display error toast to the user
      }

      if (status.authenticated) {
        console.log("User authenticated via isAuthenticated(), redirecting to dashboard");
        navigate('/dashboard', { replace: true });
      } else {
        // No session and no key, or some other non-error state from isAuthenticated that doesn't require error handling
        console.log("User not authenticated or state indeterminate (e.g., no session), showing login page");
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      const errorStatus: AuthStatus = {
        authenticated: false, 
        error: AuthError.UNKNOWN,
        errorMessage: error instanceof Error ? error.message : "Failed to check authentication status",
        retryable: true
      };
      setAuthStatus(errorStatus);
      handleAuthError(errorStatus);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    // Set a short timeout to ensure the check doesn't hang
    // Removed the timeout logic that caused premature error messages.
    // The checkAuth function's finally block handles setting checkingAuth to false.
    // We still need a variable to potentially clear in the return function, even if it's null initially.
    const authTimeout: NodeJS.Timeout | null = null;
    // Only check auth on initial load and retries, not on every render
    if (retryCount > 0 || authAttempts === 0) {
      checkAuth();
    }

    return () => {
      // Although authTimeout is now always null initially, keep check for robustness
      // if logic changes later. The primary cleanup should be for the async checkAuth itself.
      if (authTimeout) clearTimeout(authTimeout);
      // TODO: Implement cancellation for the actual checkAuth() async operation if possible.
      // Example: if checkAuth returns a cleanup function or uses AbortController.
    };
  }, [navigate, retryCount]); // Added retryCount dependency to trigger recheck

  // Function to retry authentication
  const handleRetryAuth = () => {
    setRetryCount(prev => prev + 1);
    setAuthStatus(null);
    toast({
      title: "Retrying Authentication",
      description: "Checking your authentication status again...",
    });
  };

  // Show a simple loading state while checking auth
  if (checkingAuth) {
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
  const hasBrowserSecurityError = authStatus?.error === AuthError.SECURITY;

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
        {authStatus?.error && authStatus.retryable && !hasBrowserSecurityError && (
          <Alert variant="destructive" className="mb-4 backdrop-blur-sm bg-red-50/90 border-red-200">
            <AlertDescription className="flex items-center justify-between">
              <span>{authStatus.errorMessage || "There was a problem with authentication. Please try again."}</span>
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