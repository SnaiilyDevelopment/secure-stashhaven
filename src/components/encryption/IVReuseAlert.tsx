
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { getIVUsageStats } from '@/lib/encryption/fileEncryption';

// Default values from fileEncryption.ts
const DEFAULT_MAX_IV_COUNT = 1000;
const DEFAULT_IV_REMOVAL_PERIOD = 24 * 60 * 60 * 1000;

interface IVReuseAlertProps {
  maxIVCount?: number;
  removalPeriod?: number;
  updateInterval?: number;
}

export const IVReuseAlert: React.FC<IVReuseAlertProps> = ({ 
  maxIVCount = DEFAULT_MAX_IV_COUNT, 
  removalPeriod = DEFAULT_IV_REMOVAL_PERIOD,
  updateInterval = 10000 // Update every 10 seconds by default
}) => {
  const [usageStats, setUsageStats] = useState(() => getIVUsageStats());
  
  useEffect(() => {
    // Initial update
    setUsageStats(getIVUsageStats());
    
    // Set up periodic updates
    const intervalId = setInterval(() => {
      setUsageStats(getIVUsageStats());
    }, updateInterval);
    
    return () => clearInterval(intervalId);
  }, [updateInterval]);
  
  // Only show if we have a lot of IVs tracked (>80% of max)
  if (usageStats.count < usageStats.maxCount * 0.8) {
    return null;
  }
  
  return (
    <Alert variant="default" className="bg-yellow-50 border-yellow-200">
      <Shield className="h-4 w-4 text-yellow-500" />
      <AlertTitle>Security Notice</AlertTitle>
      <AlertDescription>
        A large number of encryption IVs are being tracked ({usageStats.count}/{usageStats.maxCount}).
        Some older IVs may be automatically removed for security purposes.
      </AlertDescription>
    </Alert>
  );
};

export default IVReuseAlert;
