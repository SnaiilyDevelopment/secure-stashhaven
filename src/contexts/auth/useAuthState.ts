
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthError, AuthStatus } from "@/lib/auth/types";
import { AUTH_CHECK_TIMEOUT } from "@/lib/storage/constants";

export function useAuthState() {
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

  return {
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
  };
}
