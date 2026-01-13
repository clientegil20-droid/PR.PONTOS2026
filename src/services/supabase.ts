import { createClient } from '@supabase/supabase-js';

// 1. Safe environment access handling
// Using import.meta.env (typed via vite-env.d.ts)
const env = import.meta.env || {};

// 2. Extract and Trim variables to avoid whitespace issues
const supabaseUrl = (env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();

// 3. Validation and Logging
console.log(`[Supabase] Initializing client...`);
console.log(`[Supabase] URL: ${supabaseUrl ? supabaseUrl : 'MISSING'}`);
console.log(`[Supabase] Key: ${supabaseAnonKey ? (supabaseAnonKey.substring(0, 5) + '...') : 'MISSING'}`);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] CRITICAL ERROR: Missing Supabase URL or Anon Key. Database operations will fail.');
} else {
    // Basic URL validation
    try {
        new URL(supabaseUrl);
    } catch (e) {
        console.error(`[Supabase] CRITICAL ERROR: Invalid Supabase URL format: "${supabaseUrl}"`);
    }
}

// 4. Create Client with Auto-RefreshToken (default)
// Valores injetados como fallback para garantir funcionamento na Vercel
const REAL_URL = 'https://xbxrxtmgfoexyeovytkg.supabase.co';
const REAL_KEY = 'sb_publishable_XrKOUkhpGlvdNk0iz2iKiQ_VMd79ShY';

export const supabase = createClient(
    supabaseUrl || REAL_URL,
    supabaseAnonKey || REAL_KEY
);
