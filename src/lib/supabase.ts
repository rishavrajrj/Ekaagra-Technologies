import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Lead, LeadFilter, LeadStats, LeadStatus } from './types';

let cachedClient: SupabaseClient | null = null;

/**
 * Check if Supabase credentials are configured in the environment
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.trim() !== '' && key.trim() !== '');
}

/**
 * Retrieve or initialize the server-side Supabase client singleton
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

/**
 * -----------------------------------------------------------------------------
 * Lead Operations (Server-Side)
 * -----------------------------------------------------------------------------
 */

/**
 * Insert a new lead into the Supabase database
 */
export async function createLead(
  leadInput: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: Lead; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    console.warn(
      '[SUPABASE UNCONFIGURED] Lead created in memory/email only. SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not found in environment.'
    );
    return {
      success: false,
      error: 'Supabase database is not configured in the environment.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          source: leadInput.source,
          type: leadInput.type,
          status: leadInput.status || 'NEW',
          name: leadInput.name,
          organization: leadInput.organization || null,
          phone: leadInput.phone,
          email: leadInput.email,
          service: leadInput.service || null,
          project_type: leadInput.project_type || null,
          budget: leadInput.budget || null,
          timeline: leadInput.timeline || null,
          expected_users: leadInput.expected_users || null,
          features: leadInput.features || null,
          description: leadInput.description,
          preferred_contact: leadInput.preferred_contact || null,
          notes: leadInput.notes || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[SUPABASE ERROR] Failed to insert lead:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[SUPABASE SUCCESS] Lead inserted. ID: ${data.id} | Email: ${data.email}`);
    return { success: true, data: data as Lead };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[SUPABASE EXCEPTION] Insert failed:', message);
    return { success: false, error: message };
  }
}

/**
 * Retrieve paginated, filtered, and searched leads
 */
export async function getLeads(
  filter: LeadFilter = {}
): Promise<{ success: boolean; leads: Lead[]; total: number; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      success: false,
      leads: [],
      total: 0,
      error: 'Supabase is not configured in environment.',
    };
  }

  try {
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const pageSize = filter.pageSize && filter.pageSize > 0 ? filter.pageSize : 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Status filter
    if (filter.status && filter.status !== 'ALL') {
      query = query.eq('status', filter.status);
    }

    // Type filter
    if (filter.type && filter.type !== 'ALL') {
      query = query.eq('type', filter.type);
    }

    // Source filter
    if (filter.source && filter.source !== 'ALL') {
      query = query.eq('source', filter.source);
    }

    // Text search filter (Name, Organization, Email, Phone)
    if (filter.query && filter.query.trim() !== '') {
      const q = `%${filter.query.trim()}%`;
      query = query.or(`name.ilike.${q},organization.ilike.${q},email.ilike.${q},phone.ilike.${q}`);
    }

    // Pagination
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[SUPABASE ERROR] Failed to fetch leads:', error.message);
      return { success: false, leads: [], total: 0, error: error.message };
    }

    return {
      success: true,
      leads: (data || []) as Lead[],
      total: count || 0,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[SUPABASE EXCEPTION] Fetch failed:', message);
    return { success: false, leads: [], total: 0, error: message };
  }
}

/**
 * Retrieve high-level lead statistics for the dashboard ribbon
 */
export async function getLeadStats(): Promise<{
  success: boolean;
  stats: LeadStats;
  error?: string;
}> {
  const supabase = getSupabaseServerClient();
  const defaultStats: LeadStats = {
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    proposalSent: 0,
    converted: 0,
    lost: 0,
  };

  if (!supabase) {
    return { success: false, stats: defaultStats, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase.from('leads').select('status');

    if (error) {
      return { success: false, stats: defaultStats, error: error.message };
    }

    const stats: LeadStats = {
      total: data.length,
      new: data.filter((l) => l.status === 'NEW').length,
      contacted: data.filter((l) => l.status === 'CONTACTED').length,
      qualified: data.filter((l) => l.status === 'QUALIFIED').length,
      proposalSent: data.filter((l) => l.status === 'PROPOSAL_SENT').length,
      converted: data.filter((l) => l.status === 'CONVERTED').length,
      lost: data.filter((l) => l.status === 'LOST').length,
    };

    return { success: true, stats };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, stats: defaultStats, error: message };
  }
}

/**
 * Update lead status and record lifecycle timestamps
 */
export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus
): Promise<{ success: boolean; data?: Lead; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    const now = new Date().toISOString();
    if (newStatus === 'CONTACTED') updatePayload.contacted_at = now;
    if (newStatus === 'PROPOSAL_SENT') updatePayload.proposal_sent_at = now;
    if (newStatus === 'CONVERTED') updatePayload.converted_at = now;
    if (newStatus === 'LOST') updatePayload.lost_at = now;

    const { data, error } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Lead };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Update private internal notes for a lead
 */
export async function updateLeadNotes(
  leadId: string,
  notes: string
): Promise<{ success: boolean; data?: Lead; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Lead };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
