
import { downloadEncryptedFile } from '@/lib/storage';
import { toast } from '@/components/ui/use-toast';

export const handleFileDownload = async (
  filePath: string,
  fileName: string,
  fileType: string,
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  try {
    // Download and decrypt the file
    const decryptedBlob = await downloadEncryptedFile(
      filePath,
      fileName,
      fileType,
      undefined,
      onProgress
    );
    
    if (!decryptedBlob) {
      return false;
    }
    
    // Create a download link
    const url = URL.createObjectURL(decryptedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('File download error:', error);
    toast({
      title: 'Download failed',
      description: 'An unexpected error occurred while downloading the file.',
      variant: 'destructive'
    });
    return false;
  }
};
