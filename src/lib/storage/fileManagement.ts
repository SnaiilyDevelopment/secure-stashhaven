
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface FileMetadata {
  id: string;
  file_path: string;
  original_name: string;
  original_type: string;
  size: number;
  encrypted: boolean;
  created_at: string;
  updated_at: string;
}

// List all files for the current user
export const listUserFiles = async (
  bucketName: string = 'secure-files'
): Promise<FileMetadata[]> => {
  try {
    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("File listing error:", error);
      toast({
        title: "Failed to load files",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("File listing error:", error);
    toast({
      title: "Failed to load files",
      description: "An unexpected error occurred while loading files.",
      variant: "destructive"
    });
    return [];
  }
};

// Get metadata for a single file
export const getFileMetadata = async (
  filePath: string
): Promise<FileMetadata | null> => {
  try {
    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('file_path', filePath)
      .maybeSingle();
    
    if (error) {
      console.error("File metadata fetch error:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("File metadata fetch error:", error);
    return null;
  }
};
