
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const FileListSkeleton: React.FC = () => {
  return (
    <Card className="border-green-100 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center py-2 gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileListSkeleton;
