
import { toast } from "@/components/ui/use-toast";
import { deriveKeyFromPassword, encryptText, decryptText, generateEncryptionKey } from "../encryption";
import { supabase } from "@/integrations/supabase/client";

// Authentication errors that can be shown to users
export enum AuthError {
  CONNECTION = "connection_error",
  SESSION = "session_error",
  ENCRYPTION = "encryption_error",
  UNKNOWN = "unknown_error"
}

// Check if user is authenticated
export const isAuthenticated = async (): Promise<{ authenticated: boolean; error?: AuthError }> => {
  try {
    console.log("Checking authentication status in isAuthenticated()");
    
    // Check for session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session check error:", error);
      
      // Determine error type for better error handling
      if (error.message?.toLowerCase().includes('network') || 
          error.message?.toLowerCase().includes('connection') ||
          error.message?.toLowerCase().includes('failed to fetch')) {
        return { authenticated: false, error: AuthError.CONNECTION };
      }
      
      return { authenticated: false, error: AuthError.SESSION };
    }
    
    if (!session) {
      console.log("No session found, user not authenticated");
      return { authenticated: false };
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
          return { authenticated: false, error: AuthError.ENCRYPTION };
        }
      }
      
      console.log("OAuth user authenticated with encryption key");
      return { authenticated: true };
    }
    
    // For email/password users, check both session and encryption key
    const hasEncryptionKey = !!localStorage.getItem('encryption_key');
    console.log("Email user authenticated, encryption key present:", hasEncryptionKey);
    
    if (!hasEncryptionKey) {
      console.log("No encryption key found, user not fully authenticated");
      // Clear the session if we don't have an encryption key
      await supabase.auth.signOut();
      return { authenticated: false, error: AuthError.ENCRYPTION };
    }
    
    return { authenticated: true };
  } catch (error) {
    console.error("Authentication check error:", error);
    return { authenticated: false, error: AuthError.UNKNOWN };
  }
};

// Helper function to handle auth errors and provide user feedback
export const handleAuthError = (error?: AuthError): void => {
  if (!error) return;
  
  switch (error) {
    case AuthError.CONNECTION:
      toast({
        title: "Connection Error",
        description: "Unable to connect to the authentication service. Please check your internet connection and try again.",
        variant: "destructive"
      });
      break;
    
    case AuthError.SESSION:
      toast({
        title: "Session Error",
        description: "There was a problem with your login session. Please try logging in again.",
        variant: "destructive"
      });
      break;
    
    case AuthError.ENCRYPTION:
      toast({
        title: "Security Error",
        description: "There was a problem with your encryption key. Please log in again to restore secure access.",
        variant: "destructive"
      });
      break;
    
    case AuthError.UNKNOWN:
    default:
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred. Please try logging in again.",
        variant: "destructive"
      });
      break;
  }
};

// Export the rest of the authentication functions
export { registerUser, loginUser, signInWithProvider, getCurrentUserEncryptionKey, logoutUser } from './userAuth';
