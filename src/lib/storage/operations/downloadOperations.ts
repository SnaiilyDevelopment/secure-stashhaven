
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { decryptFile, getCurrentUserEncryptionKey } from "../../encryption";
import { STORAGE_BUCKET_NAME } from "../constants";

// Download and decrypt a file from Supabase storage
export const downloadEncryptedFile = async (
  filePath: string,
  originalName: string,
  originalType: string,
  bucketName: string = STORAGE_BUCKET_NAME,
  onProgress?: (progress: number) => void
): Promise<Blob | null> => {
  try {
    onProgress?.(10); // Starting download
    
    const encryptionKey = getCurrentUserEncryptionKey();
    if (!encryptionKey) {
      toast({
        title: "Download failed",
        description: "Encryption key not found. Please log in again.",
        variant: "destructive"
      });
      return null;
    }
    
    // Download encrypted file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (error || !data) {
      console.error("File download error:", error);
      toast({
        title: "Download failed",
        description: error?.message || "Failed to download the file.",
        variant: "destructive"
      });
      return null;
    }
    
    onProgress?.(50); // Download complete, starting decryption
    
    // Decrypt the file
    const decryptedBlob = await decryptFile(data, encryptionKey, originalType);
    
    onProgress?.(100); // Process complete
    
    toast({
      title: "Download complete",
      description: `${originalName} has been decrypted and is ready to save.`
    });
    
    return decryptedBlob;
  } catch (error) {
    console.error("File download error:", error);
    toast({
      title: "Download failed",
      description: "An unexpected error occurred during decryption.",
      variant: "destructive"
    });
    return null;
  }
};
