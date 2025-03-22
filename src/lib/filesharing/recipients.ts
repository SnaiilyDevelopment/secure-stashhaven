
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
    
    // Get all shares for this file with joined profile data
    // Use explicit join syntax instead of relying on relationship detection
    const { data, error } = await supabase
      .from('file_shares')
      .select(`
        id,
        permissions,
        created_at,
        recipient_id
      `)
      .eq('file_path', filePath)
      .eq('owner_id', user.id);
      
    if (error || !data) {
      console.error("Error fetching file recipients:", error);
      return [];
    }
    
    // Fetch profile data in a separate query
    const recipientsWithProfiles = await Promise.all(
      data.map(async (share) => {
        // Get the recipient's email from the profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', share.recipient_id)
          .single();
        
        const permission = share.permissions;
        // Ensure the permission is one of the valid types
        const validPermission = isValidPermission(permission) ? permission : 'view';
        
        return {
          id: share.id,
          email: profileData?.email || 'Unknown email',
          permissions: validPermission,
          shared_at: share.created_at || new Date().toISOString()
        };
      })
    );
    
    return recipientsWithProfiles;
    
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
    
    // Delete the share
    const { error } = await supabase
      .from('file_shares')
      .delete()
      .eq('id', shareId)
      .eq('owner_id', user.id); // Ensure the current user is the owner
      
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
