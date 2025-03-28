
export enum AuthError {
  EXPIRED_SESSION = 'EXPIRED_SESSION',
  MISSING_ENCRYPTION_KEY = 'MISSING_ENCRYPTION_KEY',
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  SECURITY = 'SECURITY',
  UNKNOWN = 'UNKNOWN'
}

export interface AuthStatus {
  authenticated: boolean;
  error?: AuthError;
  errorMessage?: string;
  retryable?: boolean;
}
