
import { toast } from "@/components/ui/use-toast";
import { deriveKeyFromPassword, encryptText, decryptText } from "./encryption";

// Mock user database (would be replaced with actual API calls)
const USERS_KEY = 'secure_vault_users';

interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  encryptedMasterKey: string;
  createdAt: string;
}

// Register a new user
export const registerUser = async (email: string, password: string): Promise<boolean> => {
  try {
    // Check if user already exists
    const existingUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (existingUsers.some((user: User) => user.email === email)) {
      toast({
        title: "Registration failed",
        description: "This email is already registered.",
        variant: "destructive"
      });
      return false;
    }

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
    
    // Create user object
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      passwordHash: derivedKey, // In a real app, we'd hash the password separately
      salt,
      encryptedMasterKey,
      createdAt: new Date().toISOString()
    };
    
    // Save user data (would be an API call in a real app)
    const updatedUsers = [...existingUsers, newUser];
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    
    // Store auth token and encryption key
    localStorage.setItem('auth_token', btoa(newUser.id));
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

// Login a user
export const loginUser = async (email: string, password: string): Promise<boolean> => {
  try {
    // Find user
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.email === email);
    
    if (!user) {
      toast({
        title: "Login failed",
        description: "Invalid email or password.",
        variant: "destructive"
      });
      return false;
    }
    
    // Derive key from password with user's salt
    const { key: derivedKey } = await deriveKeyFromPassword(password, user.salt);
    
    try {
      // Attempt to decrypt the master key (this will fail if password is wrong)
      const masterKeyBase64 = await decryptText(user.encryptedMasterKey, derivedKey);
      
      // Store auth token and encryption key
      localStorage.setItem('auth_token', btoa(user.id));
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

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token') && !!localStorage.getItem('encryption_key');
};

// Get current user's encryption key
export const getCurrentUserEncryptionKey = (): string | null => {
  return localStorage.getItem('encryption_key');
};

// Log out the current user
export const logoutUser = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('encryption_key');
};
