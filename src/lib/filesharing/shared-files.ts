
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
    // Use explicit joins instead of relying on relationship detection
    const { data, error } = await supabase
      .from('file_shares')
      .select(`
        id,
        file_path,
        permissions,
        created_at,
        owner_id
      `)
      .eq('recipient_id', user.id);
      
    if (error || !data) {
      console.error("Error fetching shared files:", error);
      return [];
    }
    
    // Process results and fetch additional data
    const sharedFilesWithDetails = await Promise.all(
      data.map(async (share) => {
        // Get file metadata
        const { data: fileMetadata } = await supabase
          .from('file_metadata')
          .select('original_name, original_type, size')
          .eq('file_path', share.file_path)
          .maybeSingle();
        
        // Get owner profile
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', share.owner_id)
          .maybeSingle();
        
        const permission = share.permissions;
        // Ensure the permission is one of the valid types
        const validPermission = isValidPermission(permission) ? permission : 'view';
        
        return {
          id: share.id,
          file_path: share.file_path || '',
          original_name: fileMetadata?.original_name || 'Unknown file',
          original_type: fileMetadata?.original_type || '',
          size: fileMetadata?.size || 0,
          permissions: validPermission,
          shared_at: share.created_at || '',
          owner_email: ownerProfile?.email || 'Unknown owner'
        };
      })
    );
    
    return sharedFilesWithDetails;
    
  } catch (error) {
    console.error("Error fetching shared files:", error);
    return [];
  }
};
