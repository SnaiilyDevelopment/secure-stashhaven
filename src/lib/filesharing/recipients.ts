
import { supabase } from "@/integrations/supabase/client";
import { FileRecipient, isValidPermission } from "./types";

/**
 * Get all users who have access to a file
 */
export const getFileRecipients = async (filePath: string): Promise<FileRecipient[]> => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }
    
    // Get all shares for this file using RPC function
    const { data, error } = await supabase
      .rpc('get_file_recipients', { 
        file_path_param: filePath, 
        owner_id_param: user.id 
      });
      
    if (error || !data) {
      console.error("Error fetching file recipients:", error);
      return [];
    }
    
    // Format the results
    const recipients: FileRecipient[] = data.map((item: any) => {
      const permission = item.permissions;
      // Ensure the permission is one of the valid types
      const validPermission = isValidPermission(permission) ? permission : 'view';
      
      return {
        id: item.share_id,
        email: item.recipient_email,
        permissions: validPermission,
        shared_at: item.created_at || new Date().toISOString()
      };
    });
    
    return recipients;
    
  } catch (error) {
    console.error("Error fetching file recipients:", error);
    return [];
  }
};

/**
 * Remove a user's access to a file
 */
export const removeFileAccess = async (shareId: string): Promise<boolean> => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }
    
    // Use RPC function to remove access
    const { data, error } = await supabase
      .rpc('remove_file_access', { 
        share_id_param: shareId, 
        owner_id_param: user.id 
      });
      
    if (error) {
      console.error("Error removing file access:", error);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error("Error removing file access:", error);
    return false;
  }
};
