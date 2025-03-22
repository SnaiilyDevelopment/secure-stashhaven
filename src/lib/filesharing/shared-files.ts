
import { supabase } from "@/integrations/supabase/client";
import { SharedFile, isValidPermission } from "./types";

/**
 * Get files shared with the current user
 */
export const getFilesSharedWithMe = async (): Promise<SharedFile[]> => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }
    
    // Get all files shared with the current user
    const { data, error } = await supabase
      .from('file_shares')
      .select(`
        id,
        file_path,
        permissions,
        created_at,
        owner_id,
        profiles:owner_id(email),
        file_metadata!inner(original_name, original_type, size)
      `)
      .eq('recipient_id', user.id);
      
    if (error || !data) {
      console.error("Error fetching shared files:", error);
      return [];
    }
    
    // Format the response with type validation for permissions
    return data.map(share => {
      const permission = share.permissions;
      // Ensure the permission is one of the valid types
      const validPermission = isValidPermission(permission) ? permission : 'view';
      
      return {
        id: share.id,
        file_path: share.file_path || '',
        original_name: share.file_metadata?.original_name || 'Unknown file',
        original_type: share.file_metadata?.original_type || '',
        size: share.file_metadata?.size || 0,
        permissions: validPermission,
        shared_at: share.created_at || '',
        owner_email: share.profiles?.email || 'Unknown owner'
      };
    });
    
  } catch (error) {
    console.error("Error fetching shared files:", error);
    return [];
  }
};
