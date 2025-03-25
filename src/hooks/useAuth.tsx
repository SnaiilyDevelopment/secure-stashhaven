
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isAuthenticated, AuthError, AuthStatus, handleAuthError } from '@/lib/auth';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isError: boolean;
  errorType: AuthError | null;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorType, setErrorType] = useState<AuthError | null>(null);
  const [authChecksCount, setAuthChecksCount] = useState(0);
  const MAX_AUTH_CHECKS = 3;

  const checkAuth = async () => {
    // Prevent excessive auth checks
    if (authChecksCount >= MAX_AUTH_CHECKS) {
      console.log(`Reached max auth checks (${MAX_AUTH_CHECKS}), waiting for user action`);
      setIsLoading(false);
      return;
    }

    setAuthChecksCount(prev => prev + 1);
    
    try {
      setIsLoading(true);
      console.log("Checking authentication status...");
      
      // Fast path - check session directly first
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data.session;
      const hasEncryptionKey = !!localStorage.getItem('encryption_key');
      
      if (hasSession && hasEncryptionKey) {
        setUser(data.session.user);
        setSession(data.session);
        setIsError(false);
        setErrorType(null);
        return;
      }
      
      // Fallback to full auth check
      const authStatus = await isAuthenticated();
      
      if (authStatus.error) {
        console.error("Authentication error:", authStatus.error, authStatus.errorMessage);
        setIsError(true);
        setErrorType(authStatus.error);
        handleAuthError(authStatus);
      } else {
        setIsError(false);
        setErrorType(null);
      }
      
      if (authStatus.authenticated) {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
        setSession(data.session);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsError(true);
      setErrorType(AuthError.UNKNOWN);
      
      // Show toast for unexpected errors
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      localStorage.removeItem('encryption_key');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Error",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession ? "User logged in" : "No session");
        
        if (!isMounted) return;
        
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          // For OAuth users, handle encryption key generation
          if (newSession.user?.app_metadata?.provider === 'github' || 
              newSession.user?.app_metadata?.provider === 'google') {
            if (!localStorage.getItem('encryption_key')) {
              try {
                const encryptionKey = btoa(String.fromCharCode(
                  ...new Uint8Array(await window.crypto.getRandomValues(new Uint8Array(32)))
                ));
                localStorage.setItem('encryption_key', encryptionKey);
              } catch (error) {
                console.error("Error generating encryption key for OAuth user:", error);
              }
            }
          }
          
          setIsError(false);
          setErrorType(null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        }
      }
    );
    
    // Initial session check
    checkAuth();
    
    // Force loading to end if it's taking too long
    const forceReadyTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.log("Force ending loading state after timeout");
        setIsLoading(false);
      }
    }, 5000);
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(forceReadyTimeout);
    };
  }, []);

  const value = {
    user,
    session,
    isLoading,
    isError,
    errorType,
    checkAuth,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
