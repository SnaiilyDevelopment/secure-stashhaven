
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
    console.log("Fetching files from file_metadata table...");
    
    // Get the current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Error getting current user:", userError);
      throw new Error("Authentication error: " + (userError?.message || "Unable to get current user"));
    }
    
    console.log("Current user ID:", user.id);
    
    // Get all files for the current user
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
    
    console.log("Files fetched successfully:", data?.length || 0, "files");
    
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
