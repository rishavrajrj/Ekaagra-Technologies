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
    const isSchool = Boolean(
      leadInput.commercial_product_id?.toLowerCase().includes('school') ||
      leadInput.service?.toLowerCase().includes('school') ||
      leadInput.project_type?.toLowerCase().includes('school') ||
      leadInput.description?.toLowerCase().includes('school name:') ||
      (leadInput.organization && /school|vidyalaya|academy|institution|college|convent|gurukul/i.test(leadInput.organization))
    );
    const leadDomain = leadInput.lead_domain || (isSchool ? 'SCHOOL' : 'BUSINESS');

    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          source: leadInput.source,
          type: leadInput.type,
          status: leadInput.status || 'NEW',
          lead_domain: leadDomain,
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

    // Domain filter (safely filter by lead_domain or fallback to service/metadata)
    if (filter.domain && filter.domain !== 'ALL') {
      try {
        query = query.eq('lead_domain', filter.domain);
      } catch {
        // Safe fallback
      }
    }

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

    let { data, count, error } = await query;
    if (error && error.message?.includes('column leads.lead_domain does not exist')) {
      let fallbackQuery = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (filter.status && filter.status !== 'ALL') {
        fallbackQuery = fallbackQuery.eq('status', filter.status);
      }
      if (filter.type && filter.type !== 'ALL') {
        fallbackQuery = fallbackQuery.eq('type', filter.type);
      }
      if (filter.source && filter.source !== 'ALL') {
        fallbackQuery = fallbackQuery.eq('source', filter.source);
      }
      if (filter.query && filter.query.trim() !== '') {
        const q = filter.query.trim();
        fallbackQuery = fallbackQuery.or(
          `name.ilike.%${q}%,organization.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
        );
      }
      fallbackQuery = fallbackQuery.range(from, to);
      const fbRes = await fallbackQuery;
      if (fbRes.error) return { success: false, leads: [], total: 0, error: fbRes.error.message };
      data = fbRes.data;
      count = fbRes.count;
    } else if (error) {
      console.error('[SUPABASE ERROR] Failed to fetch leads:', error.message);
      return { success: false, leads: [], total: 0, error: error.message };
    }

    let enrichedLeads = ((data as Lead[]) || []).map((l: any) => {
      const isSchool = Boolean(
        l.lead_domain === 'SCHOOL' ||
        l.type === 'SCHOOL' ||
        l.commercial_product_id?.toLowerCase().includes('school') ||
        l.service?.toLowerCase().includes('school') ||
        l.project_type?.toLowerCase().includes('school') ||
        l.description?.toLowerCase().includes('school name:') ||
        (l.organization && /school|vidyalaya|academy|institution|college|convent/i.test(l.organization))
      );
      return {
        ...l,
        lead_domain: (l.lead_domain || (isSchool ? 'SCHOOL' : 'BUSINESS')) as 'BUSINESS' | 'SCHOOL',
      };
    });

    if (filter.domain && filter.domain !== 'ALL') {
      enrichedLeads = enrichedLeads.filter((l) => l.lead_domain === filter.domain);
    }

    return {
      success: true,
      leads: enrichedLeads,
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
    let { data, error } = await supabase.from('leads').select('status, lead_domain, type, service, organization');

    if (error && error.message?.includes('column leads.lead_domain does not exist')) {
      const fb = await supabase.from('leads').select('status, type, service, organization');
      if (fb.error) {
        return { success: false, stats: defaultStats, error: fb.error.message };
      }
      data = fb.data as any;
      error = null;
    } else if (error) {
      return { success: false, stats: defaultStats, error: error.message };
    }

    const rows = (data || []) as any[];

    const stats: LeadStats = {
      total: rows.length,
      new: rows.filter((l) => l.status === 'NEW').length,
      contacted: rows.filter((l) => l.status === 'CONTACTED').length,
      qualified: rows.filter((l) => l.status === 'QUALIFIED').length,
      proposalSent: rows.filter((l) => l.status === 'PROPOSAL_SENT').length,
      converted: rows.filter((l) => l.status === 'CONVERTED').length,
      lost: rows.filter((l) => l.status === 'LOST').length,
      businessCount: rows.filter((l) => {
        const isSchool = Boolean(
          l.lead_domain === 'SCHOOL' ||
          l.type === 'SCHOOL' ||
          l.service?.toLowerCase().includes('school') ||
          (l.organization && /school|vidyalaya|academy|institution|college|convent/i.test(l.organization))
        );
        return !isSchool;
      }).length,
      schoolCount: rows.filter((l) => {
        return Boolean(
          l.lead_domain === 'SCHOOL' ||
          l.type === 'SCHOOL' ||
          l.service?.toLowerCase().includes('school') ||
          (l.organization && /school|vidyalaya|academy|institution|college|convent/i.test(l.organization))
        );
      }).length,
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
    const isSchool = Boolean(
      orderInput.service_type?.toLowerCase().includes('school') ||
      orderInput.plan_id?.toLowerCase().includes('school') ||
      (orderInput.metadata as any)?.domain === 'SCHOOL'
    );
    const domain = orderInput.domain || (isSchool ? 'SCHOOL' : 'BUSINESS');
    const projectNumber = orderInput.project_number || (orderInput.metadata as any)?.projectNumber || null;
    const projectId = orderInput.project_id || (orderInput.metadata as any)?.projectId || null;

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          lead_id: orderInput.lead_id || null,
          project_id: projectId,
          project_number: projectNumber,
          domain: domain,
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
          metadata: {
            ...(orderInput.metadata || {}),
            domain,
            projectNumber,
            projectId,
          },
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

    // Also update associated business project if present
    const linkedProjectId = currentRes.data.project_id || (currentRes.data.metadata as { projectId?: string } | undefined)?.projectId;
    if (linkedProjectId) {
      try {
        await supabase
          .from('projects')
          .update({
            project_status: 'PAID',
            updated_at: nowIso,
          })
          .eq('id', linkedProjectId);

        await supabase.from('project_activity').insert([
          {
            project_id: linkedProjectId,
            activity_type: 'PAYMENT_RECEIVED',
            actor_type: 'SYSTEM',
            description: `Milestone payment received for order ${params.orderNumber} (₹${currentRes.data.amount_inr}). Project status updated to PAID. Ready for development.`,
            metadata: {
              orderNumber: params.orderNumber,
              gatewayPaymentId: params.gatewayPaymentId,
              amountINR: currentRes.data.amount_inr,
            },
          },
        ]);
      } catch (projErr) {
        console.warn('[PROJECT STATUS PAYMENT UPDATE NON-FATAL]', projErr);
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

    if (filter.domain && filter.domain !== 'ALL') {
      query = query.eq('domain', filter.domain);
    }

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
      // Fallback if domain column is not yet present on orders table in database
      if (error.message?.includes('column orders.domain does not exist')) {
        let fallbackQuery = supabase.from('orders').select('*', { count: 'exact' });
        if (filter.status && filter.status !== 'ALL') {
          fallbackQuery = fallbackQuery.eq('payment_status', filter.status);
        }
        if (filter.query && filter.query.trim() !== '') {
          const q = filter.query.trim();
          fallbackQuery = fallbackQuery.or(
            `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,customer_phone.ilike.%${q}%,service_type.ilike.%${q}%`
          );
        }
        fallbackQuery = fallbackQuery.order('created_at', { ascending: false }).range(from, to);
        const fbRes = await fallbackQuery;
        if (fbRes.error) return { success: false, orders: [], total: 0, error: fbRes.error.message };
        
        let mappedOrders = (fbRes.data || []).map((o: any) => ({
          ...o,
          domain: o.domain || (o.service_type?.toLowerCase().includes('school') ? 'SCHOOL' : 'BUSINESS'),
        })) as Order[];

        if (filter.domain && filter.domain !== 'ALL') {
          mappedOrders = mappedOrders.filter((o) => o.domain === filter.domain);
        }

        return {
          success: true,
          orders: mappedOrders,
          total: mappedOrders.length,
        };
      }
      return { success: false, orders: [], total: 0, error: error.message };
    }

    const enrichedOrders = (data || []).map((o: any) => ({
      ...o,
      domain: o.domain || (o.service_type?.toLowerCase().includes('school') ? 'SCHOOL' : 'BUSINESS'),
    })) as Order[];

    return {
      success: true,
      orders: enrichedOrders,
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
