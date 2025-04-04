
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// List all files
export const listFiles = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error listing files:", error);
      toast({
        title: "Error",
        description: "Could not retrieve your files.",
        variant: "destructive"
      });
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error listing files:", error);
    return [];
  }
};
