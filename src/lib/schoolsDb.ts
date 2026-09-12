import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedSchoolsClient: SupabaseClient | null = null;

/**
 * Check if the Schools database credentials are configured in the environment.
 * Primary: Dedicated Database B (SCHOOLS_SUPABASE_*)
 * Fallback: Database A (SUPABASE_*) unified mode
 */
export function isSchoolsConfigured(): boolean {
  const url = process.env.SCHOOLS_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SCHOOLS_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SCHOOLS_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.trim() !== '' && key.trim() !== '');
}

/**
 * Retrieve or initialize the server-side Schools Supabase client singleton (Database B with fallback to Database A)
 * Strict Server-Side Only: Never invoke this from client-side React components.
 */
export function getSchoolsServerClient(): SupabaseClient | null {
  if (cachedSchoolsClient) return cachedSchoolsClient;

  // Primary: Dedicated Database B (Schools Multi-Tenant Platform)
  // Fallback: Database A (Unified Mode if SCHOOLS_SUPABASE_* is not provided)
  const url = process.env.SCHOOLS_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SCHOOLS_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SCHOOLS_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      '[SCHOOLS DB] Neither SCHOOLS_SUPABASE_URL nor fallback SUPABASE_URL configured in environment.'
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
