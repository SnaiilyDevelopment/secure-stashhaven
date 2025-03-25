
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { encryptFile, decryptFile, getCurrentUserEncryptionKey } from "../encryption";

// Upload an encrypted file to Supabase storage
export const uploadEncryptedFile = async (
  file: File,
  bucketName: string = 'secure-files',
  path?: string,
  onProgress?: (progress: number) => void
): Promise<string | null> => {
  try {
    onProgress?.(10); // Starting encryption
    
    const encryptionKey = getCurrentUserEncryptionKey();
    if (!encryptionKey) {
      toast({
        title: "Upload failed",
        description: "Encryption key not found. Please log in again.",
        variant: "destructive"
      });
      return null;
    }

    // Encrypt the file
    const encryptedBlob = await encryptFile(file, encryptionKey);
    onProgress?.(40); // Encryption complete
    
    // Create a file path if not provided
    const filePath = path || `${Date.now()}_${file.name}`;
    
    // Upload encrypted file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, encryptedBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/encrypted',
      });
    
    onProgress?.(80); // Upload complete
    
    if (error) {
      console.error("File upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
    
    // Save metadata to user's file list
    try {
      const { error: metadataError } = await supabase
        .from('file_metadata')
        .insert({
          file_path: data.path,
          original_name: file.name,
          original_type: file.type,
          size: file.size,
          encrypted: true
        });
      
      if (metadataError) {
        console.error("Metadata storage error:", metadataError);
      }
    } catch (metadataError) {
      console.error("Metadata insertion error:", metadataError);
    }
    
    onProgress?.(100); // Process complete
    
    toast({
      title: "Upload successful",
      description: "Your file has been securely uploaded."
    });
    
    return data.path;
  } catch (error) {
    console.error("File upload error:", error);
    toast({
      title: "Upload failed",
      description: "An unexpected error occurred during upload.",
      variant: "destructive"
    });
    return null;
  }
};

// Download and decrypt a file from Supabase storage
export const downloadEncryptedFile = async (
  filePath: string,
  originalType: string,
  bucketName: string = 'secure-files',
  fileName: string = ''
): Promise<Blob | null> => {
  try {
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
    
    // Decrypt the file
    const decryptedBlob = await decryptFile(data, encryptionKey, originalType, fileName);
    
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

// Delete a file from Supabase storage
export const deleteFile = async (
  filePath: string,
  bucketName: string = 'secure-files'
): Promise<boolean> => {
  try {
    // Delete file from storage
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      console.error("File deletion error:", error);
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    // Delete metadata
    try {
      const { error: metadataError } = await supabase
        .from('file_metadata')
        .delete()
        .eq('file_path', filePath);
      
      if (metadataError) {
        console.error("Metadata deletion error:", metadataError);
      }
    } catch (metadataError) {
      console.error("Metadata deletion error:", metadataError);
    }
    
    toast({
      title: "Deletion successful",
      description: "The file has been deleted."
    });
    
    return true;
  } catch (error) {
    console.error("File deletion error:", error);
    toast({
      title: "Deletion failed",
      description: "An unexpected error occurred during deletion.",
      variant: "destructive"
    });
    return false;
  }
};
