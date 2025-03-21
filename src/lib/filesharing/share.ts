
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { isValidPermission } from "./types";

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
