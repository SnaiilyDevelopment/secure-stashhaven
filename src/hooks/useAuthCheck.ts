
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';
import { toast } from '@/components/ui/use-toast';
import { AUTH_CHECK_TIMEOUT } from '@/lib/storage/constants';

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
    
    // Set interval to periodically check auth (every 5 minutes)
    const refreshInterval = setInterval(() => {
      // Only refresh if it's been more than 4 minutes since last check
      if (Date.now() - lastChecked > 4 * 60 * 1000) {
        checkAuth();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [checkAuth, lastChecked]);
  
  const handleRetry = () => {
    setAuthError(null);
    checkAuth();
  };
  
  return { authError, handleRetry };
};
