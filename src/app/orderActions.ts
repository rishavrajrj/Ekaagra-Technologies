'use server';

import { verifyAdminSession } from '@/lib/adminAuth';
import { getOrders, getOrderStats, createOrderRecord, isSupabaseConfigured } from '@/lib/supabase';
import { createRazorpayOrder, generateOrderNumber, isRazorpayConfigured, getRazorpayKeyId } from '@/lib/razorpay';
import type { OrderFilter, OrderStats } from '@/lib/types';
import { calculateVerifiedOrderTotal } from '@/lib/pricingEngine';

export async function fetchOrdersAction(filter: OrderFilter = {}) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, orders: [], total: 0, error: 'Unauthorized.' };
  }

  return getOrders(filter);
}

export async function fetchOrderStatsAction(): Promise<{ success: boolean; stats: OrderStats; error?: string }> {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return {
      success: false,
      stats: { total: 0, pending: 0, paid: 0, failed: 0, refunded: 0, totalRevenueINR: 0 },
      error: 'Unauthorized.',
    };
  }

  return getOrderStats();
}

/**
 * Admin Action: Generate a secure, verified custom payment link for milestones or custom software
 */
export async function createCustomPaymentLinkAction(params: {
  leadId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceType: string;
  amountINR: number;
  description: string;
}) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, error: 'Unauthorized administrative action.' };
  }

  if (!params.customerName || !params.customerEmail || !params.customerPhone || !params.amountINR || params.amountINR <= 0) {
    return { success: false, error: 'Please specify customer details and a valid payment amount.' };
  }

  const verified = calculateVerifiedOrderTotal({
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    serviceType: params.serviceType,
    isCustomPaymentLink: true,
    customAmountINR: params.amountINR,
    customDescription: params.description,
  });

  if (!verified.isValid) {
    return { success: false, error: verified.error || 'Failed to verify payment amount.' };
  }

  const orderNumber = generateOrderNumber();

  let gatewayOrderId: string | undefined;

  // If Razorpay is configured, generate Razorpay order
  if (isRazorpayConfigured()) {
    const razorpayRes = await createRazorpayOrder({
      amountInPaise: verified.amountInPaise,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        orderNumber,
        customerName: params.customerName.trim(),
        customerEmail: params.customerEmail.trim(),
        customerPhone: params.customerPhone.trim(),
        serviceType: params.serviceType,
        description: params.description,
        isCustomPaymentLink: 'true',
      },
    });

    if (razorpayRes.success && razorpayRes.data) {
      gatewayOrderId = razorpayRes.data.id;
    }
  }

  // Persist order in Supabase
  let orderRecordId: string | undefined;
  if (isSupabaseConfigured()) {
    const dbRes = await createOrderRecord({
      lead_id: params.leadId || null,
      order_number: orderNumber,
      customer_name: params.customerName.trim(),
      customer_email: params.customerEmail.trim(),
      customer_phone: params.customerPhone.trim(),
      service_type: params.serviceType,
      plan_id: 'custom-payment',
      amount_inr: verified.finalAmountINR,
      payment_status: 'PENDING',
      gateway_name: 'RAZORPAY',
      gateway_order_id: gatewayOrderId,
      metadata: {
        planName: params.description,
        planPrice: verified.finalAmountINR,
        notes: params.description,
        isCustomLink: true,
        milestoneDescription: params.description,
      },
    });

    if (dbRes.success && dbRes.data) {
      orderRecordId = dbRes.data.id;
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ekaagratechnologies.site';
  const paymentUrl = `${siteUrl}/pay/${orderNumber}`;

  return {
    success: true,
    orderNumber,
    orderId: orderRecordId,
    amountINR: verified.finalAmountINR,
    gatewayOrderId,
    paymentUrl,
    message: 'Custom payment link created successfully.',
  };
}
