
import { useCallback, useState, useEffect } from 'react';
import { isAuthenticated } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

export const useAuthCheck = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const { authStatus, handleRetry } = useAuth();

  useEffect(() => {
    if (authStatus?.error && authStatus?.errorMessage) {
      setAuthError(authStatus.errorMessage);
    } else {
      setAuthError(null);
    }
  }, [authStatus]);

  const checkAuth = useCallback(async () => {
    try {
      const status = await isAuthenticated();
      if (!status.authenticated && status.errorMessage) {
        setAuthError(status.errorMessage);
      } else {
        setAuthError(null);
      }
      return status.authenticated;
    } catch (error) {
      console.error("Authentication check error:", error);
      setAuthError(error instanceof Error ? error.message : "Authentication check failed");
      return false;
    }
  }, []);

  return {
    authError,
    checkAuth,
    handleRetry,
  };
};
