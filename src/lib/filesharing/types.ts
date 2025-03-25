
// Shared file interface
export interface SharedFile {
  id: string;
  file_id: string;
  file_path: string;
  recipient_email: string;
  shared_by_user_id: string;
  shared_at: string;
  original_name: string;
  original_type: string;
  size: number;
  owner_email?: string;
  permissions?: string;
}

// File recipient interface
export interface FileRecipient {
  id: string;
  email: string;
  permissions: string;
  shared_at: string;
}

// Valid permission types
export type PermissionType = 'view' | 'edit' | 'admin';

// Check if a permission string is a valid permission type
export function isValidPermission(permission: string): permission is PermissionType {
  return ['view', 'edit', 'admin'].includes(permission);
}
