
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { uploadEncryptedFile } from '@/lib/storage/fileOperations';
import { ensureStorageBucket, validateFile, hasEnoughStorageSpace, getUserStorageUsage, getStorageQuota } from '@/lib/storage/storageUtils';
import { STORAGE_BUCKET_NAME } from '@/lib/storage/constants';
import { useDashboardData } from '@/hooks/useDashboardData';
import StorageQuotaDisplay from './upload/StorageQuotaDisplay';
import FilePreview from './upload/FilePreview';
import UploadProgress from './upload/UploadProgress';
import FolderSelector from './upload/FolderSelector';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

const UploadDialog = ({ open, onOpenChange, onUploadComplete }: UploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [storageQuota, setStorageQuota] = useState<{
    percentUsed: number;
    formattedUsed: string;
    formattedAvailable: string;
  } | null>(null);
  const { folders } = useDashboardData(false);
  
  // Fetch storage quota data when dialog opens
  useEffect(() => {
    if (open) {
      fetchStorageQuota();
    }
  }, [open]);
  
  const fetchStorageQuota = async () => {
    try {
      const usage = await getUserStorageUsage();
      const quota = await getStorageQuota();
      
      if (usage && quota) {
        // Ensure both values are numbers before performing arithmetic
        const usageSize = typeof usage.totalSize === 'number' ? usage.totalSize : 0;
        const quotaSize = typeof quota === 'number' ? quota : 0;
        
        // Calculate percentage and ensure it's a number
        const percentUsed = quotaSize > 0 ? (usageSize / quotaSize) * 100 : 0;
        const formattedUsed = formatBytes(usageSize);
        const formattedAvailable = formatBytes(quotaSize - usageSize);
        
        setStorageQuota({
          percentUsed,
          formattedUsed,
          formattedAvailable
        });
      }
    } catch (error) {
      console.error("Error fetching storage quota:", error);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Validate file before upload
      const fileValidation = validateFile(selectedFile);
      if (!fileValidation.valid) {
        toast({
          title: "Upload failed",
          description: fileValidation.message,
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }
      
      // Check storage space
      const hasSpace = await hasEnoughStorageSpace(selectedFile.size);
      if (!hasSpace) {
        toast({
          title: "Upload failed",
          description: "You've reached your storage limit. Please delete some files before uploading more.",
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }
      
      // Create bucket if it doesn't exist
      await ensureStorageBucket(STORAGE_BUCKET_NAME);
      
      // Upload the file with folder information
      const filePath = await uploadEncryptedFile(
        selectedFile,
        STORAGE_BUCKET_NAME,
        selectedFolder,
        (progress) => setUploadProgress(progress)
      );
      
      if (filePath) {
        // Upload successful
        setTimeout(() => {
          onUploadComplete?.();
          onOpenChange(false);
          resetState();
        }, 1000);
      } else {
        // Upload failed
        setUploadError('Failed to upload file. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('An unexpected error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const resetState = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setIsUploading(false);
    setSelectedFolder(null);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a file to your secure vault. Files are end-to-end encrypted.
          </DialogDescription>
        </DialogHeader>
        
        {selectedFile ? (
          <div className="space-y-4">
            <FilePreview
              file={selectedFile}
              isValid={true}
            />
            
            {/* Add folder selector */}
            <FolderSelector
              folders={folders}
              selectedFolder={selectedFolder}
              onFolderChange={setSelectedFolder}
            />
            
            {uploadError && (
              <div className="text-red-500 text-sm mt-2">
                {uploadError}
              </div>
            )}
            
            {isUploading ? (
              <UploadProgress 
                isUploading={isUploading} 
                progress={uploadProgress} 
              />
            ) : (
              <Button 
                onClick={handleUpload} 
                className="w-full"
              >
                Upload File
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <StorageQuotaDisplay storageQuota={storageQuota} />
            
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-44 border-2 border-green-300 border-dashed rounded-lg cursor-pointer bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-green-500" />
                    <p className="mb-2 text-sm text-green-700">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-green-600">Any file type (max 50MB)</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
