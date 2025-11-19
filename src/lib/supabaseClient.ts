import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Read environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

// Diagnostic logging
console.log('[supabaseClient] Raw env vars:', {
  url: SUPABASE_URL,
  key: SUPABASE_PUBLISHABLE_KEY ? `${SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...` : 'MISSING',
  projectId: SUPABASE_PROJECT_ID
});

// Fallback: construct URL from project ID if URL is missing
const supabaseUrl = SUPABASE_URL || (SUPABASE_PROJECT_ID ? `https://${SUPABASE_PROJECT_ID}.supabase.co` : '');

// Fallback key from known Lovable Cloud configuration
const supabaseKey = SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbWZ6ZXFjemZzaWR4YWFidm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzI0NDgsImV4cCI6MjA3ODcwODQ0OH0.FojMHR09ZWi7N6ZQXlEC7ltI2vrrl_Yk8qdEDXdY1wk';

// Final validation
if (!supabaseUrl || !supabaseKey) {
  console.error('[supabaseClient] Missing required configuration:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey
  });
  throw new Error('Supabase configuration is incomplete. Check environment variables.');
}

console.log('[supabaseClient] Initializing with URL:', supabaseUrl);

// Create and export Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
