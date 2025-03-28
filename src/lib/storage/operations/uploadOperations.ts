
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { encryptFile, getCurrentUserEncryptionKey } from "../../encryption";
import { hasEnoughStorageSpace, validateFile } from "../storageUtils";
import { STORAGE_BUCKET_NAME } from "../constants";

// Upload an encrypted file to Supabase storage
export const uploadEncryptedFile = async (
  file: File,
  bucketName: string = STORAGE_BUCKET_NAME,
  folder?: string | null,
  onProgress?: (progress: number) => void
): Promise<string | null> => {
  try {
    // Validate file size only (type validation is skipped as we allow all types)
    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: "Upload failed",
        description: validation.message,
        variant: "destructive"
      });
      return null;
    }
    
    // Check if user has enough storage space
    const hasSpace = await hasEnoughStorageSpace(file.size);
    if (!hasSpace) {
      toast({
        title: "Upload failed",
        description: "You've reached your storage limit. Please delete some files before uploading more.",
        variant: "destructive"
      });
      return null;
    }
    
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
    
    // Create a file path, including folder if specified
    const timestamp = Date.now();
    const filePath = folder 
      ? `${folder}/${timestamp}_${file.name}` 
      : `${timestamp}_${file.name}`;
    
    // Upload encrypted file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, encryptedBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/encrypted',
      });
    
    // Handle progress updates manually since Supabase doesn't directly support onUploadProgress
    onProgress?.(80); // Upload complete
    
    if (error) {
      console.error("File upload error:", error);
      
      // Special case for bucket creation failure - using error message check
      if (error.message && (error.message.includes("bucket") || 
          error.message.includes("row-level security policy"))) {
        toast({
          title: "Upload failed",
          description: "Storage bucket issue. Please try again with a smaller file or contact support.",
          variant: "destructive"
        });
        return null;
      }
      
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
    
    // IMPORTANT: Create metadata entry for the file
    try {
      const { error: metadataError } = await supabase
        .from('file_metadata')
        .insert([
          {
            file_path: data.path,
            original_name: file.name,
            original_type: file.type || 'application/octet-stream', // Default MIME type if none detected
            size: file.size,
            encrypted: true
          }
        ]);
        
      if (metadataError) {
        console.error("Metadata creation error:", metadataError);
        // Try to delete the uploaded file if metadata creation fails
        await supabase.storage.from(bucketName).remove([data.path]);
        
        toast({
          title: "Upload failed",
          description: "Failed to create file metadata. Please try again.",
          variant: "destructive"
        });
        return null;
      }
    } catch (metadataError) {
      console.error("Metadata creation error:", metadataError);
      // Try to delete the uploaded file if metadata creation fails
      await supabase.storage.from(bucketName).remove([data.path]);
      
      toast({
        title: "Upload failed",
        description: "Failed to create file metadata. Please try again.",
        variant: "destructive"
      });
      return null;
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
