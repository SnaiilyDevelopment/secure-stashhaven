
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, AuthError, AuthStatus } from '@/lib/auth';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAuthCheck = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number>(Date.now());
  const navigate = useNavigate();
  
  // Check authentication
  const checkAuth = useCallback(async () => {
    try {
      setLastChecked(Date.now());
      console.log("Checking authentication status...");
      
      const authStatus = await isAuthenticated();
      
      if (!authStatus.authenticated) {
        if (authStatus.error) {
          console.error("Auth error:", authStatus.error, authStatus.errorMessage);
          setAuthError(authStatus.errorMessage || "Authentication failed. Please log in again.");
          
          // If error is non-retryable, redirect to login
          if (!authStatus.retryable) {
            navigate('/login');
          }
        } else {
          navigate('/login');
        }
      } else {
        setAuthError(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setAuthError("Authentication check failed. You can try refreshing the page.");
    }
  }, [navigate]);
  
  useEffect(() => {
    // Initialize auth check
    checkAuth();
    
    // Set up auth state listener with initialization timeout handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      
      switch (event) {
        case 'SIGNED_OUT':
          navigate('/login');
          break;
        case 'TOKEN_REFRESHED':
          setAuthError(null);
          break;
        case 'USER_UPDATED':
          checkAuth();
          break;
        case 'INITIAL_SESSION':
          if (!session) {
            console.log("Initial session check timed out, retrying...");
            setTimeout(() => checkAuth(), 5000); // Retry after 5 seconds
          }
          break;
      }
    });

    // Initial check with retry logic
    const initialCheck = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.log("Initial auth check failed, retrying...", error);
        setTimeout(() => initialCheck(), 5000); // Retry after 5 seconds
      }
    };
    initialCheck();
    
    // Optimized keep-alive with debouncing (every 2 minutes)
    const keepAliveInterval = setInterval(() => {
      const now = Date.now();
      // Only refresh if it's been more than 90 seconds since last successful check
      if (now - lastChecked > 90 * 1000) {
        supabase.auth.getSession()
          .then(({ data }) => {
            if (data.session) {
              console.debug("Session keep-alive successful");
              setLastChecked(now);
            }
          })
          .catch(error => {
            console.debug("Keep-alive check failed:", error);
            // Retry after 30 seconds on failure
            setTimeout(() => {
              supabase.auth.getSession()
                .then(({ data }) => {
                  if (data.session) {
                    setLastChecked(Date.now());
                  }
                });
            }, 30000);
          });
      }
    }, 120 * 1000);
    
    return () => {
      clearInterval(keepAliveInterval);
      subscription?.unsubscribe();
    };
  }, [checkAuth, lastChecked, navigate]);
  
  const handleRetry = () => {
    setAuthError(null);
    checkAuth();
  };
  
  return { authError, handleRetry };
};
