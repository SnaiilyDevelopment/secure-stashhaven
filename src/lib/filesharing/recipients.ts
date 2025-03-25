
import { supabase } from "@/integrations/supabase/client";
import { FileRecipient } from "./types";
import { isValidPermission } from "./types";

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
        share_id: item.share_id,
        recipient_email: item.recipient_email,
        permissions: validPermission,
        created_at: item.created_at || new Date().toISOString()
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
    const { error } = await supabase
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

export async function removeRecipient(fileId: string, email: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('file_shares')  // Changed from 'file_sharing' to 'file_shares'
      .delete()
      .eq('file_id', fileId)
      .eq('recipient_email', email);
    
    if (error) {
      console.error("Error removing file recipient:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in removeRecipient:", error);
    return false;
  }
}
