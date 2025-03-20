
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { isAuthenticated } from '@/lib/auth';
import ThreeDBackground from '@/components/3DBackground';
import LoginForm from '@/components/auth/LoginForm';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 animate-fade-in">
      {/* 3D Interactive Background */}
      <ThreeDBackground color="#22c55e" />
      
      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center animate-pulse-subtle">
              <LockKeyhole className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-green-800">Welcome to SafeHaven</h1>
          <p className="text-green-700/80 mt-2">Sign in to access your secure vault</p>
        </div>
        
        <Card className="animate-scale-in border-green-100 shadow-lg backdrop-blur-sm bg-white/70">
          <CardHeader>
            <CardTitle className="text-green-800">Sign In</CardTitle>
            <CardDescription className="text-green-700/70">
              Enter your credentials to access your encrypted files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-center text-sm text-green-700">
              Don't have an account?{" "}
              <Link to="/register" className="text-green-600 font-medium hover:underline transition-all">
                Create one
              </Link>
            </p>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center text-sm text-green-700/80">
          <p>Your data is end-to-end encrypted.</p>
          <p className="mt-1">Only you can access your files with your password.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
