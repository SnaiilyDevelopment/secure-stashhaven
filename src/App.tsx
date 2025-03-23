
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

// Create a custom error handler for the query client
const queryErrorHandler = (error: unknown) => {
  const title = error instanceof Error ? error.message : 'An error occurred';
  toast({
    title,
    description: 'Please try again or contact support if the problem persists.',
    variant: 'destructive',
  });
  console.error('Query error:', error);
};

// Configure QueryClient with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      onError: queryErrorHandler,
    },
    mutations: {
      onError: queryErrorHandler,
    },
  },
});

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
        } else if (data.session) {
          try {
            // Generate and store encryption key for OAuth users
            const encryptionKey = btoa(String.fromCharCode(
              ...new Uint8Array(crypto.getRandomValues(new Uint8Array(32)))
            ));
            localStorage.setItem('encryption_key', encryptionKey);
            
            console.log("Successfully processed OAuth redirect");
            navigate('/dashboard', { replace: true });
          } catch (e) {
            console.error("Error generating encryption key:", e);
            toast({
              title: "Error setting up encryption",
              description: "There was a problem securing your account. Please try again.",
              variant: "destructive"
            });
          }
        }
      });
    }
  }, [location, navigate]);

  return null;
};

const App = () => {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    // Set up auth state listener first
    const setupAuthListener = async () => {
      try {
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event, session ? "User logged in" : "No session");
          
          try {
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
            setAuthError(null);
            
            // Force navigation to dashboard on login events
            if (authenticated && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
              window.location.href = '/dashboard';
            }
          } catch (error) {
            console.error("Error in auth state change handler:", error);
            setIsReady(true);
            setIsLoggedIn(false);
            setAuthError("Authentication error: " + (error instanceof Error ? error.message : String(error)));
          }
        });
        
        subscription = data.subscription;
      } catch (error) {
        console.error("Error setting up auth listener:", error);
        setIsReady(true);
        setIsLoggedIn(false);
        setAuthError("Failed to initialize authentication system");
      }
    };
    
    // Check initial auth state after setting up listener
    const checkAuth = async () => {
      try {
        await setupAuthListener();
        
        // Initial session check
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          setAuthError(error.message);
          setIsLoggedIn(false);
        } else {
          const authenticated = session ? await isAuthenticated() : false;
          console.log("Initial auth check:", authenticated);
          setIsLoggedIn(authenticated);
          setAuthError(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthError("Failed to check authentication status");
        setIsLoggedIn(false);
      } finally {
        setIsReady(true);
      }
    };
    
    checkAuth();
    
    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isReady) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      );
    }
    
    if (authError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="bg-destructive/10 p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-semibold text-destructive mb-2">Authentication Error</h2>
            <p className="mb-4">{authError}</p>
            <button 
              className="bg-primary text-primary-foreground px-4 py-2 rounded"
              onClick={() => window.location.href = '/login'}
            >
              Return to Login
            </button>
          </div>
        </div>
      );
    }
    
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
