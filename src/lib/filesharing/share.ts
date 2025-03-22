
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
    
    // Check if file exists
    const { data: fileCheck, error: fileError } = await supabase
      .from('file_metadata')
      .select('file_path')
      .eq('file_path', filePath)
      .maybeSingle();
      
    if (fileError || !fileCheck) {
      console.error("File check error:", fileError);
      return { 
        success: false, 
        error: ShareFileError.INVALID_FILE,
        message: "File not found" 
      };
    }
    
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { 
        success: false, 
        error: ShareFileError.SERVER_ERROR,
        message: "Authentication required" 
      };
    }
    
    // Get recipient user ID
    const { data: recipientData, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', recipientEmail)
      .maybeSingle();
      
    if (recipientError || !recipientData) {
      console.error("Recipient lookup error:", recipientError);
      return { 
        success: false, 
        error: ShareFileError.USER_NOT_FOUND,
        message: `User with email ${recipientEmail} not found` 
      };
    }
    
    // Check if already shared
    const { data: existingShare, error: shareCheckError } = await supabase
      .from('file_shares')
      .select('id')
      .eq('file_path', filePath)
      .eq('owner_id', user.id)
      .eq('recipient_id', recipientData.id)
      .maybeSingle();
      
    if (shareCheckError) {
      console.error("Share check error:", shareCheckError);
      return { 
        success: false, 
        error: ShareFileError.SERVER_ERROR,
        message: "Failed to check existing shares" 
      };
    }
    
    if (existingShare) {
      // Update existing share
      const { error: updateError } = await supabase
        .from('file_shares')
        .update({ permissions })
        .eq('id', existingShare.id);
        
      if (updateError) {
        console.error("Share update error:", updateError);
        return { 
          success: false, 
          error: ShareFileError.SERVER_ERROR,
          message: "Failed to update share permissions" 
        };
      }
      
      return { 
        success: true,
        shareId: existingShare.id,
        message: `Updated share permissions for ${recipientEmail}` 
      };
    }
    
    // Create new share
    const { data: newShare, error: insertError } = await supabase
      .from('file_shares')
      .insert({
        file_path: filePath,
        owner_id: user.id,
        recipient_id: recipientData.id,
        permissions
      })
      .select('id')
      .single();
      
    if (insertError || !newShare) {
      console.error("Share creation error:", insertError);
      return { 
        success: false, 
        error: ShareFileError.SERVER_ERROR,
        message: "Failed to create share" 
      };
    }
    
    return { 
      success: true,
      shareId: newShare.id,
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
