
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';

export const useAuthCheck = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await isAuthenticated();
        if (!authStatus.authenticated) {
          if (authStatus.error) {
            console.error("Auth error:", authStatus.error, authStatus.errorMessage);
            setAuthError(authStatus.errorMessage || "Authentication failed. Please log in again.");
          }
          navigate('/login');
        } else {
          setAuthError(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setAuthError("Authentication check failed. You can try refreshing the page.");
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  const handleRetry = () => {
    setAuthError(null);
  };
  
  return { authError, handleRetry };
};
