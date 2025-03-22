
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Upload, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadFile } from '@/lib/storage';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

const UploadDialog: React.FC<UploadDialogProps> = ({ 
  open, 
  onOpenChange,
  onUploadComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }
    
    setIsUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Use the progress callback to update the progress state
      await uploadFile(selectedFile, (progressEvent) => {
        const newProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setProgress(newProgress);
      });
      
      // Reset the form after successful upload
      setSelectedFile(null);
      
      // Close the dialog and refresh the file list
      onOpenChange(false);
      onUploadComplete();
      
    } catch (err) {
      console.error("File upload error:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!isUploading) {
        onOpenChange(value);
        if (!value) {
          setSelectedFile(null);
          setError(null);
        }
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Encrypted File</DialogTitle>
          <DialogDescription>
            Files are encrypted before being sent to the server.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="file">File</Label>
            <Input 
              id="file" 
              type="file" 
              onChange={handleFileChange} 
              disabled={isUploading}
            />
          </div>
          
          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Encrypting and uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button 
              type="button" 
              variant="secondary" 
              disabled={isUploading}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
