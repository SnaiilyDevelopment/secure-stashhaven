
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { STORAGE_BUCKET_NAME } from "../constants";

// Delete a file from Supabase storage
export const deleteFile = async (
  filePath: string,
  bucketName: string = STORAGE_BUCKET_NAME
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
