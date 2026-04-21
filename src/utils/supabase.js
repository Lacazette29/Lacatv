import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Keep session alive — persists in localStorage across browser refreshes
    persistSession:    true,
    autoRefreshToken:  true,
    // Store session in localStorage so it survives page refresh
    storage:           window.localStorage,
    // Session lasts 7 days before requiring re-login
    storageKey:        "lacatv-admin-session",
    flowType:          "implicit",
  },
});
