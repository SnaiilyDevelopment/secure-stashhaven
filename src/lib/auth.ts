// Define the error types as an enum
export enum AuthError {
  UNKNOWN = 'unknown',
  INVALID_CREDENTIALS = 'invalid_credentials',
  UNAUTHORIZED = 'unauthorized',
  EXPIRED_SESSION = 'expired_session',
  INVALID_TOKEN = 'invalid_token',
  SECURITY = 'security_error',
  USER_NOT_FOUND = 'user_not_found',
  EMAIL_IN_USE = 'email_in_use',
  WEAK_PASSWORD = 'weak_password',
  RATE_LIMITED = 'rate_limited',
  NETWORK = 'network_error',
  SERVER = 'server_error'
}

// Function to check if a user is authenticated
export const isAuthenticated = async () => {
  // Check if session exists
  const { data } = await supabase.auth.getSession();
  
  if (data?.session) {
    return { 
      authenticated: true, 
      error: null,
      errorMessage: null
    };
  }
  
  return { 
    authenticated: false, 
    error: AuthError.UNAUTHORIZED,
    errorMessage: "User not authenticated"
  };
};

// Function to handle authentication errors
export const handleAuthError = (authStatus: { error: AuthError | null, errorMessage?: string | null }) => {
  if (!authStatus.error) return;
  
  console.error("Auth error:", authStatus.error, authStatus.errorMessage);
  
  // Handle different types of errors
  switch (authStatus.error) {
    case AuthError.SECURITY:
      // Security errors like CORS issues
      console.warn("Browser security restrictions may be preventing authentication");
      break;
    case AuthError.EXPIRED_SESSION:
      // Session expired
      console.log("Session expired, clearing stale data");
      localStorage.removeItem('encryption_key');
      break;
    case AuthError.NETWORK:
      // Network errors
      console.warn("Network error detected, check connectivity");
      break;
    default:
      // Other errors
      console.error("Unhandled auth error:", authStatus.error);
  }
};

// Re-export the auth module
export * from './auth/index';
