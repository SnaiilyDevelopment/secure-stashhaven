
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  File, 
  ImageIcon, 
  FileText, 
  FileArchive, 
  FilePlus, 
  FolderPlus, 
  Search, 
  MoreHorizontal, 
  Download, 
  Trash2, 
  Lock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/components/ui/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { isAuthenticated, getCurrentUserEncryptionKey } from '@/lib/auth';
import { encryptFile, decryptFile } from '@/lib/encryption';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  encryptedType: string;
  dateAdded: string;
  encrypted: boolean;
}

const Dashboard = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    // Load files from localStorage
    const loadFiles = () => {
      try {
        const savedFiles = localStorage.getItem('encrypted_files');
        if (savedFiles) {
          setFiles(JSON.parse(savedFiles));
        }
      } catch (error) {
        console.error('Error loading files:', error);
      }
    };
    
    loadFiles();
  }, [navigate]);
  
  // Save files to localStorage
  const saveFiles = (updatedFiles: FileItem[]) => {
    localStorage.setItem('encrypted_files', JSON.stringify(updatedFiles));
    setFiles(updatedFiles);
  };
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    
    const encryptionKey = getCurrentUserEncryptionKey();
    if (!encryptionKey) {
      toast({
        title: "Authentication error",
        description: "Please log in again to access your encryption key.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const newFiles: FileItem[] = [...files];
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        // Encrypt the file
        const encryptedBlob = await encryptFile(file, encryptionKey);
        
        // Store the encrypted file
        const fileReader = new FileReader();
        
        const readFilePromise = new Promise<string>((resolve, reject) => {
          fileReader.onload = () => resolve(fileReader.result as string);
          fileReader.onerror = reject;
        });
        
        fileReader.readAsDataURL(encryptedBlob);
        const encryptedFileData = await readFilePromise;
        
        // Save the file metadata and encrypted content
        const newFile: FileItem = {
          id: crypto.randomUUID(),
          name: file.name,
          size: encryptedBlob.size,
          type: file.type,
          encryptedType: encryptedBlob.type,
          dateAdded: new Date().toISOString(),
          encrypted: true
        };
        
        // Store the encrypted file data
        localStorage.setItem(`file_${newFile.id}`, encryptedFileData);
        
        newFiles.push(newFile);
      }
      
      // Update files list
      saveFiles(newFiles);
      
      toast({
        title: `${uploadedFiles.length > 1 ? 'Files' : 'File'} uploaded`,
        description: `${uploadedFiles.length} ${uploadedFiles.length > 1 ? 'files have' : 'file has'} been encrypted and stored.`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: "There was an error encrypting and uploading your files.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };
  
  // Download a file
  const downloadFile = async (fileId: string) => {
    try {
      const fileToDownload = files.find(file => file.id === fileId);
      if (!fileToDownload) return;
      
      const encryptionKey = getCurrentUserEncryptionKey();
      if (!encryptionKey) {
        toast({
          title: "Authentication error",
          description: "Please log in again to access your encryption key.",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }
      
      // Get the encrypted file data
      const encryptedFileData = localStorage.getItem(`file_${fileId}`);
      if (!encryptedFileData) {
        toast({
          title: "File not found",
          description: "The requested file could not be found.",
          variant: "destructive"
        });
        return;
      }
      
      // Convert data URL to Blob
      const response = await fetch(encryptedFileData);
      const encryptedBlob = await response.blob();
      
      // Decrypt the file
      const decryptedBlob = await decryptFile(encryptedBlob, encryptionKey, fileToDownload.type);
      
      // Create download link
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileToDownload.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "File decrypted",
        description: `${fileToDownload.name} has been decrypted and downloaded.`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "There was an error decrypting and downloading your file.",
        variant: "destructive"
      });
    }
  };
  
  // Delete a file
  const deleteFile = (fileId: string) => {
    try {
      // Remove the file from the list
      const updatedFiles = files.filter(file => file.id !== fileId);
      saveFiles(updatedFiles);
      
      // Remove the file data
      localStorage.removeItem(`file_${fileId}`);
      
      toast({
        title: "File deleted",
        description: "The file has been permanently deleted.",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting your file.",
        variant: "destructive"
      });
    }
  };
  
  // Filter files by search query and type
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeTab === 'all' || 
                        (activeTab === 'documents' && file.type.includes('application/')) ||
                        (activeTab === 'images' && file.type.includes('image/'));
    return matchesSearch && matchesType;
  });
  
  // Sort files by date (newest first)
  const sortedFiles = [...filteredFiles].sort((a, b) => 
    new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
  );
  
  // Get appropriate icon for file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (fileType.includes('application/pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType.includes('application/zip') || fileType.includes('application/x-rar-compressed')) {
      return <FileArchive className="h-8 w-8 text-purple-500" />;
    }
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <MainLayout>
      <div className="container py-8 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">My Secure Vault</h1>
            <p className="text-muted-foreground mt-1">
              All files are end-to-end encrypted
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                placeholder="Search files..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <label htmlFor="file-upload">
              <Button as="span" className="gap-2">
                <FilePlus className="h-4 w-4" />
                Upload File
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </Button>
            </label>
          </div>
        </header>
        
        <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Files</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {isUploading && (
          <Card className="mb-4 border-primary/30 bg-primary/5 animate-pulse-subtle">
            <CardContent className="p-4 flex items-center gap-4">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <div>
                <p className="font-medium">Encrypting and uploading files...</p>
                <p className="text-sm text-muted-foreground">This may take a moment depending on file size</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {sortedFiles.length === 0 ? (
          <div className="border border-dashed rounded-lg p-12 text-center bg-muted/20 animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <FolderPlus className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="font-medium text-lg mb-2">No files yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Upload your first file to start building your secure encrypted storage.
            </p>
            <label htmlFor="file-upload-empty">
              <Button as="span" size="sm" className="gap-2">
                <FilePlus className="h-4 w-4" />
                Upload File
                <input
                  id="file-upload-empty"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </Button>
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedFiles.map((file) => (
              <Card key={file.id} className="overflow-hidden group animate-scale-in hover:border-primary/40 transition-colors">
                <CardContent className="p-0">
                  <div className="p-4 flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate text-balance" title={file.name}>
                        {file.name}
                      </h3>
                      <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{new Date(file.dateAdded).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => downloadFile(file.id)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteFile(file.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
                <CardFooter className="p-2 bg-muted/50 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>End-to-end encrypted</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
