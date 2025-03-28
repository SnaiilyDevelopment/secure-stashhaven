
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive, AlertTriangle } from 'lucide-react';
import { formatBytes } from '@/lib/storage/storageUtils';

interface StorageUsageDisplayProps {
  used: number;
  limit: number;
  fileCount: number;
}

const StorageUsageDisplay: React.FC<StorageUsageDisplayProps> = ({ 
  used, 
  limit,
  fileCount 
}) => {
  const usagePercentage = Math.min(100, (used / limit) * 100);
  const isNearLimit = usagePercentage > 85;
  
  return (
    <Card className="border-green-100 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg font-medium text-green-800">Storage Usage</CardTitle>
          </div>
          {isNearLimit && (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-700">{formatBytes(used)} used</span>
              <span className="text-green-700">{formatBytes(limit)} total</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className="h-2" 
              indicatorClassName={
                isNearLimit ? "bg-amber-500" : "bg-green-500"
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{fileCount} file{fileCount !== 1 ? 's' : ''} stored</span>
              <span>{usagePercentage.toFixed(1)}% used</span>
            </div>
          </div>
          
          {isNearLimit && (
            <div className="p-3 bg-amber-50 rounded-md text-sm text-amber-700 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>You're approaching your storage limit. Consider removing unused files.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageUsageDisplay;
