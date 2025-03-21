
import { supabase } from "@/integrations/supabase/client";
import { encryptText, decryptText } from "./encryption";
import { toast } from "@/components/ui/use-toast";

/**
 * Interface for recipient data
 */
interface FileRecipient {
  id: string;
  email: string;
  permissions: 'view' | 'edit' | 'admin';
  shared_at: string;
}

/**
 * Share a file with another user by their email
 */
export const shareFileWithUser = async (
  filePath: string,
  userEmail: string,
  permissions: 'view' | 'edit' | 'admin' = 'view'
): Promise<boolean> => {
  try {
    // First check if the user exists
    const { data: userList, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .limit(1);
    
    if (userError || !userList || userList.length === 0) {
      toast({
        title: "User not found",
        description: "The email address you entered does not belong to any user.",
        variant: "destructive"
      });
      return false;
    }
    
    const recipientId = userList[0].id;
    
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to share files.",
        variant: "destructive"
      });
      return false;
    }
    
    // Check if this file belongs to the current user
    const { data: fileData, error: fileError } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('file_path', filePath)
      .limit(1);
      
    if (fileError || !fileData || fileData.length === 0) {
      toast({
        title: "File not found",
        description: "The file you're trying to share doesn't exist or you don't have access to it.",
        variant: "destructive"
      });
      return false;
    }
    
    // Check if the file is already shared with this user
    const { data: existingShare, error: shareError } = await supabase
      .from('file_shares')
      .select('*')
      .eq('file_path', filePath)
      .eq('recipient_id', recipientId)
      .limit(1);
      
    if (existingShare && existingShare.length > 0) {
      // Update existing share permissions
      const { error: updateError } = await supabase
        .from('file_shares')
        .update({ permissions })
        .eq('id', existingShare[0].id);
        
      if (updateError) {
        toast({
          title: "Error updating share",
          description: updateError.message,
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Share updated",
        description: `Share permissions updated for ${userEmail}`,
      });
      
      return true;
    }
    
    // Create a new share
    const { error: insertError } = await supabase
      .from('file_shares')
      .insert({
        file_path: filePath,
        owner_id: user.id,
        recipient_id: recipientId,
        permissions
      });
      
    if (insertError) {
      toast({
        title: "Error sharing file",
        description: insertError.message,
        variant: "destructive"
      });
      return false;
    }
    
    toast({
      title: "File shared",
      description: `File successfully shared with ${userEmail}`,
    });
    
    return true;
    
  } catch (error) {
    console.error("File sharing error:", error);
    toast({
      title: "Sharing failed",
      description: "An unexpected error occurred while sharing the file.",
      variant: "destructive"
    });
    return false;
  }
};

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
    
    // Get all shares for this file
    const { data, error } = await supabase
      .from('file_shares')
      .select(`
        id,
        recipient_id,
        permissions,
        created_at,
        profiles!file_shares_recipient_id_fkey(email)
      `)
      .eq('file_path', filePath)
      .eq('owner_id', user.id);
      
    if (error || !data) {
      console.error("Error fetching file recipients:", error);
      return [];
    }
    
    // Format the response
    return data.map(share => ({
      id: share.id,
      email: share.profiles.email,
      permissions: share.permissions,
      shared_at: share.created_at
    }));
    
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
      toast({
        title: "Authentication error",
        description: "You must be logged in to manage file shares.",
        variant: "destructive"
      });
      return false;
    }
    
    // Delete the share
    const { error } = await supabase
      .from('file_shares')
      .delete()
      .eq('id', shareId)
      .eq('owner_id', user.id); // Ensure the current user is the owner
      
    if (error) {
      toast({
        title: "Error removing access",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    toast({
      title: "Access removed",
      description: "User's access to this file has been removed.",
    });
    
    return true;
    
  } catch (error) {
    console.error("Error removing file access:", error);
    toast({
      title: "Error removing access",
      description: "An unexpected error occurred.",
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Get files shared with the current user
 */
export const getFilesSharedWithMe = async (): Promise<any[]> => {
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
        profiles!file_shares_owner_id_fkey(email),
        file_metadata!inner(original_name, original_type, size)
      `)
      .eq('recipient_id', user.id);
      
    if (error || !data) {
      console.error("Error fetching shared files:", error);
      return [];
    }
    
    // Format the response
    return data.map(share => ({
      id: share.id,
      file_path: share.file_path,
      original_name: share.file_metadata.original_name,
      original_type: share.file_metadata.original_type,
      size: share.file_metadata.size,
      permissions: share.permissions,
      shared_at: share.created_at,
      owner_email: share.profiles.email
    }));
    
  } catch (error) {
    console.error("Error fetching shared files:", error);
    return [];
  }
};
