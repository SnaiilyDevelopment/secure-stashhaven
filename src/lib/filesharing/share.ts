
import { supabase } from "@/integrations/supabase/client";

export enum ShareFileError {
  USER_NOT_FOUND = "USER_NOT_FOUND",
  ALREADY_SHARED = "ALREADY_SHARED",
  SERVER_ERROR = "SERVER_ERROR",
  INVALID_PERMISSIONS = "INVALID_PERMISSIONS",
  INVALID_FILE = "INVALID_FILE"
}

export type ShareFileResult = {
  success: boolean;
  error?: ShareFileError;
  message?: string;
  shareId?: string;
};

/**
 * Share a file with another user
 * @param filePath Path to the file in storage
 * @param recipientEmail Email of the user to share with
 * @param permissions Permission level ('view', 'edit', 'admin')
 * @returns Result object containing success flag and any error information
 */
export const shareFileWithUser = async (
  filePath: string,
  recipientEmail: string,
  permissions: 'view' | 'edit' | 'admin'
): Promise<ShareFileResult> => {
  try {
    // Validate input
    if (!filePath) {
      return { 
        success: false, 
        error: ShareFileError.INVALID_FILE,
        message: "File path is required" 
      };
    }
    
    if (!recipientEmail) {
      return { 
        success: false, 
        error: ShareFileError.USER_NOT_FOUND,
        message: "Recipient email is required" 
      };
    }
    
    if (!['view', 'edit', 'admin'].includes(permissions)) {
      return { 
        success: false, 
        error: ShareFileError.INVALID_PERMISSIONS,
        message: "Invalid permission level" 
      };
    }
    
    // Use RPC function to share file
    const { data, error } = await supabase
      .rpc('share_file_with_user', { 
        file_path_param: filePath,
        recipient_email_param: recipientEmail,
        permissions_param: permissions
      });
      
    if (error) {
      console.error("Share file error:", error);
      
      // Handle specific error cases
      if (error.message.includes("not found")) {
        return { 
          success: false, 
          error: ShareFileError.USER_NOT_FOUND,
          message: `User with email ${recipientEmail} not found` 
        };
      }
      
      if (error.message.includes("already shared")) {
        return { 
          success: false, 
          error: ShareFileError.ALREADY_SHARED,
          message: `File is already shared with ${recipientEmail}` 
        };
      }
      
      if (error.message.includes("file not found")) {
        return { 
          success: false, 
          error: ShareFileError.INVALID_FILE,
          message: "File not found" 
        };
      }
      
      return { 
        success: false, 
        error: ShareFileError.SERVER_ERROR,
        message: "An error occurred while sharing the file" 
      };
    }
    
    if (!data || !data[0] || !data[0].share_id) {
      return { 
        success: false, 
        error: ShareFileError.SERVER_ERROR,
        message: "Failed to share file" 
      };
    }
    
    return { 
      success: true,
      shareId: data[0].share_id,
      message: `Successfully shared with ${recipientEmail}` 
    };
    
  } catch (error) {
    console.error("Share file error:", error);
    return { 
      success: false, 
      error: ShareFileError.SERVER_ERROR,
      message: "An unexpected error occurred" 
    };
  }
};
