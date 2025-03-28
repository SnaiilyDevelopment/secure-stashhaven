
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface EmptyFileListProps {
  message: string;
}

const EmptyFileList: React.FC<EmptyFileListProps> = ({ message }) => {
  return (
    <Card className="border-green-100 bg-white/80 backdrop-blur-sm">
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        <AlertCircle className="h-10 w-10 text-green-400 mb-3" />
        <h3 className="text-lg font-medium text-green-800">No files found</h3>
        <p className="text-sm text-green-700/70 max-w-md mt-1">
          {message}
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyFileList;
