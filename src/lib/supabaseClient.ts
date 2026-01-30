import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// NEW DATABASE - Fallback values (only used if env vars are missing)
const FALLBACK_PROJECT_ID = 'mddqwppgucgzefzddajy';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHF3cHBndWNnemVmemRkYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0ODgsImV4cCI6MjA4MzI4MzQ4OH0.5BpOF1B7C98zdPffSe7wpd1Ch31s_hlJSK0vYGC7HDg';

// Read environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Construct URL and key (use env vars or fallback)
const supabaseUrl = SUPABASE_URL || `https://${FALLBACK_PROJECT_ID}.supabase.co`;
const supabaseKey = SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

// Log configuration (only in development)
if (import.meta.env.DEV) {
  console.log('[supabaseClient] URL:', supabaseUrl);
  console.log('[supabaseClient] Using env vars:', !!SUPABASE_URL);
}

// Create and export Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

