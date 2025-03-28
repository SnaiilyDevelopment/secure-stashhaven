
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
import { AlertCircle, Upload, Loader2, FileIcon, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadEncryptedFile } from '@/lib/storage/fileOperations';
import { ensureStorageBucket, getStorageQuota, formatBytes, validateFile } from '@/lib/storage/storageUtils';
import { STORAGE_BUCKET_NAME, ALLOWED_FILE_TYPES } from '@/lib/storage/constants';

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
  
  // Check for storage bucket and quota when dialog opens
  useEffect(() => {
    if (open) {
      // Ensure storage bucket exists
      ensureStorageBucket(STORAGE_BUCKET_NAME).catch(err => {
        console.error("Failed to ensure bucket exists:", err);
      });
      
      // Get storage quota
      getStorageQuota().then(quota => {
        setStorageQuota(quota);
      }).catch(err => {
        console.error("Failed to get storage quota:", err);
      });
    }
  }, [open]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Validate file type and size
      const validation = validateFile(file);
      setValidationStatus(validation);
      
      if (!validation.valid) {
        setError(validation.message || "Invalid file");
      } else {
        setError(null);
        
        // Check if file size exceeds available storage
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
    
    // Double check storage quota
    const quota = await getStorageQuota();
    if (selectedFile.size > quota.available) {
      setError(`Not enough storage space. You only have ${quota.formattedAvailable} available.`);
      return;
    }
    
    setIsUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Use uploadEncryptedFile to handle the upload
      const filePath = await uploadEncryptedFile(
        selectedFile, 
        STORAGE_BUCKET_NAME, 
        undefined, 
        (p) => setProgress(p)
      );
      
      if (!filePath) {
        throw new Error("Upload failed");
      }
      
      // Reset the form after successful upload
      setSelectedFile(null);
      
      // Close the dialog and refresh the file list
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
  
  // Get icon based on file type
  const getFileIcon = () => {
    if (!selectedFile) return null;
    
    if (selectedFile.type.includes('image/')) {
      return <FileIcon className="h-6 w-6 text-blue-500" />;
    } else if (selectedFile.type.includes('application/pdf') || 
               selectedFile.type.includes('text/')) {
      return <FileText className="h-6 w-6 text-green-500" />;
    } else {
      return <FileIcon className="h-6 w-6 text-gray-500" />;
    }
  };
  
  // List of supported file formats for display
  const getSupportedFormats = () => {
    const formats = Object.keys(ALLOWED_FILE_TYPES);
    const images = formats.filter(f => f.includes('image/')).length;
    const documents = formats.filter(f => f.includes('application/')).length;
    const text = formats.filter(f => f.includes('text/')).length;
    
    return `${images} image, ${documents} document, and ${text} text formats`;
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
        
        {storageQuota && (
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
        )}
        
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="file">Select file to upload</Label>
            <Input 
              id="file" 
              type="file" 
              onChange={handleFileChange} 
              disabled={isUploading}
              accept={Object.keys(ALLOWED_FILE_TYPES).join(',')}
            />
            <p className="text-xs text-muted-foreground">
              Supports {getSupportedFormats()}
            </p>
          </div>
          
          {selectedFile && validationStatus?.valid && (
            <div className="flex items-center gap-2 text-sm p-3 bg-green-50 rounded-md text-green-700">
              {getFileIcon()}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{selectedFile.name}</div>
                <div className="text-xs">{formatBytes(selectedFile.size)}</div>
              </div>
            </div>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {progress < 40 
                    ? "Encrypting..." 
                    : progress < 80 
                      ? "Uploading..." 
                      : "Finalizing..."}
                </span>
                <span>{Math.round(progress)}%</span>
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
