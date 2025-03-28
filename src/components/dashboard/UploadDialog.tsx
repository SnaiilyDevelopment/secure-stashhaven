
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
import { AlertCircle, Upload, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadEncryptedFile } from '@/lib/storage/fileOperations';
import { ensureStorageBucket, getStorageQuota, validateFile } from '@/lib/storage/storageUtils';
import { STORAGE_BUCKET_NAME } from '@/lib/storage/constants';
import FilePreview from './upload/FilePreview';
import UploadProgress from './upload/UploadProgress';
import StorageQuotaDisplay from './upload/StorageQuotaDisplay';

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
  const [validationStatus, setValidationStatus] = useState<{
    valid: boolean;
    message?: string;
  } | null>(null);
  const [storageQuota, setStorageQuota] = useState<{
    used: number;
    limit: number;
    available: number;
    percentUsed: number;
    formattedUsed: string;
    formattedLimit: string;
    formattedAvailable: string;
  } | null>(null);
  
  useEffect(() => {
    if (open) {
      // Only try to ensure bucket exists if the dialog is open
      const setupBucket = async () => {
        try {
          await ensureStorageBucket(STORAGE_BUCKET_NAME);
        } catch (err) {
          console.error("Failed to ensure bucket exists:", err);
          // Don't show an error to the user, just log it
        }
      };
      
      // Get storage quota information
      const getQuota = async () => {
        try {
          const quota = await getStorageQuota();
          setStorageQuota(quota);
        } catch (err) {
          console.error("Failed to get storage quota:", err);
        }
      };
      
      // Run both operations
      setupBucket();
      getQuota();
    }
  }, [open]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const validation = validateFile(file);
      setValidationStatus(validation);
      
      if (!validation.valid) {
        setError(validation.message || "Invalid file");
      } else {
        setError(null);
        
        if (storageQuota && file.size > storageQuota.available) {
          setError(`Not enough storage space. You only have ${storageQuota.formattedAvailable} available.`);
        }
      }
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }
    
    const quota = await getStorageQuota();
    if (selectedFile.size > quota.available) {
      setError(`Not enough storage space. You only have ${quota.formattedAvailable} available.`);
      return;
    }
    
    setIsUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      const filePath = await uploadEncryptedFile(
        selectedFile, 
        STORAGE_BUCKET_NAME, 
        undefined, 
        (p) => setProgress(p)
      );
      
      if (!filePath) {
        throw new Error("Upload failed");
      }
      
      setSelectedFile(null);
      
      setTimeout(() => {
        onOpenChange(false);
        onUploadComplete();
      }, 500);
    } catch (err) {
      console.error("File upload error:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  
  const getSupportedFormats = () => {
    return "All file types are supported";
  };
  
  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!isUploading) {
        onOpenChange(value);
        if (!value) {
          setSelectedFile(null);
          setError(null);
          setValidationStatus(null);
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
        
        <StorageQuotaDisplay storageQuota={storageQuota} />
        
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="file">Select file to upload</Label>
            <Input 
              id="file" 
              type="file" 
              onChange={handleFileChange} 
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              {getSupportedFormats()}
            </p>
          </div>
          
          {selectedFile && validationStatus?.valid && (
            <FilePreview 
              file={selectedFile} 
              isValid={validationStatus.valid} 
            />
          )}
          
          <UploadProgress 
            isUploading={isUploading} 
            progress={progress} 
          />
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
            disabled={!selectedFile || !!error || isUploading || !validationStatus?.valid}
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
