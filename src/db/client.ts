import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _serviceClient: SupabaseClient | null = null;
let _anonClient: SupabaseClient | null = null;

// Service-role client. RLS is bypassed; use only in trusted server-side code
// (CLI scripts, Vercel cron handlers). Never ship the service role key to a
// browser bundle.
export function serviceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (see .env.example).',
    );
  }
  _serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  });
  return _serviceClient;
}

// Anonymous client. RLS-bound; safe to use in client code.
export function anonClient(): SupabaseClient {
  if (_anonClient) return _anonClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY (see .env.example).');
  }
  _anonClient = createClient(url, key);
  return _anonClient;
}
