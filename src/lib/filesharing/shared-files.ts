
import { supabase } from "@/integrations/supabase/client";
import { SharedFile } from "./types";
import { isValidPermission } from "./types";

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
    
    // Get shared files using RPC function
    const { data, error } = await supabase
      .rpc('get_files_shared_with_me', { recipient_id_param: user.id });
      
    if (error || !data) {
      console.error("Error fetching shared files:", error);
      return [];
    }
    
    // Process results
    const sharedFiles: SharedFile[] = data.map((item: any) => {
      const permission = item.permissions;
      // Ensure the permission is one of the valid types
      const validPermission = isValidPermission(permission) ? permission : 'view';
      
      return {
        id: item.share_id,
        file_id: item.file_id || '',
        file_path: item.file_path || '',
        original_name: item.original_name || 'Unknown file',
        original_type: item.original_type || '',
        size: item.size || 0,
        permissions: validPermission,
        shared_at: item.created_at || '',
        recipient_email: user.email || '',
        shared_by_user_id: item.owner_id || '',
        owner_email: item.owner_email || 'Unknown owner'
      };
    });
    
    return sharedFiles;
    
  } catch (error) {
    console.error("Error fetching shared files:", error);
    return [];
  }
};
