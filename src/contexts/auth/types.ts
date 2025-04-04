
// Auth-related types
import { AuthError, AuthStatus } from "@/lib/auth/types";

export interface AuthContextType {
  isReady: boolean;
  isLoggedIn: boolean;
  isCheckingAuth: boolean;
  authStatus: AuthStatus | null;
  handleRetry: () => Promise<void>;
}
