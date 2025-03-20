
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, KeyRound, ArrowRight, Loader2, Github, Mail as MailIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { loginUser, signInWithProvider, isAuthenticated } from '@/lib/auth';
import ThreeDBackground from '@/components/3DBackground';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await loginUser(email, password);
      if (success) {
        // Explicitly navigate to dashboard on successful login
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsOAuthLoading(true);
    try {
      await signInWithProvider(provider);
      // OAuth will redirect, so no need to navigate here
    } finally {
      setIsOAuthLoading(false);
    }
  };

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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline"
                className="w-full border-green-200 hover:bg-green-50 text-green-700"
                onClick={() => handleOAuthLogin('google')}
                disabled={isOAuthLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Google
              </Button>
              <Button 
                variant="outline"
                className="w-full border-green-200 hover:bg-green-50 text-green-700"
                onClick={() => handleOAuthLogin('github')}
                disabled={isOAuthLoading}
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-green-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-green-600 rounded">Or continue with</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-green-800">Email</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-green-600/60" />
                    </div>
                    <Input
                      id="email"
                      placeholder="you@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-green-200 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-green-800">Password</Label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-green-600/60" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 border-green-200 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Unlocking...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
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
