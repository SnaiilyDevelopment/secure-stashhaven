
import React, { useState, useEffect, useRef } from 'react';
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
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
const LOGIN_TIMEOUT = 8000; // 8 seconds

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [nextAttemptTime, setNextAttemptTime] = useState(0);
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
          
          // Try/catch around localStorage operations to handle SecurityErrors
          try {
            localStorage.removeItem('encryption_key');
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error("Error clearing encryption key from localStorage:", error);
            }
            // We can still proceed even if this fails
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error clearing authentication:", error);
        }
      }
    };
    
    clearAuth();
  }, [location]);
  
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    
    if (password.length < PASSWORD_MIN_LENGTH) {
      setPasswordError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
      return false;
    }
    
    if (!PASSWORD_REGEX.test(password)) {
      setPasswordError('Password must contain uppercase, lowercase, number and special character');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

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
    
    // Clear password field immediately
    setPassword('');
    
    // Validate inputs before submission
    if (!validateEmail(email) || !validatePassword(password)) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive"
      });
      return;
    }
    
    // Check if user needs to wait before next attempt
    const now = Date.now();
    if (now < nextAttemptTime) {
      const secondsLeft = Math.ceil((nextAttemptTime - now) / 1000);
      toast({
        title: "Too Many Attempts",
        description: `Please wait ${secondsLeft} second${secondsLeft !== 1 ? 's' : ''} before trying again.`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log("Attempting login for:", email);
      }
      setLoginAttempts(prev => prev + 1);
      
      // Add a timeout to prevent hanging on login
      const loginPromise = loginUser(email, password);
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error("Login timed out")), LOGIN_TIMEOUT);
      });
      
      const success = await Promise.race([loginPromise, timeoutPromise])
        .catch(error => {
          console.error("Login error:", error);
          
          // Special handling for SecurityError
          if (error instanceof Error && error.name === 'SecurityError') {
            toast({
              title: "Browser Security Restriction",
              description: "Your browser's security settings are preventing login. Try enabling third-party cookies or using a different browser.",
              variant: "destructive"
            });
          } else {
      let errorMsg = "Login failed. Please check your credentials and try again.";
      if (error.message === "Login timed out") {
        errorMsg = "Login took too long. Please check your connection and try again.";
      } else if (error.message.includes("rate limit")) {
        errorMsg = "Too many attempts. Please wait before trying again.";
      }
      toast({
        title: "Login Failed",
        description: errorMsg,
        variant: "destructive"
      });
          }
          return false;
        });
      
      if (success) {
        // Verify encryption key is actually stored before proceeding
        let attempts = 0;
        let timeoutId: NodeJS.Timeout | null = null;
        
        const checkKey = async () => {
          attempts++;
          const key = localStorage.getItem('encryption_key');
          if (key) {
            // Clear any pending timeout
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            
            // Show success toast
            toast({
              title: "Login Successful",
              description: "Welcome back to your secure vault.",
            });
            
            if (process.env.NODE_ENV === 'development') {
              console.log("Login successful, encryption key confirmed, redirecting to dashboard...");
            }
            navigate('/dashboard', { replace: true });
          } else if (attempts < 5) {
            timeoutId = setTimeout(checkKey, 200);
          } else {
            // Key never appeared - something went wrong
            if (process.env.NODE_ENV === 'development') {
              console.error("Encryption key not stored after login");
            }
            toast({
              title: "Login Error",
              description: "Failed to initialize security. Please try again.",
              variant: "destructive"
            });
            await supabase.auth.signOut();
          }
        };
        
        // Start checking for key
        await checkKey();
        
        // Cleanup function
        return () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        };
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Login error:", error);
      }
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive"
        });
      
      // Implement exponential backoff (1, 2, 4, 8, 16 seconds)
      const backoffTime = Math.min(2 ** (loginAttempts - 1), 16) * 1000;
      setNextAttemptTime(Date.now() + backoffTime);
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
                className={`pl-10 border-green-200 focus:ring-green-500 ${passwordError ? 'border-red-300' : ''}`}
                required
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-500 mt-1">{passwordError}</p>
            )}
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
