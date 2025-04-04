
import React, { createContext, useEffect } from "react";
import { useAuthState } from "./useAuthState";
import { AuthContextType } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { AUTH_CHECK_TIMEOUT, AUTH_CHECK_FAST_TIMEOUT } from "@/lib/storage/constants";
import { AuthError } from "@/lib/auth/types";

// Create the context with undefined as default
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    isReady, 
    isLoggedIn, 
    isCheckingAuth, 
    authStatus, 
    setAuthStatus,
    setIsLoggedIn,
    setIsCheckingAuth,
    setIsReady,
    checkAuth,
    handleRetry
  } = useAuthState();
  
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
    const forceReadyTimeout = isCheckingAuth ? setTimeout(async () => {
      if (isMounted && isCheckingAuth) {
        console.log("Attempting fast auth check...");
        try {
          // Fast check for session and encryption key
          const { data: { session } } = await supabase.auth.getSession();
          const hasEncryptionKey = !!localStorage.getItem('encryption_key');
          
          if (session && hasEncryptionKey) {
            console.log("Fast auth check successful");
            setIsLoggedIn(true);
            setAuthStatus(null);
          } else {
            console.log("Fast auth check failed, user needs to log in");
            setIsLoggedIn(false);
            setAuthStatus({
              authenticated: false,
              error: AuthError.TIMEOUT,
              errorMessage: "Please log in to continue.",
              retryable: true
            });
          }
        } catch (error) {
          console.error("Fast auth check failed:", error);
          setIsLoggedIn(false);
          setAuthStatus({
            authenticated: false,
            error: AuthError.NETWORK,
            errorMessage: "Network error during authentication check.",
            retryable: true
          });
        } finally {
          setIsReady(true);
          setIsCheckingAuth(false);
        }
      }
    }, AUTH_CHECK_FAST_TIMEOUT) : null;
    
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
