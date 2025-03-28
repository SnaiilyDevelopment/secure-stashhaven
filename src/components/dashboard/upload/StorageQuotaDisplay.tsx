
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface StorageQuotaDisplayProps {
  storageQuota: {
    percentUsed: number;
    formattedUsed: string;
    formattedAvailable: string;
  } | null;
}

const StorageQuotaDisplay: React.FC<StorageQuotaDisplayProps> = ({ 
  storageQuota 
}) => {
  if (!storageQuota) return null;

  return (
    <div className="space-y-2 mb-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Storage used: {storageQuota.formattedUsed}</span>
        <span>Available: {storageQuota.formattedAvailable}</span>
      </div>
      <Progress 
        value={storageQuota.percentUsed} 
        className="h-1.5" 
        indicatorClassName={
          storageQuota.percentUsed > 85 
            ? "bg-amber-500" 
            : storageQuota.percentUsed > 95 
              ? "bg-red-500" 
              : undefined
        }
      />
    </div>
  );
};

export default StorageQuotaDisplay;
