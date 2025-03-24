
import { toast } from "@/components/ui/use-toast";
import { deriveKeyFromPassword, encryptText, decryptText, generateEncryptionKey } from "../encryption";
import { supabase } from "@/integrations/supabase/client";

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    console.log("Checking authentication status in isAuthenticated()");
    
    // Check for session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session check error:", error);
      return false;
    }
    
    if (!session) {
      console.log("No session found, user not authenticated");
      return false;
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
          return false;
        }
      }
      
      console.log("OAuth user authenticated with encryption key");
      return true;
    }
    
    // For email/password users, check both session and encryption key
    const hasEncryptionKey = !!localStorage.getItem('encryption_key');
    console.log("Email user authenticated, encryption key present:", hasEncryptionKey);
    
    if (!hasEncryptionKey) {
      console.log("No encryption key found, user not fully authenticated");
      // Clear the session if we don't have an encryption key
      await supabase.auth.signOut();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Authentication check error:", error);
    return false;
  }
};

// Export the rest of the authentication functions
export { registerUser, loginUser, signInWithProvider, getCurrentUserEncryptionKey, logoutUser } from './userAuth';
