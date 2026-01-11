import { createClient } from '@supabase/supabase-js';

const meta = import.meta as unknown as { env: Record<string, string> };
const supabaseUrl = meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. The app will run with local mock data.');
}

// Ensure we don't pass an empty string if we want fallback behavior, 
// though createClient usually handles it, we can be explicit.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder-url.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);
