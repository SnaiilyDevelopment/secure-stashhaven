import { toast } from "@/components/ui/use-toast";
import { 
  deriveKeyFromPassword, 
  encryptTextSecure, 
  decryptTextSecure, 
  generateEncryptionKey, 
  zeroBuffer,
  arrayBufferToBase64
} from "../encryption";
import { supabase } from "@/integrations/supabase/client";

// Maximum number of login attempts before rate limiting
const MAX_LOGIN_ATTEMPTS = 5;
// Time window for tracking attempts (milliseconds)
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Store failed login attempts with timestamps
const loginAttempts = new Map<string, number[]>();

// Login a user with email/password
export const loginUser = async (email: string, password: string): Promise<boolean> => {
  try {
    console.log("Attempting login for user:", email);
    
    // Check for rate limiting
    const userAttempts = loginAttempts.get(email) || [];
    const now = Date.now();
    
    // Filter attempts to only include those within the time window
    const recentAttempts = userAttempts.filter(timestamp => (now - timestamp) < ATTEMPT_WINDOW_MS);
    
    if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
      // Calculate time remaining in rate limit
      const oldestAttempt = Math.min(...recentAttempts);
      const timeRemaining = Math.ceil((oldestAttempt + ATTEMPT_WINDOW_MS - now) / 1000 / 60);
      
      toast({
        title: "Too Many Login Attempts",
        description: `Please try again in ${timeRemaining} minute${timeRemaining !== 1 ? 's' : ''}.`,
        variant: "destructive"
      });
      
      return false;
    }
    
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // Handle authentication errors generically to prevent user enumeration
    if (error || !data.user) {
      console.error("Login error:", error);
      
      // Track this failed attempt
      recentAttempts.push(now);
      loginAttempts.set(email, recentAttempts);
      
      // Use generic error message that doesn't confirm account existence
      toast({
        title: "Login failed",
        description: "Invalid email or password.",
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
      
      // Sign out since the login is incomplete
      await supabase.auth.signOut();
      
      return false;
    }
    
    try {
      // Derive key from password with user's salt
      const passwordBytes = new TextEncoder().encode(password);
      const { key: derivedKey } = await deriveKeyFromPassword(password, salt);
      
      // Zero out password in memory
      zeroBuffer(passwordBytes.buffer);
      
      try {
        // Attempt to decrypt the master key (this will fail if password is wrong)
        const masterKeyBase64 = await decryptTextSecure(encryptedMasterKey, derivedKey);
        
        // Store encryption key
        localStorage.setItem('encryption_key', masterKeyBase64);
        
        // Clear login attempts on successful login
        loginAttempts.delete(email);
        
        console.log("Login successful, encryption key stored");
        return true;
      } catch (error) {
        // Decryption failed - wrong password but authentication succeeded
        console.error("Decryption failed:", error);
        
        // Track this failed attempt
        recentAttempts.push(now);
        loginAttempts.set(email, recentAttempts);
        
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
      console.error("Key derivation error:", error);
      
      // Track this failed attempt
      recentAttempts.push(now);
      loginAttempts.set(email, recentAttempts);
      
      // Force sign out
      await supabase.auth.signOut();
      
      toast({
        title: "Login failed",
        description: "An error occurred while processing your credentials.",
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

// Log out the current user with secure cleanup
export const logoutUser = async (): Promise<void> => {
  try {
    console.log("Logging out user");
    
    // Clear sensitive data
    localStorage.removeItem('encryption_key');
    
    // Sign out from Supabase
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

// Valid email regex for client-side validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password strength criteria
const PASSWORD_CRITERIA = {
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true
};

// Validate password strength
export const validatePasswordStrength = (password: string): { 
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_CRITERIA.minLength) {
    errors.push(`Password must be at least ${PASSWORD_CRITERIA.minLength} characters long`);
  }
  
  if (PASSWORD_CRITERIA.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (PASSWORD_CRITERIA.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (PASSWORD_CRITERIA.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (PASSWORD_CRITERIA.requireSpecial && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Register a new user with email/password
export const registerUser = async (email: string, password: string, confirmPassword: string): Promise<boolean> => {
  try {
    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return false;
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      toast({
        title: "Weak Password",
        description: passwordValidation.errors[0],
        variant: "destructive"
      });
      return false;
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "The passwords you entered don't match.",
        variant: "destructive"
      });
      return false;
    }
    
    // Generate a salt and derive a key from the password
    const passwordBytes = new TextEncoder().encode(password);
    const { key: derivedKey, salt } = await deriveKeyFromPassword(password);
    
    // Zero out password in memory
    zeroBuffer(passwordBytes.buffer);
    
    // Generate a random encryption master key
    const masterKeyBase64 = await generateEncryptionKey();
    
    // Encrypt the master key with the derived key
    const encryptedMasterKey = await encryptTextSecure(masterKeyBase64, derivedKey);
    
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

// Helper function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  const base64String = btoa(String.fromCharCode(...byteArray));
  return base64String;
}
