import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedSchoolsClient: SupabaseClient | null = null;

/**
 * Check if the Schools database credentials are configured in the environment
 */
export function isSchoolsConfigured(): boolean {
  const url = process.env.SCHOOLS_SUPABASE_URL;
  const key = process.env.SCHOOLS_SUPABASE_SERVICE_ROLE_KEY || process.env.SCHOOLS_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.trim() !== '' && key.trim() !== '');
}

/**
 * Retrieve or initialize the server-side Schools Supabase client singleton (Database B)
 * Strict Server-Side Only: Never invoke this from client-side React components.
 */
export function getSchoolsServerClient(): SupabaseClient | null {
  if (cachedSchoolsClient) return cachedSchoolsClient;

  const url = process.env.SCHOOLS_SUPABASE_URL;
  const key =
    process.env.SCHOOLS_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SCHOOLS_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      '[SCHOOLS DB] Credentials not found in environment (SCHOOLS_SUPABASE_URL / SCHOOLS_SUPABASE_SERVICE_ROLE_KEY).'
    );
    return null;
  }

  cachedSchoolsClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedSchoolsClient;
}
