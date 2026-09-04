import { NextRequest, NextResponse } from 'next/server';
import { calculateVerifiedOrderTotal } from '@/lib/pricingEngine';
import { createRazorpayOrder, generateOrderNumber, getRazorpayKeyId, isRazorpayConfigured } from '@/lib/razorpay';
import { createOrderRecord, isSupabaseConfigured } from '@/lib/supabase';
import type { CreateOrderRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateOrderRequest;

    // 1. Validate Customer Information
    if (!body?.customerName?.trim() || !body?.customerEmail?.trim() || !body?.customerPhone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please provide full name, email address, and phone number.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.customerEmail.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const cleanPhone = body.customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid 10-digit phone number.' },
        { status: 400 }
      );
    }

    // 2. Strict Server-Side Price Calculation (Zero Client Trust)
    const calculation = calculateVerifiedOrderTotal(body);
    if (!calculation.isValid) {
      return NextResponse.json(
        { success: false, error: calculation.error || 'Pricing verification failed.' },
        { status: 400 }
      );
    }

    // Free tier cannot be ordered via payment gateway
    if (calculation.finalAmountINR <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Free Launch (₹0) does not require online payment. Please submit the enquiry form directly.',
        },
        { status: 400 }
      );
    }

    // 3. Check Gateway Configuration
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Payment Gateway is currently in onboarding mode. RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not yet configured on the server.',
          isConfigError: true,
        },
        { status: 503 }
      );
    }

    // 4. Generate Unique Order Number
    const orderNumber = generateOrderNumber();

    // 5. Create Order in Razorpay
    const razorpayRes = await createRazorpayOrder({
      amountInPaise: calculation.amountInPaise,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        orderNumber,
        customerName: body.customerName.trim(),
        customerEmail: body.customerEmail.trim(),
        customerPhone: body.customerPhone.trim(),
        planId: calculation.planId || 'custom',
        planName: calculation.planName,
        serviceType: calculation.serviceType,
      },
    });

    if (!razorpayRes.success || !razorpayRes.data) {
      return NextResponse.json(
        {
          success: false,
          error: razorpayRes.error || 'Failed to initialize payment gateway order.',
        },
        { status: 502 }
      );
    }

    const gatewayOrderId = razorpayRes.data.id;

    // 6. Persist Pending Order to Supabase (if configured)
    let dbOrderId: string | undefined;
    if (isSupabaseConfigured()) {
      const dbRes = await createOrderRecord({
        lead_id: body.leadId || null,
        order_number: orderNumber,
        customer_name: body.customerName.trim(),
        customer_email: body.customerEmail.trim(),
        customer_phone: body.customerPhone.trim(),
        service_type: calculation.serviceType,
        plan_id: calculation.planId || null,
        amount_inr: calculation.finalAmountINR,
        payment_status: 'PENDING',
        gateway_name: 'RAZORPAY',
        gateway_order_id: gatewayOrderId,
        metadata: {
          planName: calculation.planName,
          planPrice: calculation.planPrice,
          additionalPages: calculation.verifiedPages,
          domainChoice: body.domainChoice,
          preferredDomain: calculation.domainName,
          domainPrice: null,
          domainAllowance: calculation.domainUpgrade,
          domainDifference: calculation.domainUpgrade,
          organizationName: body.organizationName,
          notes: calculation.notes,
          customerWhatsApp: body.customerWhatsApp || body.customerPhone,
          isCustomLink: body.isCustomPaymentLink,
          milestoneDescription: body.customDescription,
        },
      });

      if (dbRes.success && dbRes.data) {
        dbOrderId = dbRes.data.id;
      }
    }

    // 7. Return Safe Checkout Response (Never expose secrets)
    return NextResponse.json({
      success: true,
      orderId: dbOrderId,
      orderNumber,
      gatewayOrderId,
      amountInPaise: calculation.amountInPaise,
      amountINR: calculation.finalAmountINR,
      currency: 'INR',
      keyId: getRazorpayKeyId(),
      customerName: body.customerName.trim(),
      customerEmail: body.customerEmail.trim(),
      customerPhone: body.customerPhone.trim(),
      planName: calculation.planName,
      serviceType: calculation.serviceType,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API CREATE-ORDER EXCEPTION]', message);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while creating your order.' },
      { status: 500 }
    );
  }
}
