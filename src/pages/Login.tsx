
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { isAuthenticated } from '@/lib/auth';
import ThreeDBackground from '@/components/3DBackground';
import LoginForm from '@/components/auth/LoginForm';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setCheckingAuth(true);
        console.log("Checking authentication status...");
        
        // First check if we have a session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Session check error:", sessionError);
          throw sessionError;
        }
        
        // If we have a session and encryption key, consider authenticated
        if (sessionData.session && localStorage.getItem('encryption_key')) {
          console.log("Session and encryption key found, redirecting to dashboard");
          navigate('/dashboard', { replace: true });
          return;
        }
        
        // Fallback to original authentication check
        const authenticated = await isAuthenticated();
        if (authenticated) {
          console.log("User authenticated via isAuthenticated(), redirecting to dashboard");
          navigate('/dashboard', { replace: true });
        } else {
          console.log("User not authenticated, showing login page");
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        toast({
          title: "Authentication Error",
          description: "There was a problem checking your authentication status.",
          variant: "destructive"
        });
      } finally {
        setCheckingAuth(false);
      }
    };
    
    // Set a short timeout to ensure the check doesn't hang
    const authTimeout = setTimeout(() => {
      if (checkingAuth) {
        console.log("Auth check timed out, allowing login page to display");
        setCheckingAuth(false);
      }
    }, 2000);
    
    checkAuth();
    
    return () => clearTimeout(authTimeout);
  }, [navigate]);

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
