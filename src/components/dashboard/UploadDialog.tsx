import React, { useState, useEffect, useRef } from 'react';
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
import { Upload, Folder, FolderPlus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { uploadEncryptedFile } from '@/lib/storage/fileOperations';
import { ensureStorageBucket, validateFile, hasEnoughStorageSpace, getUserStorageUsage, getStorageQuota } from '@/lib/storage/storageUtils';
import { STORAGE_BUCKET_NAME } from '@/lib/storage/constants';
import { useDashboardData } from '@/hooks/useDashboardData';
import StorageQuotaDisplay from './upload/StorageQuotaDisplay';
import FilePreview from './upload/FilePreview';
import UploadProgress from './upload/UploadProgress';
import FolderSelector from './upload/FolderSelector';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
  onFolderCreate?: (name: string) => void;
}

const UploadDialog = ({ open, onOpenChange, onUploadComplete, onFolderCreate }: UploadDialogProps) => {
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [activeTab, setActiveTab] = useState("upload-file");
  const [isDragging, setIsDragging] = useState(false);
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
      setSelectedFile(null);
      setSelectedFiles([]);
      setUploadProgress(0);
      setUploadError(null);
      setIsUploading(false);
      setIsDragging(false);
    }
  }, [open]);
  
  const fetchStorageQuota = async () => {
    try {
      const usage = await getUserStorageUsage();
      const quota = await getStorageQuota();
      
      if (usage && quota) {
        const usageSize = typeof usage.totalSize === 'number' ? usage.totalSize : 0;
        const quotaSize = typeof quota === 'number' ? quota : 0;
        
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
  
  // File handling
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFiles([file]);
    }
  };
  
  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
      setSelectedFile(files[0]);
    }
  };
  
  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      setSelectedFile(files[0]);
      setActiveTab("upload-file");
    }
  };
  
  // Actions
  const handleUploadSingleFile = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
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
      
      await ensureStorageBucket(STORAGE_BUCKET_NAME);
      
      const filePath = await uploadEncryptedFile(
        selectedFile,
        STORAGE_BUCKET_NAME,
        selectedFolder,
        (progress) => setUploadProgress(progress)
      );
      
      if (filePath) {
        setTimeout(() => {
          onUploadComplete?.();
          onOpenChange(false);
          resetState();
        }, 1000);
      } else {
        setUploadError('Failed to upload file. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('An unexpected error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleUploadMultipleFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      await ensureStorageBucket(STORAGE_BUCKET_NAME);
      
      let successCount = 0;
      const totalFiles = selectedFiles.length;
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileProgress = i / totalFiles * 100;
        setUploadProgress(fileProgress);
        
        const fileValidation = validateFile(file);
        if (!fileValidation.valid) {
          continue;
        }
        
        const hasSpace = await hasEnoughStorageSpace(file.size);
        if (!hasSpace) {
          toast({
            title: "Upload failed",
            description: "You've reached your storage limit. Please delete some files before uploading more.",
            variant: "destructive"
          });
          break;
        }
        
        const filePath = await uploadEncryptedFile(
          file,
          STORAGE_BUCKET_NAME,
          selectedFolder,
          (progress) => {
            const segmentSize = 100 / totalFiles;
            const segmentStart = i * segmentSize;
            setUploadProgress(segmentStart + (progress * segmentSize / 100));
          }
        );
        
        if (filePath) {
          successCount++;
        }
      }
      
      setUploadProgress(100);
      
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${successCount} of ${totalFiles} files.`
      });
      
      setTimeout(() => {
        onUploadComplete?.();
        onOpenChange(false);
        resetState();
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('An unexpected error occurred during uploads.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Folder creation failed",
        description: "Please enter a folder name",
        variant: "destructive"
      });
      return;
    }
    
    if (folders.includes(newFolderName.trim())) {
      toast({
        title: "Folder creation failed",
        description: "A folder with this name already exists",
        variant: "destructive"
      });
      return;
    }
    
    onFolderCreate?.(newFolderName.trim());
    toast({
      title: "Folder created",
      description: `Folder "${newFolderName}" has been created.`
    });
    
    onOpenChange(false);
    resetState();
  };
  
  const resetState = () => {
    setSelectedFile(null);
    setSelectedFiles([]);
    setUploadProgress(0);
    setUploadError(null);
    setIsUploading(false);
    setSelectedFolder(null);
    setNewFolderName("");
  };
  
  // UI helpers
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const triggerFolderInput = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <DialogHeader>
          <DialogTitle>Upload & Manage Files</DialogTitle>
          <DialogDescription>
            Upload files or create folders in your secure vault. All files are end-to-end encrypted.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="upload-file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>File</span>
            </TabsTrigger>
            <TabsTrigger value="upload-folder" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              <span>Folder</span>
            </TabsTrigger>
            <TabsTrigger value="create-folder" className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4" />
              <span>New Folder</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload-file" className="mt-0">
            {selectedFiles.length > 0 ? (
              <div className="space-y-4">
                {selectedFiles.length === 1 ? (
                  <FilePreview file={selectedFile!} isValid={true} />
                ) : (
                  <div className="p-3 bg-green-50 rounded-md text-green-700">
                    <p className="font-medium">{selectedFiles.length} files selected</p>
                    <p className="text-xs mt-1">Total size: {formatBytes(selectedFiles.reduce((total, file) => total + file.size, 0))}</p>
                  </div>
                )}
                
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
                    onClick={selectedFiles.length === 1 ? handleUploadSingleFile : handleUploadMultipleFiles} 
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {selectedFiles.length > 1 ? `${selectedFiles.length} Files` : 'File'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <StorageQuotaDisplay storageQuota={storageQuota} />
                
                <div 
                  className={`flex justify-center ${isDragging ? 'bg-green-100 border-green-500' : ''}`}
                >
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="file-upload"
                      className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                        ${isDragging 
                          ? 'border-green-500 bg-green-100' 
                          : 'border-green-300 bg-green-50 hover:bg-green-100'}`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-green-500" />
                        <p className="mb-2 text-sm text-green-700">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-green-600">Any file type (max 50MB)</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        multiple
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upload-folder" className="mt-0">
            {selectedFiles.length > 0 ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 rounded-md text-green-700">
                  <p className="font-medium">{selectedFiles.length} files selected from folder</p>
                  <p className="text-xs mt-1">Total size: {formatBytes(selectedFiles.reduce((total, file) => total + file.size, 0))}</p>
                </div>
                
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
                    onClick={handleUploadMultipleFiles} 
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Folder Contents
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <StorageQuotaDisplay storageQuota={storageQuota} />
                
                <div className="flex justify-center">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="folder-upload"
                      className="flex flex-col items-center justify-center w-full h-44 border-2 border-green-300 border-dashed rounded-lg cursor-pointer bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Folder className="w-10 h-10 mb-3 text-green-500" />
                        <p className="mb-2 text-sm text-green-700">
                          <span className="font-semibold">Select a folder</span> to upload
                        </p>
                        <p className="text-xs text-green-600">Upload all files from a folder</p>
                      </div>
                      <input
                        ref={folderInputRef}
                        id="folder-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFolderChange}
                        {...{
                          webkitdirectory: "",
                          directory: "",
                          multiple: true
                        } as CustomInputHTMLAttributes}
                      />
                    </label>
                  </div>
                </div>
                
                <Button 
                  onClick={triggerFolderInput}
                  className="w-full"
                >
                  <Folder className="h-4 w-4 mr-2" />
                  Select Folder
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create-folder" className="mt-0 space-y-4">
            <div className="space-y-2">
              <label htmlFor="folder-name" className="text-sm font-medium text-gray-700">
                New Folder Name
              </label>
              <Input
                id="folder-name"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleCreateFolder}
              className="w-full"
              disabled={!newFolderName.trim()}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          </TabsContent>
        </Tabs>
        
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
