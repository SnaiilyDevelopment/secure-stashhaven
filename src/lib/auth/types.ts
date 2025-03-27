
export enum AuthError {
  EXPIRED_SESSION = "EXPIRED_SESSION",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  MISSING_ENCRYPTION_KEY = "MISSING_ENCRYPTION_KEY",
  NETWORK = "NETWORK",
  SECURITY = "SECURITY",
  STORAGE = "STORAGE",
  TIMEOUT = "TIMEOUT",
  UNAUTHORIZED = "UNAUTHORIZED",
  UNKNOWN = "UNKNOWN"
}

export interface AuthStatus {
  authenticated: boolean;
  error?: AuthError;
  errorMessage?: string;
  retryable?: boolean;
}
