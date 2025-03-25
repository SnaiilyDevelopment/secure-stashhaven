
/**
 * Types for file sharing functionality
 */

export interface SharedFile {
  id: string;
  file_id: string;
  file_path: string;
  original_name: string;
  original_type: string;
  size: number;
  permissions: string;
  created_at: string;
  recipient_email: string;
  owner_email: string;
  shared_by_user_id: string;
}

export interface FileRecipient {
  share_id: string;
  recipient_email: string;
  permissions: string;
  created_at: string;
}

// Permission types for shared files
export type FilePermission = 'view' | 'edit' | 'admin';

/**
 * Validates if a string is a valid permission value
 */
export function isValidPermission(permission: string): permission is FilePermission {
  return ['view', 'edit', 'admin'].includes(permission);
}
