
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Redirect based on authentication status
    const checkAuth = async () => {
      try {
        setLoading(true);
        const authenticated = await isAuthenticated();
        
        if (authenticated) {
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error("Auth check error:", error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Show a simple loading indicator while checking auth
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-50 to-green-100">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin mb-2" />
        <p className="text-green-800">Loading your secure vault...</p>
      </div>
    );
  }
  
  return null; // This component will redirect immediately after loading
};

export default Index;
