import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginUser } from '@/lib/auth';
import OAuthButtons from './OAuthButtons';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Clear any existing session if the user is on the login page
  useEffect(() => {
    // Check for redirect message in the URL
    const params = new URLSearchParams(location.search);
    const message = params.get('message');
    
    if (message === 'session_expired') {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "default"
      });
    }
    
    // If user navigated to login page, clear auth state
    const clearAuth = async () => {
      try {
        // Only sign out if there is actually a session
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          await supabase.auth.signOut();
          localStorage.removeItem('encryption_key');
        }
      } catch (error) {
        console.error("Error clearing authentication:", error);
      }
    };
    
    clearAuth();
  }, [location]);
  
  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Clear error when typing
    if (emailError) {
      validateEmail(newEmail);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before submission
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: emailError,
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Add a timeout to prevent hanging on login
      const loginPromise = loginUser(email, password);
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error("Login timed out")), 10000);
      });
      
      const success = await Promise.race([loginPromise, timeoutPromise])
        .catch(error => {
          console.error("Login timed out:", error);
          toast({
            title: "Login Timed Out",
            description: "The login process took too long. Please try again.",
            variant: "destructive"
          });
          return false;
        });
      
      if (success) {
        // Show success toast
        toast({
          title: "Login Successful",
          description: "Welcome back to your secure vault.",
        });
        
        // Force redirect to dashboard
        console.log("Login successful, redirecting to dashboard...");
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500); // Short delay to ensure the toast is shown
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <OAuthButtons isLoading={isOAuthLoading} />
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-green-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-green-600 rounded">Or continue with</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-green-800">Email</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-green-600/60" />
              </div>
              <Input
                id="email"
                placeholder="you@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                value={email}
                onChange={handleEmailChange}
                className={`pl-10 border-green-200 focus:ring-green-500 ${emailError ? 'border-red-300' : ''}`}
                required
              />
            </div>
            {emailError && (
              <p className="text-sm text-red-500 mt-1">{emailError}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-green-800">Password</Label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-4 w-4 text-green-600/60" />
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 border-green-200 focus:ring-green-500"
                required
              />
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unlocking...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
