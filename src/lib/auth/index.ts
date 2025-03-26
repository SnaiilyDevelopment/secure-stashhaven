
// Re-export auth-related types and enums
export enum AuthError {
  NETWORK = 'network',
  CREDENTIALS = 'credentials',
  TOKEN = 'token',
  SESSION = 'session',
  SECURITY = 'security',
  UNKNOWN = 'unknown'
}

// Export auth functions from userAuth
export { 
  loginUser,
  logoutUser,
  registerUser,
  signInWithProvider,
  getCurrentUserEncryptionKey,
  validatePasswordStrength
} from './userAuth';

// Export key store functions
export {
  setSessionKey,
  getSessionKey,
  clearSessionKey
} from './keyStore';

// Auth helper functions
export const isAuthenticated = async (): Promise<{
  authenticated: boolean;
  error?: AuthError;
  errorMessage?: string;
}> => {
  try {
    // Simple check if there's a session key in memory
    const { getSessionKey } = require('./keyStore');
    const hasSessionKey = !!getSessionKey();
    
    return {
      authenticated: hasSessionKey,
      error: hasSessionKey ? undefined : AuthError.SESSION,
      errorMessage: hasSessionKey ? undefined : 'No active session'
    };
  } catch (error) {
    return {
      authenticated: false,
      error: AuthError.UNKNOWN,
      errorMessage: error instanceof Error ? error.message : 'Unknown authentication error'
    };
  }
};

export const handleAuthError = (authStatus: {
  error?: AuthError;
  errorMessage?: string;
}): void => {
  if (!authStatus.error) return;
  
  console.error(`Auth error (${authStatus.error}):`, authStatus.errorMessage);
  
  // Additional handling can be added here if needed
};
