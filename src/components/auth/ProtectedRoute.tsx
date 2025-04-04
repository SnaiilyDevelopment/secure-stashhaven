
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isReady, isCheckingAuth, isLoggedIn, authStatus } = useAuth();
  
  if (!isReady || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (authStatus?.error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-destructive/10 p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-semibold text-destructive mb-2">Authentication Error</h2>
          <p className="mb-4">{authStatus.errorMessage || "An error occurred during authentication"}</p>
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
  
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

export default ProtectedRoute;
