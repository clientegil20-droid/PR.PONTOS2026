import { createClient } from '@supabase/supabase-js';

// Fallback to simpler access
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. The app will run with local mock data.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.url.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);
