
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect based on authentication status
    if (isAuthenticated()) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [navigate]);
  
  return null; // This component will redirect immediately
};

export default Index;
