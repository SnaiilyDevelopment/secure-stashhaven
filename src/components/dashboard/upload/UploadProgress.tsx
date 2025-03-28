
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface UploadProgressProps {
  isUploading: boolean;
  progress: number;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ 
  isUploading, 
  progress 
}) => {
  if (!isUploading) return null;

  const getStageText = () => {
    if (progress < 40) return "Encrypting...";
    if (progress < 80) return "Uploading...";
    return "Finalizing...";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{getStageText()}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default UploadProgress;
