
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthErrorAlertProps {
  error: string | null;
  onRetry: () => void;
}

const AuthErrorAlert: React.FC<AuthErrorAlertProps> = ({ error, onRetry }) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="ml-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default AuthErrorAlert;
