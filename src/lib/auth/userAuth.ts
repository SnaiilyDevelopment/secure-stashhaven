
import { toast } from "@/components/ui/use-toast";
import { deriveKeyFromPassword, encryptText, decryptText, generateEncryptionKey } from "../encryption";
import { supabase } from "@/integrations/supabase/client";
import { AuthError, AuthStatus } from "./types";

// Login a user with email/password
export const loginUser = async (email: string, password: string): Promise<boolean> => {
  try {
    console.log("Attempting login for user:", email);
    
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error || !data.user) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error?.message || "Invalid email or password.",
        variant: "destructive"
      });
      return false;
    }
    
    const salt = data.user.user_metadata.salt;
    const encryptedMasterKey = data.user.user_metadata.encryptedMasterKey;
    
    if (!salt || !encryptedMasterKey) {
      console.error("Missing user metadata:", { salt, encryptedMasterKey });
      toast({
        title: "Login failed",
        description: "User data is corrupted. Please contact support.",
        variant: "destructive"
      });
      return false;
    }
    
    // Derive key from password with user's salt
    const { key: derivedKey } = await deriveKeyFromPassword(password, salt);
    
    try {
      // Attempt to decrypt the master key (this will fail if password is wrong)
      const masterKeyBase64 = await decryptText(encryptedMasterKey, derivedKey);
      
      // Store encryption key
      localStorage.setItem('encryption_key', masterKeyBase64);
      
      console.log("Login successful, encryption key stored");
      return true;
    } catch (error) {
      // Decryption failed - wrong password
      console.error("Decryption failed:", error);
      
      // Force sign out since decryption failed
      await supabase.auth.signOut();
      
      toast({
        title: "Login failed",
        description: "Invalid email or password.",
        variant: "destructive"
      });
      return false;
    }
  } catch (error) {
    console.error("Login error:", error);
    toast({
      title: "Login failed",
      description: "An unexpected error occurred.",
      variant: "destructive"
    });
    return false;
  }
};

// Log out the current user
export const logoutUser = async (): Promise<void> => {
  try {
    console.log("Logging out user");
    localStorage.removeItem('encryption_key');
    await supabase.auth.signOut();
    console.log("User logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    toast({
      title: "Logout error",
      description: "An error occurred during logout.",
      variant: "destructive"
    });
  }
};

// Register a new user with email/password
export const registerUser = async (email: string, password: string): Promise<boolean> => {
  try {
    // Generate a salt and derive a key from the password
    const { key: derivedKey, salt } = await deriveKeyFromPassword(password);
    
    // Generate a random encryption master key
    const masterKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Export the master key
    const exportedMasterKey = await window.crypto.subtle.exportKey('raw', masterKey);
    const masterKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedMasterKey)));
    
    // Encrypt the master key with the derived key
    const encryptedMasterKey = await encryptText(masterKeyBase64, derivedKey);
    
    // Fix: Add error handling for 429 Too Many Requests
    try {
      // Sign up with Supabase
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            salt,
            encryptedMasterKey
          }
        }
      });
      
      if (error) {
        // Check if it's a rate limit error
        if (error.status === 429) {
          toast({
            title: "Too many registration attempts",
            description: "Please wait a moment before trying again.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Registration failed",
            description: error.message,
            variant: "destructive"
          });
        }
        return false;
      }
      
      // Store encryption key
      localStorage.setItem('encryption_key', masterKeyBase64);
      
      toast({
        title: "Registration successful",
        description: "Your secure vault has been created."
      });
      
      return true;
    } catch (supabaseError: any) {
      // Handle rate limiting or other network errors
      console.error("Supabase registration error:", supabaseError);
      
      if (supabaseError.status === 429) {
        toast({
          title: "Too many registration attempts",
          description: "Please wait a moment before trying again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Registration failed",
          description: "Network error. Please try again later.",
          variant: "destructive"
        });
      }
      return false;
    }
  } catch (error) {
    console.error("Registration error:", error);
    toast({
      title: "Registration failed",
      description: "An unexpected error occurred.",
      variant: "destructive"
    });
    return false;
  }
};

// Sign in with OAuth provider (Google, GitHub, etc.)
export const signInWithProvider = async (provider: 'google' | 'github'): Promise<boolean> => {
  try {
    // Sign in with OAuth provider
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("OAuth login error:", error);
    toast({
      title: "Login failed",
      description: "An unexpected error occurred.",
      variant: "destructive"
    });
    return false;
  }
};

// Get current user's encryption key
export const getCurrentUserEncryptionKey = (): string | null => {
  return localStorage.getItem('encryption_key');
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<AuthStatus> => {
  try {
    console.log("Checking authentication status...");
    
    // Check session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session check error:", error);
      return {
        authenticated: false,
        error: AuthError.NETWORK,
        errorMessage: error.message,
        retryable: true
      };
    }
    
    if (!data.session) {
      console.log("No active session found");
      return { authenticated: false };
    }
    
    // Check if encryption key exists
    const encryptionKey = localStorage.getItem('encryption_key');
    if (!encryptionKey) {
      console.error("No encryption key found");
      return {
        authenticated: false,
        error: AuthError.MISSING_ENCRYPTION_KEY,
        errorMessage: "No encryption key found. Please log in again.",
        retryable: false
      };
    }
    
    console.log("User is authenticated");
    return { authenticated: true };
  } catch (error) {
    console.error("Authentication check error:", error);
    
    // Determine error type and fix the type comparison
    let errorType = AuthError.UNKNOWN;
    
    if (error instanceof Error) {
      if (error.message.includes('network')) {
        errorType = AuthError.NETWORK;
      } else if (error.message.includes('timeout')) {
        errorType = AuthError.TIMEOUT;
      }
    }
      
    return {
      authenticated: false,
      error: errorType,
      errorMessage: error instanceof Error ? error.message : String(error),
      // Fix the comparison by checking each value individually
      retryable: errorType === AuthError.NETWORK || errorType === AuthError.TIMEOUT
    };
  }
};

// Handle authentication errors
export const handleAuthError = (status: AuthStatus): void => {
  if (!status.error || !status.errorMessage) return;
  
  switch (status.error) {
    case AuthError.NETWORK:
      toast({
        title: "Network Error",
        description: "Could not connect to authentication service. Please check your connection.",
        variant: "destructive"
      });
      break;
    case AuthError.TIMEOUT:
      toast({
        title: "Request Timeout",
        description: "The authentication request timed out. Please try again.",
        variant: "destructive"
      });
      break;
    case AuthError.EXPIRED_SESSION:
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive"
      });
      // Redirect to login page could be handled here or by the component
      break;
    case AuthError.MISSING_ENCRYPTION_KEY:
      toast({
        title: "Authentication Error",
        description: "Your encryption key is missing. Please log in again to restore secure access.",
        variant: "destructive"
      });
      break;
    default:
      toast({
        title: "Authentication Error",
        description: status.errorMessage || "An unknown error occurred.",
        variant: "destructive"
      });
  }
};
