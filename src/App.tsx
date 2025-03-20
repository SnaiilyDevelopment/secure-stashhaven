
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import { isAuthenticated } from "./lib/auth";
import { supabase } from "./integrations/supabase/client";
import { toast } from "./components/ui/use-toast";

const queryClient = new QueryClient();

// Handle the OAuth redirect and hash fragment
const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we have a hash in the URL (from OAuth redirect)
    if (location.hash) {
      console.log("Processing OAuth redirect with hash params");
      
      // Let Supabase handle the hash and session setup
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error("Error processing OAuth session:", error);
          toast({
            title: "Authentication error",
            description: "Failed to complete authentication. Please try again.",
            variant: "destructive"
          });
        } else {
          console.log("Successfully processed OAuth redirect");
          navigate('/dashboard', { replace: true });
        }
      });
    }
  }, [location, navigate]);

  return null;
};

const App = () => {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Handle hash params from OAuth redirects on initial load
    if (window.location.hash && window.location.hash.includes('access_token')) {
      console.log("Found access_token in URL hash, processing...");
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Store tokens in localStorage for the encryption key check
        localStorage.setItem('encryption_key', accessToken);
        window.location.href = '/dashboard';
        return;
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session ? "User logged in" : "No session");
      
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
      
      const authenticated = await isAuthenticated();
      console.log("isAuthenticated returned:", authenticated);
      setIsLoggedIn(authenticated);
      setIsReady(true);
      
      // Force navigation to dashboard on login events
      if (authenticated && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        window.location.href = '/dashboard';
      }
    });
    
    // Check initial auth state
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      console.log("Initial auth check:", authenticated);
      setIsLoggedIn(authenticated);
      setIsReady(true);
    };
    
    checkAuth();
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isReady) return <div className="flex items-center justify-center h-screen">Loading...</div>;
    
    if (!isLoggedIn) return <Navigate to="/login" />;
    
    return <>{children}</>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthHandler />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
