
import { toast } from "@/components/ui/use-toast";
import { deriveKeyFromPassword, encryptText, decryptText, generateEncryptionKey } from "./encryption";
import { supabase } from "@/integrations/supabase/client";

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  // For OAuth users (Google/GitHub), we need special handling
  if (session && (session.user?.app_metadata?.provider === 'github' || 
                 session.user?.app_metadata?.provider === 'google')) {
    // If we don't have an encryption key yet, generate one
    if (!localStorage.getItem('encryption_key')) {
      console.log("OAuth user authenticated but no encryption key, generating one");
      const encryptionKey = await generateEncryptionKey();
      localStorage.setItem('encryption_key', encryptionKey);
      return true;
    }
    return true;
  }
  
  // For email/password users, check both session and encryption key
  return !!session && !!localStorage.getItem('encryption_key');
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
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    // Store encryption key
    localStorage.setItem('encryption_key', masterKeyBase64);
    
    toast({
      title: "Registration successful",
      description: "Your secure vault has been created."
    });
    
    return true;
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

// Login a user with email/password
export const loginUser = async (email: string, password: string): Promise<boolean> => {
  try {
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error || !data.user) {
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
      
      toast({
        title: "Login successful",
        description: "Welcome back to your secure vault."
      });
      
      return true;
    } catch (error) {
      // Decryption failed - wrong password
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

// Log out the current user
export const logoutUser = async (): Promise<void> => {
  localStorage.removeItem('encryption_key');
  await supabase.auth.signOut();
};
