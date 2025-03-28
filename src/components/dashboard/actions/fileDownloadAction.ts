
import { downloadEncryptedFile } from '@/lib/storage';
import { toast } from '@/components/ui/use-toast';

export const handleFileDownload = async (
  filePath: string, 
  fileName: string, 
  fileType: string
): Promise<void> => {
  const decryptedBlob = await downloadEncryptedFile(filePath, fileName, fileType);
  
  if (decryptedBlob) {
    // Create a URL for the blob
    const url = URL.createObjectURL(decryptedBlob);
    
    // Create a link element
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    
    // Click the link to trigger the download
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Download complete",
      description: `${fileName} has been decrypted and downloaded.`
    });
  }
};
