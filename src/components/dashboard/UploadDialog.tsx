
import React, { useState, useEffect } from 'react';
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
import { ensureStorageBucket } from '@/lib/storage/storageUtils';
import { getCurrentUser } from '@/lib/auth';
import { toast } from '@/components/ui/use-toast';

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
  const BUCKET_NAME = 'secure-files';
  
  // Ensure the storage bucket exists when dialog opens
  useEffect(() => {
    if (open) {
      ensureStorageBucket(BUCKET_NAME).catch(err => {
        console.error("Failed to ensure bucket exists:", err);
      });
    }
  }, [open]);
  
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
      // Simulate progress during encryption and upload
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (prev < 90 ? 5 : 0);
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);
      
      // Get the current user
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error("You must be logged in to upload files");
      }
      
      // Upload the file
      const fileMetadata = await uploadFile(selectedFile, currentUser.id);
      
      // Update progress to 100% when upload is complete
      clearInterval(progressInterval);
      setProgress(100);
      
      if (!fileMetadata) {
        throw new Error("Upload failed");
      }
      
      // Reset the form after successful upload
      setSelectedFile(null);
      
      // Show success message
      toast({
        title: "File uploaded",
        description: `${selectedFile.name} has been encrypted and uploaded.`
      });
      
      // Close the dialog and refresh the file list
      setTimeout(() => {
        onOpenChange(false);
        onUploadComplete();
      }, 500);
      
    } catch (err: any) {
      console.error("File upload error:", err);
      setError(err.message || "Failed to upload file. Please try again.");
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
