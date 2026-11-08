import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseServiceKey, supabaseUrl } from './env';

const g = globalThis as unknown as { __fsSupabaseAdmin?: SupabaseClient };

/** Service-role client. Server-only — never expose to the browser. */
export function supabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase service role is not configured');
  if (!g.__fsSupabaseAdmin) {
    g.__fsSupabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return g.__fsSupabaseAdmin;
}
