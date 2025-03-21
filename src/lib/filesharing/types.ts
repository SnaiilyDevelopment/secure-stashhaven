
import { User } from "@supabase/supabase-js";

/**
 * Interface for recipient data
 */
export interface FileRecipient {
  id: string;
  email: string;
  permissions: 'view' | 'edit' | 'admin';
  shared_at: string;
}

/**
 * Interface for shared file data
 */
export interface SharedFile {
  id: string;
  file_path: string;
  original_name: string;
  original_type: string;
  size: number;
  permissions: 'view' | 'edit' | 'admin';
  shared_at: string;
  owner_email: string;
}

/**
 * Interface for the profiles data from Supabase
 */
export interface Profile {
  email: string;
  id: string;
  created_at?: string;
}

/**
 * Utility function to validate permissions string
 */
export function isValidPermission(permission: string): permission is 'view' | 'edit' | 'admin' {
  return ['view', 'edit', 'admin'].includes(permission);
}
