import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase Connection Credentials
const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.log('[OmniX-AI Supabase] SUPABASE_URL not provided. Set SUPABASE_URL & SUPABASE_ANON_KEY in your .env file.');
}

/**
 * Standard Supabase client (Anon Key)
 * Respects Row Level Security (RLS) policies.
 */
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })
  : null;

/**
 * Privileged Supabase Admin client (Service Role Key)
 * Bypasses RLS for secure server-side operations, webhook ingestion, and background triage.
 */
export const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    })
  : supabase;

/**
 * Helper to check whether Supabase is configured and reachable
 */
export async function getSupabaseHealth() {
  if (!supabaseUrl) {
    return {
      configured: false,
      status: 'missing_credentials',
      message: 'SUPABASE_URL is not set in environment or .env'
    };
  }

  const client = supabaseAdmin || supabase;
  if (!client) {
    return {
      configured: false,
      status: 'missing_keys',
      message: 'Neither SUPABASE_ANON_KEY nor SUPABASE_SERVICE_ROLE_KEY is set'
    };
  }

  try {
    const { count, error } = await client
      .from('interactions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        configured: true,
        connected: false,
        status: 'error',
        message: error.message
      };
    }

    return {
      configured: true,
      connected: true,
      status: 'active',
      recordCount: count ?? 0,
      url: supabaseUrl
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      status: 'exception',
      message: err.message
    };
  }
}

