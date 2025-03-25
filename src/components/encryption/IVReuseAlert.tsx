
import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface IVReuseAlertProps {
  filePath: string;
  onAcknowledge: () => void;
}

// IV Reuse Alert component
export const IVReuseAlert: React.FC<IVReuseAlertProps> = ({ 
  filePath, 
  onAcknowledge 
}) => {
  const [dismissed, setDismissed] = useState(false);

  // Only show the alert for 10 minutes maximum
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDismissed(true);
      onAcknowledge();
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearTimeout(timeout);
  }, [onAcknowledge]);

  if (dismissed) return null;

  return (
    <Alert variant="destructive" className="mb-4 border-amber-500 bg-amber-50 text-amber-900">
      <AlertTriangle className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-800">Security Warning</AlertTitle>
      <AlertDescription className="text-amber-700">
        <p className="mb-2">
          A potential security issue was detected with file: <strong>{filePath.split('/').pop()}</strong>
        </p>
        <p className="mb-2">
          The file was encrypted using a previously used initialization vector (IV), which could compromise security.
          We recommend re-uploading this file to ensure proper encryption.
        </p>
        <Button 
          variant="outline" 
          className="mt-2 border-amber-500 text-amber-700 hover:bg-amber-100"
          onClick={() => {
            setDismissed(true);
            onAcknowledge();
          }}
        >
          Acknowledge
        </Button>
      </AlertDescription>
    </Alert>
  );
};
