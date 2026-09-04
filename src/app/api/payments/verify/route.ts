import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayPaymentSignature } from '@/lib/razorpay';
import { markOrderPaid, recordPaymentEvent, getOrderByNumber } from '@/lib/supabase';
import { sendClientPaymentReceiptEmail, sendAdminPaymentNotificationEmail } from '@/lib/email';
import type { VerifyPaymentRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VerifyPaymentRequest;

    if (
      !body?.orderNumber?.trim() ||
      !body?.razorpayOrderId?.trim() ||
      !body?.razorpayPaymentId?.trim() ||
      !body?.razorpaySignature?.trim()
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment verification parameters.' },
        { status: 400 }
      );
    }

    // 1. Authoritative Server-Side HMAC-SHA256 Signature Verification
    const isSignatureValid = verifyRazorpayPaymentSignature({
      orderId: body.razorpayOrderId.trim(),
      paymentId: body.razorpayPaymentId.trim(),
      signature: body.razorpaySignature.trim(),
    });

    if (!isSignatureValid) {
      console.error(
        `[PAYMENT SECURITY ALERT] Signature verification failed for order ${body.orderNumber} (Payment ID: ${body.razorpayPaymentId})`
      );
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    // 2. Fetch existing order to verify consistency
    const existingOrderRes = await getOrderByNumber(body.orderNumber.trim());
    if (!existingOrderRes.success || !existingOrderRes.data) {
      return NextResponse.json(
        { success: false, error: 'Order not found in records.' },
        { status: 404 }
      );
    }

    const order = existingOrderRes.data;

    // Verify that the order ID matches the gateway order ID created on server
    if (order.gateway_order_id && order.gateway_order_id !== body.razorpayOrderId.trim()) {
      console.error(
        `[PAYMENT SECURITY ALERT] Gateway Order ID mismatch for ${body.orderNumber}: expected ${order.gateway_order_id}, got ${body.razorpayOrderId}`
      );
      return NextResponse.json(
        { success: false, error: 'Payment gateway order mismatch.' },
        { status: 400 }
      );
    }

    // 3. Mark Order as PAID (Strict Idempotency)
    const updateRes = await markOrderPaid({
      orderNumber: body.orderNumber.trim(),
      gatewayPaymentId: body.razorpayPaymentId.trim(),
      gatewaySignature: body.razorpaySignature.trim(),
    });

    if (!updateRes.success || !updateRes.data) {
      return NextResponse.json(
        { success: false, error: updateRes.error || 'Failed to update order status.' },
        { status: 500 }
      );
    }

    const updatedOrder = updateRes.data;

    // 4. Send Confirmation Emails (Only on initial transition to PAID)
    if (!updateRes.alreadyPaid) {
      try {
        await Promise.allSettled([
          sendClientPaymentReceiptEmail(updatedOrder),
          sendAdminPaymentNotificationEmail(updatedOrder),
          recordPaymentEvent({
            orderId: updatedOrder.id,
            eventType: 'PAYMENT_VERIFIED_CLIENT',
            gatewayPaymentId: body.razorpayPaymentId.trim(),
            payload: {
              razorpayOrderId: body.razorpayOrderId,
              razorpayPaymentId: body.razorpayPaymentId,
              verifiedAt: new Date().toISOString(),
            },
          }),
        ]);
      } catch (err) {
        console.warn('[PAYMENT POST-PROCESSING NON-FATAL]', err);
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: updatedOrder.order_number,
      paymentId: body.razorpayPaymentId,
      status: updatedOrder.payment_status,
      alreadyPaid: updateRes.alreadyPaid,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API VERIFY-PAYMENT EXCEPTION]', message);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during verification.' },
      { status: 500 }
    );
  }
}
