import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Copy .env.example to .env and fill in your values.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // Store session in localStorage
    autoRefreshToken: true,      // Silently refresh before expiry
    detectSessionInUrl: true,    // Handle email confirmation redirects
    storageKey: 'veahub-auth',   // Unique key to avoid conflicts
  },
});
