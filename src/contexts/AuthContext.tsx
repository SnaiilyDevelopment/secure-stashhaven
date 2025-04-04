
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AuthStatus, AuthError, handleAuthError } from "@/lib/auth";
import { AUTH_CHECK_TIMEOUT, AUTH_CHECK_FAST_TIMEOUT } from "@/lib/storage/constants";

interface AuthContextType {
  isReady: boolean;
  isLoggedIn: boolean;
  isCheckingAuth: boolean;
  authStatus: AuthStatus | null;
  handleRetry: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  
  const checkAuth = async () => {
    try {
      // Get session and check for encryption key
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session check error:", error);
        setAuthStatus({
          authenticated: false,
          error: AuthError.NETWORK,
          errorMessage: error.message,
          retryable: true
        });
        setIsLoggedIn(false);
      } else {
        const authenticated = !!data.session && !!localStorage.getItem('encryption_key');
        console.log("Auth check:", authenticated);
        setIsLoggedIn(authenticated);
        setAuthStatus(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthStatus({
        authenticated: false,
        error: AuthError.UNKNOWN,
        errorMessage: "Failed to check authentication status",
        retryable: true
      });
      setIsLoggedIn(false);
    } finally {
      setIsReady(true);
      setIsCheckingAuth(false);
    }
  };
  
  const handleRetry = async () => {
    setIsCheckingAuth(true);
    await checkAuth();
  };
  
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let isMounted = true;
    
    // Set up auth state listener first
    const setupAuthListener = async () => {
      try {
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event, session ? "User logged in" : "No session");
          
          if (!isMounted) return;
          
          try {
            // For OAuth logins, generate and store encryption key when user first signs in
            if (session && !localStorage.getItem('encryption_key') && 
                (session.user?.app_metadata?.provider === 'github' || 
                session.user?.app_metadata?.provider === 'google')) {
              
              console.log("OAuth login detected, generating encryption key");
              // Create a random encryption key for OAuth users
              const encryptionKey = btoa(String.fromCharCode(
                ...new Uint8Array(await window.crypto.getRandomValues(new Uint8Array(32)))
              ));
              localStorage.setItem('encryption_key', encryptionKey);
            }
            
            // Simple check if user is logged in based on session and encryption key
            const authenticated = !!session && !!localStorage.getItem('encryption_key');
            
            console.log("User authenticated:", authenticated);
            setIsLoggedIn(authenticated);
            setIsCheckingAuth(false);
            setIsReady(true);
            setAuthStatus(null);
          } catch (error) {
            console.error("Error in auth state change handler:", error);
            setIsReady(true);
            setIsCheckingAuth(false);
            setIsLoggedIn(false);
            setAuthStatus({
              authenticated: false,
              error: error instanceof Error ? 
                  (error.message.includes('network') ? 'connection_error' : 'unknown_error') as any : 
                  'unknown_error' as any,
              errorMessage: error instanceof Error ? error.message : String(error),
              retryable: true
            });
          }
        });
        
        subscription = data.subscription;
      } catch (error) {
        console.error("Error setting up auth listener:", error);
        if (isMounted) {
          setIsReady(true);
          setIsCheckingAuth(false);
          setIsLoggedIn(false);
          setAuthStatus({
            authenticated: false,
            error: 'unknown_error' as any,
            errorMessage: "Failed to initialize authentication system",
            retryable: true
          });
        }
      }
    };
    
    const initialize = async () => {
      await setupAuthListener();
      await checkAuth();
    };
    
    initialize();
    
    // Increased timeout value to prevent auth timeout issues
    // Only set timeout if we're actually checking auth
    const forceReadyTimeout = isCheckingAuth ? setTimeout(() => {
      if (isMounted && isCheckingAuth) {
        console.log("Auth check timed out, completing auth flow");
        // Use getSession() instead of directly accessing supabase.auth.session
        supabase.auth.getSession().then(({ data }) => {
          const currentSession = data.session;
          const hasEncryptionKey = !!localStorage.getItem('encryption_key');
          
          // If we have both session and key, consider authenticated
          if (currentSession && hasEncryptionKey) {
            setIsLoggedIn(true);
            setAuthStatus(null);
          } else {
            setIsLoggedIn(false);
            setAuthStatus({
              authenticated: false,
              error: 'timeout_error' as any,
              errorMessage: "Authentication check timed out. Please try logging in again.",
              retryable: true
            });
          }
          
          setIsReady(true);
          setIsCheckingAuth(false);
        });
      }
    }, AUTH_CHECK_TIMEOUT) : null;
    
    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
      if (forceReadyTimeout) {
        clearTimeout(forceReadyTimeout);
      }
    };
  }, []);
  
  return (
    <AuthContext.Provider
      value={{
        isReady,
        isLoggedIn,
        isCheckingAuth,
        authStatus,
        handleRetry
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
