
// Re-export all auth functions from the new modular structure
import { supabase } from '@/integrations/supabase/client';
export * from './auth/index';
