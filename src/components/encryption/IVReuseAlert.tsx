
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

// Default values from fileEncryption.ts
const DEFAULT_MAX_IV_COUNT = 1000;
const DEFAULT_IV_REMOVAL_PERIOD = 24 * 60 * 60 * 1000;

// Interface for IV metadata (matching the one in fileEncryption.ts)
interface IVMetadata {
  iv: string;
  timestamp: number;
  useCount: number;
}

interface IVReuseAlertProps {
  usedIVs: IVMetadata[];
  maxIVCount?: number;
  removalPeriod?: number;
}

export const IVReuseAlert: React.FC<IVReuseAlertProps> = ({ 
  usedIVs,
  maxIVCount = DEFAULT_MAX_IV_COUNT, 
  removalPeriod = DEFAULT_IV_REMOVAL_PERIOD 
}) => {
  // Only show if we have a lot of IVs tracked
  if (usedIVs.length < maxIVCount * 0.8) {
    return null;
  }
  
  return (
    <Alert variant="default" className="bg-yellow-50 border-yellow-200">
      <Shield className="h-4 w-4 text-yellow-500" />
      <AlertTitle>Security Notice</AlertTitle>
      <AlertDescription>
        A large number of encryption IVs are being tracked ({usedIVs.length}/{maxIVCount}).
        Some older IVs may be automatically removed for security purposes.
      </AlertDescription>
    </Alert>
  );
};

export default IVReuseAlert;
