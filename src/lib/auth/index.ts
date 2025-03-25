
import { toast } from "@/components/ui/use-toast";
import { generateEncryptionKey } from "../encryption";
import { supabase } from "@/integrations/supabase/client";

// Authentication errors that can be shown to users
export enum AuthError {
  CONNECTION = "connection_error",
  SESSION = "session_error",
  ENCRYPTION = "encryption_error",
  UNKNOWN = "unknown_error",
  TIMEOUT = "timeout_error",
  SECURITY = "security_error"
}

// Authentication status interface with more detailed error info
export interface AuthStatus {
  authenticated: boolean;
  error?: AuthError;
  errorMessage?: string;
  retryable: boolean;
}

// Check if user is authenticated
export const isAuthenticated = async (): Promise<AuthStatus> => {
  try {
    console.log("Checking authentication status in isAuthenticated()");
    
    // Set a timeout for the authentication check
    const timeoutPromise = new Promise<AuthStatus>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Authentication check timed out'));
      }, 5000);
    });
    
    // Actual authentication check
    const authCheckPromise = performAuthCheck();
    
    // Race between the auth check and the timeout
    return await Promise.race([authCheckPromise, timeoutPromise]);
  } catch (error) {
    console.error("Authentication check error:", error);
    
    // Handle SecurityError specially - this is likely from the browser security policy
    if (error instanceof Error && error.name === 'SecurityError') {
      console.log("Caught SecurityError during auth check, treating as recoverable");
      return {
        authenticated: false,
        error: AuthError.SECURITY,
        errorMessage: "Security restriction encountered. This is usually temporary.",
        retryable: true
      };
    }
    
    // Determine if the error is a timeout
    if (error instanceof Error && error.message === 'Authentication check timed out') {
      return {
        authenticated: false,
        error: AuthError.TIMEOUT,
        errorMessage: "Authentication check timed out. Please check your connection and try again.",
        retryable: true
      };
    }
    
    return {
      authenticated: false,
      error: AuthError.UNKNOWN,
      errorMessage: error instanceof Error ? error.message : "An unknown error occurred",
      retryable: true
    };
  }
};

// Separate function to perform the actual auth check for better code organization
const performAuthCheck = async (): Promise<AuthStatus> => {
  try {
    // Check for session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session check error:", error);
      
      // Determine error type for better error handling
      if (error.message?.toLowerCase().includes('network') || 
          error.message?.toLowerCase().includes('connection') ||
          error.message?.toLowerCase().includes('failed to fetch')) {
        return {
          authenticated: false,
          error: AuthError.CONNECTION,
          errorMessage: "Unable to connect to authentication service. Please check your internet connection.",
          retryable: true
        };
      }
      
      return {
        authenticated: false,
        error: AuthError.SESSION,
        errorMessage: error.message || "Session verification failed",
        retryable: true
      };
    }
    
    if (!session) {
      console.log("No session found, user not authenticated");
      return { authenticated: false, retryable: false };
    }
    
    // For OAuth users (Google/GitHub), we need special handling
    if (session.user?.app_metadata?.provider === 'github' || 
        session.user?.app_metadata?.provider === 'google') {
      
      // If we don't have an encryption key yet, generate one
      if (!localStorage.getItem('encryption_key')) {
        console.log("OAuth user authenticated but no encryption key, generating one");
        try {
          const encryptionKey = await generateEncryptionKey();
          localStorage.setItem('encryption_key', encryptionKey);
        } catch (error) {
          console.error("Error generating encryption key:", error);
          return {
            authenticated: false,
            error: AuthError.ENCRYPTION,
            errorMessage: "Failed to generate encryption key for OAuth login",
            retryable: true
          };
        }
      }
      
      console.log("OAuth user authenticated with encryption key");
      return { authenticated: true, retryable: false };
    }
    
    // For email/password users, check both session and encryption key with error catching
    try {
      const hasEncryptionKey = !!localStorage.getItem('encryption_key');
      console.log("Email user authenticated, encryption key present:", hasEncryptionKey);
      
      if (!hasEncryptionKey) {
        console.log("No encryption key found, user not fully authenticated");
        // Clear the session if we don't have an encryption key
        await supabase.auth.signOut();
        return {
          authenticated: false,
          error: AuthError.ENCRYPTION,
          errorMessage: "Your encryption key is missing. Please login again to regenerate it.",
          retryable: true
        };
      }
      
      return { authenticated: true, retryable: false };
    } catch (error) {
      if (error instanceof Error && error.name === 'SecurityError') {
        console.error("Security error accessing localStorage:", error);
        return {
          authenticated: false,
          error: AuthError.SECURITY,
          errorMessage: "Browser security restrictions are preventing authentication. Try using a different browser or enable third-party cookies.",
          retryable: true
        };
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    console.error("Authentication check error in performAuthCheck:", error);
    throw error; // Re-throw to be caught by the outer function
  }
};

// Helper function to handle auth errors and provide user feedback
export const handleAuthError = (authStatus: AuthStatus): void => {
  if (!authStatus.error) return;
  
  const title = authStatus.error === AuthError.UNKNOWN 
    ? "Authentication Error" 
    : {
      [AuthError.CONNECTION]: "Connection Error",
      [AuthError.SESSION]: "Session Error",
      [AuthError.ENCRYPTION]: "Security Error",
      [AuthError.TIMEOUT]: "Timeout Error",
      [AuthError.SECURITY]: "Browser Security Error"
    }[authStatus.error] || "Authentication Error";
  
  const description = authStatus.errorMessage || {
    [AuthError.CONNECTION]: "Unable to connect to the authentication service. Please check your internet connection and try again.",
    [AuthError.SESSION]: "There was a problem with your login session. Please try logging in again.",
    [AuthError.ENCRYPTION]: "There was a problem with your encryption key. Please log in again to restore secure access.",
    [AuthError.TIMEOUT]: "The authentication check timed out. Please try again.",
    [AuthError.SECURITY]: "Browser security restrictions are preventing authentication. Try using a different browser or enable third-party cookies.",
    [AuthError.UNKNOWN]: "An unexpected error occurred. Please try logging in again."
  }[authStatus.error];
  
  toast({
    title,
    description,
    variant: "destructive"
  });
};

// Export the rest of the authentication functions
export { registerUser, loginUser, signInWithProvider, logoutUser } from './userAuth';

// Export getCurrentUserEncryptionKey from storage/fileOperations
export { getCurrentUserEncryptionKey } from './userAuth';
