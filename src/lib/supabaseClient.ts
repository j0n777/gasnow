import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Read environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

// Fallback: construct URL from project ID if URL is missing
const supabaseUrl = SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;

// Diagnostic logging
console.log('[supabaseClient] URL:', supabaseUrl);
console.log('[supabaseClient] Key present:', !!SUPABASE_PUBLISHABLE_KEY);

// Create and export Supabase client
export const supabase = createClient<Database>(supabaseUrl, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
