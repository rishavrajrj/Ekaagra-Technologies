import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Lead, LeadFilter, LeadStats, LeadStatus, Order, OrderFilter, OrderStats, PaymentStatus, PaymentEvent } from './types';

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

/**
 * -----------------------------------------------------------------------------
 * Order & Payment Operations (Server-Side)
 * -----------------------------------------------------------------------------
 */

/**
 * Insert a new pending order into Supabase
 */
export async function createOrderRecord(
  orderInput: Omit<Order, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: Order; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: 'Supabase database is not configured in the environment.' };
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          lead_id: orderInput.lead_id || null,
          order_number: orderInput.order_number,
          customer_name: orderInput.customer_name,
          customer_email: orderInput.customer_email,
          customer_phone: orderInput.customer_phone,
          service_type: orderInput.service_type,
          plan_id: orderInput.plan_id || null,
          amount_inr: orderInput.amount_inr,
          payment_status: orderInput.payment_status || 'PENDING',
          gateway_name: orderInput.gateway_name || 'RAZORPAY',
          gateway_order_id: orderInput.gateway_order_id || null,
          gateway_payment_id: orderInput.gateway_payment_id || null,
          gateway_signature: orderInput.gateway_signature || null,
          metadata: orderInput.metadata || null,
          paid_at: orderInput.paid_at || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[SUPABASE ERROR] Failed to insert order:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Order };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[SUPABASE EXCEPTION] Order creation failed:', message);
    return { success: false, error: message };
  }
}

/**
 * Fetch an order by its unique order_number (e.g. EKA-2026-0001)
 */
export async function getOrderByNumber(
  orderNumber: string
): Promise<{ success: boolean; data?: Order; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber.trim())
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Order not found.' };
    }

    return { success: true, data: data as Order };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Fetch an order by gateway order ID (e.g. order_Q123456789)
 */
export async function getOrderByGatewayOrderId(
  gatewayOrderId: string
): Promise<{ success: boolean; data?: Order; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('gateway_order_id', gatewayOrderId.trim())
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Order not found.' };
    }

    return { success: true, data: data as Order };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Update an order upon successful payment verification (Idempotent: will not overwrite an already PAID order)
 */
export async function markOrderPaid(params: {
  orderNumber: string;
  gatewayPaymentId: string;
  gatewaySignature?: string;
}): Promise<{ success: boolean; data?: Order; alreadyPaid?: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    // 1. Fetch current status first for strict idempotency
    const currentRes = await getOrderByNumber(params.orderNumber);
    if (!currentRes.success || !currentRes.data) {
      return { success: false, error: currentRes.error || 'Order not found.' };
    }

    if (currentRes.data.payment_status === 'PAID') {
      return { success: true, data: currentRes.data, alreadyPaid: true };
    }

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'PAID',
        gateway_payment_id: params.gatewayPaymentId,
        gateway_signature: params.gatewaySignature || currentRes.data.gateway_signature,
        paid_at: nowIso,
        updated_at: nowIso,
      })
      .eq('order_number', params.orderNumber)
      .eq('payment_status', 'PENDING')
      .select()
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    // Atomic race-condition handling: If no row was updated because another concurrent caller already set it to PAID
    if (!data) {
      const refreshed = await getOrderByNumber(params.orderNumber);
      if (refreshed.success && refreshed.data && refreshed.data.payment_status === 'PAID') {
        return { success: true, data: refreshed.data, alreadyPaid: true };
      }
      return { success: false, error: 'Order could not be marked as PAID (current status is not PENDING).' };
    }

    // Also update associated lead if present
    if (currentRes.data.lead_id) {
      try {
        await supabase
          .from('leads')
          .update({
            status: 'CONVERTED',
            converted_at: nowIso,
            updated_at: nowIso,
          })
          .eq('id', currentRes.data.lead_id);
      } catch (leadUpdateErr) {
        console.warn('[LEAD UPDATE NON-FATAL]', leadUpdateErr);
      }
    }

    return { success: true, data: data as Order, alreadyPaid: false };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Record a payment event in the audit trail
 */
export async function recordPaymentEvent(params: {
  orderId: string;
  eventType: string;
  gatewayEventId?: string;
  gatewayPaymentId?: string;
  payload?: Record<string, unknown>;
}): Promise<{ success: boolean }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false };

  try {
    await supabase.from('payment_events').insert([
      {
        order_id: params.orderId,
        event_type: params.eventType,
        gateway_event_id: params.gatewayEventId || null,
        gateway_payment_id: params.gatewayPaymentId || null,
        payload: params.payload || null,
      },
    ]);
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Retrieve paginated and filtered orders for Admin view
 */
export async function getOrders(
  filter: OrderFilter = {}
): Promise<{ success: boolean; orders: Order[]; total: number; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, orders: [], total: 0, error: 'Supabase is not configured.' };
  }

  try {
    let query = supabase.from('orders').select('*', { count: 'exact' });

    if (filter.status && filter.status !== 'ALL') {
      query = query.eq('payment_status', filter.status);
    }

    if (filter.query && filter.query.trim() !== '') {
      const q = filter.query.trim();
      query = query.or(
        `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,customer_phone.ilike.%${q}%,service_type.ilike.%${q}%`
      );
    }

    query = query.order('created_at', { ascending: false });

    const page = Math.max(1, filter.page || 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return { success: false, orders: [], total: 0, error: error.message };
    }

    return {
      success: true,
      orders: (data as Order[]) || [],
      total: count || 0,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, orders: [], total: 0, error: message };
  }
}

/**
 * Retrieve aggregated order statistics for the admin dashboard
 */
export async function getOrderStats(): Promise<{ success: boolean; stats: OrderStats; error?: string }> {
  const supabase = getSupabaseServerClient();
  const defaultStats: OrderStats = {
    total: 0,
    pending: 0,
    paid: 0,
    failed: 0,
    refunded: 0,
    totalRevenueINR: 0,
  };

  if (!supabase) {
    return { success: false, stats: defaultStats, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase.from('orders').select('payment_status, amount_inr');
    if (error) {
      return { success: false, stats: defaultStats, error: error.message };
    }

    const stats: OrderStats = { ...defaultStats, total: data?.length || 0 };

    for (const row of data || []) {
      const status = row.payment_status;
      const amt = Number(row.amount_inr) || 0;

      if (status === 'PAID') {
        stats.paid += 1;
        stats.totalRevenueINR += amt;
      } else if (status === 'PENDING') {
        stats.pending += 1;
      } else if (status === 'FAILED') {
        stats.failed += 1;
      } else if (status === 'REFUNDED') {
        stats.refunded += 1;
      }
    }

    return { success: true, stats };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, stats: defaultStats, error: message };
  }
}
