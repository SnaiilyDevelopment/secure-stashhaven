
import { toast } from "@/components/ui/use-toast";
import { generateEncryptionKey } from "../encryption";
import { supabase } from "@/integrations/supabase/client";
import { AuthApiError } from "@supabase/supabase-js";
import { getSessionKey, setSessionKey } from './keyStore';

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

      // 1. Check for likely browser network errors first
      if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
        console.log("Detected likely network error (TypeError: failed to fetch)");
        return {
          authenticated: false,
          error: AuthError.CONNECTION,
          errorMessage: "Unable to connect. Please check your internet connection.",
          retryable: true
        };
      }

      // 2. Check for specific Supabase Auth API errors
      if (error instanceof AuthApiError) {
        console.log("Detected Supabase AuthApiError:", error.message);
        // You could potentially check error.status here for more specific handling if needed
        return {
          authenticated: false,
          error: AuthError.SESSION, // Treat specific API errors as session issues for now
          errorMessage: `Session verification failed: ${error.message}`,
          retryable: true // Often retryable, but depends on the specific error
        };
      }

      // 3. Fallback for other unexpected errors during session check
      console.log("Detected unexpected error during session check:", error);
      return {
        authenticated: false,
        error: AuthError.SESSION, // Treat other errors as session issues
        errorMessage: "Session verification failed due to an unexpected error.",
        retryable: true
      };
    }
    
    if (!session) {
      console.log("No session found, user not authenticated");
      return { authenticated: false, retryable: false };
    }
    
    /**
     * Handles authentication checks specifically for OAuth providers (Google, GitHub).
     * NOTE (Bug #3 - Inconsistent OAuth Key Handling):
     * A robust solution for consistent encryption keys across password and OAuth logins
     * requires backend involvement. The ideal approach involves:
     * 1. Storing/deriving the user's master encryption key securely on the backend,
     *    associated with their unique user ID, regardless of login method.
     * 2. After successful authentication (password or OAuth), the backend provides
     *    this key securely to the client (e.g., via a dedicated authenticated endpoint
     *    or custom claim in the JWT).
     *
     * This client-side code CANNOT generate or guarantee the presence of the correct key
     * for OAuth users without backend support. It checks if a key exists in memory
     * (likely from a previous password login in the same session) but returns an
     * AuthError.ENCRYPTION status if it's missing, signaling potential decryption issues
     * to the application layer.
     */
    // For OAuth users (Google/GitHub), we need special handling
    if (session.user?.app_metadata?.provider === 'github' || 
        session.user?.app_metadata?.provider === 'google') {
      
      // OAuth user authenticated.
      // WARNING: Client-side key generation removed. Consistent key management
      // requires backend changes or prompting OAuth users for a password setup.
      // For now, we assume a key *should* exist if the session is valid,
      // but we don't generate one here. We rely on the key being set during
      // a previous password login or fetched from a (currently non-existent) backend endpoint.
      const hasEncryptionKey = !!getSessionKey();
      if (!hasEncryptionKey) {
         console.warn("OAuth user authenticated but no encryption key found in session memory. Data decryption may fail.");
         // Depending on application logic, you might want to return an error or prompt the user.
         // Returning authenticated: true for now, but highlighting the potential issue.
         return {
           authenticated: true, // Session is valid, but key state is uncertain
           error: AuthError.ENCRYPTION, // Indicate potential key issue
           errorMessage: "Secure session active, but encryption key missing. Some features may be unavailable.",
           retryable: true // Re-login might fix it if key is derived/fetched then
         };
      }

      console.log("OAuth user authenticated, encryption key found in session memory.");
      return { authenticated: true, retryable: false };
    }
    
    // For email/password users, check both session and encryption key
    const hasEncryptionKey = !!getSessionKey();
    console.log("Email user session valid, encryption key present in memory:", hasEncryptionKey);

    if (!hasEncryptionKey) {
      console.warn("Email user session valid but no encryption key found in session memory. User needs to log in again.");
      // Do NOT sign out here. Let the UI handle prompting for re-login.
      // await supabase.auth.signOut(); // <-- REMOVED
      return {
        authenticated: false, // Session is valid, but key is missing for full functionality
        error: AuthError.ENCRYPTION,
        errorMessage: "Your secure session is incomplete. Please log in again to restore full access.", // Updated message
        retryable: true // Re-login is the fix
      };
    }

    // Session is valid AND encryption key is present in memory
    return { authenticated: true, retryable: false };
    // Note: Removed the try/catch for SecurityError here as getSessionKey() doesn't access localStorage
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

// Redundant export removed
