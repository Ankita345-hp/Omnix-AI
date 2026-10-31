import { createClient, SupabaseClient } from '@supabase/supabase-js';

// VITE_ environment variables for Vercel & Client-Side access
const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Client-Side Supabase instance (using Public Anon Key only)
 * Safe to run in browser / Vercel deployment. Never expose Service Role Key here!
 */
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

/**
 * Checks if Supabase client configuration is active in Vercel / browser
 */
export function isSupabaseClientConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Helper to subscribe to real-time interaction updates via Supabase WebSockets
 */
export function subscribeToInteractions(onInsertOrUpdate: (payload: any) => void) {
  if (!supabase) return null;

  return supabase
    .channel('public:interactions')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'interactions' },
      payload => {
        onInsertOrUpdate(payload);
      }
    )
    .subscribe();
}

