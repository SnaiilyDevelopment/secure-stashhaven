
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ThreeDLayout from '@/components/layout/3DLayout';
import { isAuthenticated, getCurrentUserEncryptionKey } from '@/lib/auth';
import { encryptFile, decryptFile } from '@/lib/encryption';
import SearchBar from '@/components/dashboard/SearchBar';
import FileList from '@/components/dashboard/FileList';

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
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
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
  
  const saveFiles = (updatedFiles: FileItem[]) => {
    localStorage.setItem('encrypted_files', JSON.stringify(updatedFiles));
    setFiles(updatedFiles);
  };
  
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
        
        const encryptedBlob = await encryptFile(file, encryptionKey);
        
        const fileReader = new FileReader();
        
        const readFilePromise = new Promise<string>((resolve, reject) => {
          fileReader.onload = () => resolve(fileReader.result as string);
          fileReader.onerror = reject;
        });
        
        fileReader.readAsDataURL(encryptedBlob);
        const encryptedFileData = await readFilePromise;
        
        const newFile: FileItem = {
          id: crypto.randomUUID(),
          name: file.name,
          size: encryptedBlob.size,
          type: file.type,
          encryptedType: encryptedBlob.type,
          dateAdded: new Date().toISOString(),
          encrypted: true
        };
        
        localStorage.setItem(`file_${newFile.id}`, encryptedFileData);
        
        newFiles.push(newFile);
      }
      
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
      event.target.value = '';
    }
  };
  
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
      
      const encryptedFileData = localStorage.getItem(`file_${fileId}`);
      if (!encryptedFileData) {
        toast({
          title: "File not found",
          description: "The requested file could not be found.",
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch(encryptedFileData);
      const encryptedBlob = await response.blob();
      
      const decryptedBlob = await decryptFile(encryptedBlob, encryptionKey, fileToDownload.type);
      
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
  
  const deleteFile = (fileId: string) => {
    try {
      const updatedFiles = files.filter(file => file.id !== fileId);
      saveFiles(updatedFiles);
      
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

  return (
    <ThreeDLayout>
      <div className="container py-8 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-green-800">My Secure Vault</h1>
            <p className="text-green-700/80 mt-1">
              All files are end-to-end encrypted
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery} 
            />
            
            <label htmlFor="file-upload">
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
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
        
        <FileList 
          files={files.filter(file => 
            file.name.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          isLoading={isUploading}
          onDeleteComplete={() => {
            // This function will be called after file deletion
            console.log('File deletion completed');
          }}
          downloadFile={downloadFile}
          deleteFile={deleteFile}
          emptyMessage="No files found. Upload your first encrypted file."
        />
      </div>
    </ThreeDLayout>
  );
};

export default Dashboard;
