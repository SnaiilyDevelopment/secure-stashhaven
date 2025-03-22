
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { isValidPermission } from "./types";

/**
 * Error types for shareFileWithUser
 */
export enum ShareFileError {
  USER_NOT_FOUND = "USER_NOT_FOUND",
  NOT_AUTHENTICATED = "NOT_AUTHENTICATED",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  SHARE_UPDATE_FAILED = "SHARE_UPDATE_FAILED",
  SHARE_CREATE_FAILED = "SHARE_CREATE_FAILED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}

/**
 * Result of shareFileWithUser operation
 */
export interface ShareFileResult {
  success: boolean;
  message: string;
  error?: ShareFileError;
}

/**
 * Share a file with another user by their email
 */
export const shareFileWithUser = async (
  filePath: string,
  userEmail: string,
  permissions: 'view' | 'edit' | 'admin' = 'view'
): Promise<ShareFileResult> => {
  try {
    // Validate params
    if (!filePath) {
      return {
        success: false,
        message: "Invalid file path",
        error: ShareFileError.FILE_NOT_FOUND
      };
    }

    if (!userEmail) {
      return {
        success: false,
        message: "Email is required",
        error: ShareFileError.USER_NOT_FOUND
      };
    }

    if (!isValidPermission(permissions)) {
      permissions = 'view'; // Default to view if invalid permission
    }

    // First check if the user exists
    const { data: userList, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .limit(1);
    
    if (userError) {
      console.error("Error checking user:", userError);
      toast({
        title: "Database error",
        description: "Failed to check if user exists.",
        variant: "destructive"
      });
      return {
        success: false, 
        message: "Failed to check if user exists",
        error: ShareFileError.UNKNOWN_ERROR
      };
    }
    
    if (!userList || userList.length === 0) {
      toast({
        title: "User not found",
        description: "The email address you entered does not belong to any user.",
        variant: "destructive"
      });
      return {
        success: false, 
        message: "User not found",
        error: ShareFileError.USER_NOT_FOUND
      };
    }
    
    const recipientId = userList[0].id;
    
    // Get the current user's ID
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Authentication error:", authError);
      toast({
        title: "Authentication error",
        description: "Failed to get current user information.",
        variant: "destructive"
      });
      return {
        success: false, 
        message: "Authentication error",
        error: ShareFileError.NOT_AUTHENTICATED
      };
    }
    
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to share files.",
        variant: "destructive"
      });
      return {
        success: false, 
        message: "Not authenticated",
        error: ShareFileError.NOT_AUTHENTICATED
      };
    }
    
    // Check if this file belongs to the current user
    const { data: fileData, error: fileError } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('file_path', filePath)
      .limit(1);
      
    if (fileError) {
      console.error("Error checking file:", fileError);
      toast({
        title: "Database error",
        description: "Failed to check file information.",
        variant: "destructive"
      });
      return {
        success: false, 
        message: "Database error when checking file",
        error: ShareFileError.UNKNOWN_ERROR
      };
    }
    
    if (!fileData || fileData.length === 0) {
      toast({
        title: "File not found",
        description: "The file you're trying to share doesn't exist or you don't have access to it.",
        variant: "destructive"
      });
      return {
        success: false, 
        message: "File not found",
        error: ShareFileError.FILE_NOT_FOUND
      };
    }
    
    // Check if the file is already shared with this user
    const { data: existingShare, error: shareError } = await supabase
      .from('file_shares')
      .select('*')
      .eq('file_path', filePath)
      .eq('recipient_id', recipientId)
      .limit(1);
      
    if (shareError) {
      console.error("Error checking existing share:", shareError);
      toast({
        title: "Database error",
        description: "Failed to check existing shares.",
        variant: "destructive"
      });
      return {
        success: false, 
        message: "Database error when checking existing shares",
        error: ShareFileError.UNKNOWN_ERROR
      };
    }
    
    if (existingShare && existingShare.length > 0) {
      // Update existing share permissions
      const { error: updateError } = await supabase
        .from('file_shares')
        .update({ permissions })
        .eq('id', existingShare[0].id);
        
      if (updateError) {
        console.error("Error updating share:", updateError);
        toast({
          title: "Error updating share",
          description: updateError.message,
          variant: "destructive"
        });
        return {
          success: false, 
          message: "Failed to update share permissions",
          error: ShareFileError.SHARE_UPDATE_FAILED
        };
      }
      
      toast({
        title: "Share updated",
        description: `Share permissions updated for ${userEmail}`,
      });
      
      return {
        success: true,
        message: `Share permissions updated for ${userEmail}`
      };
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
      console.error("Error sharing file:", insertError);
      toast({
        title: "Error sharing file",
        description: insertError.message,
        variant: "destructive"
      });
      return {
        success: false, 
        message: "Failed to share file",
        error: ShareFileError.SHARE_CREATE_FAILED
      };
    }
    
    toast({
      title: "File shared",
      description: `File successfully shared with ${userEmail}`,
    });
    
    return {
      success: true,
      message: `File successfully shared with ${userEmail}`
    };
    
  } catch (error) {
    console.error("File sharing error:", error);
    toast({
      title: "Sharing failed",
      description: "An unexpected error occurred while sharing the file.",
      variant: "destructive"
    });
    return {
      success: false, 
      message: "Unknown error occurred",
      error: ShareFileError.UNKNOWN_ERROR
    };
  }
};
