import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { getOrderByNumber, getOrderByGatewayOrderId, markOrderPaid, recordPaymentEvent } from '@/lib/supabase';
import { sendClientPaymentReceiptEmail, sendAdminPaymentNotificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing x-razorpay-signature header.' },
        { status: 400 }
      );
    }

    // Read the raw body as text for HMAC verification
    const rawBody = await req.text();

    const isSignatureValid = verifyRazorpayWebhookSignature({
      rawBody,
      signature,
    });

    if (!isSignatureValid) {
      console.error('[WEBHOOK SECURITY ALERT] Invalid Razorpay webhook signature received.');
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature.' },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event as string;
    const eventId = event.event_id as string | undefined;

    console.log(`[RAZORPAY WEBHOOK RECEIVED] Event: ${eventType} | ID: ${eventId || 'N/A'}`);

    // Handle Order Paid & Payment Captured events
    if (eventType === 'order.paid' || eventType === 'payment.captured') {
      const orderEntity = event.payload?.order?.entity;
      const paymentEntity = event.payload?.payment?.entity;

      const gatewayOrderId = orderEntity?.id || paymentEntity?.order_id;
      const gatewayPaymentId = paymentEntity?.id;
      const orderNumber = orderEntity?.receipt || paymentEntity?.notes?.orderNumber;

      let orderRecord;

      // 1. Find the target order
      if (orderNumber) {
        const res = await getOrderByNumber(orderNumber);
        if (res.success && res.data) orderRecord = res.data;
      }

      if (!orderRecord && gatewayOrderId) {
        const res = await getOrderByGatewayOrderId(gatewayOrderId);
        if (res.success && res.data) orderRecord = res.data;
      }

      if (!orderRecord) {
        console.warn(
          `[WEBHOOK WARNING] No corresponding order record found for gateway order ${gatewayOrderId || orderNumber}`
        );
        // Acknowledge webhook anyway to prevent continuous retries from Razorpay
        return NextResponse.json({ received: true, note: 'Order not found in DB' });
      }

      // 2. Strict Idempotency: If already paid, do not resend emails or duplicate updates
      if (orderRecord.payment_status === 'PAID') {
        console.log(`[WEBHOOK IDEMPOTENCY] Order ${orderRecord.order_number} is already PAID. Skipping.`);
        await recordPaymentEvent({
          orderId: orderRecord.id,
          eventType: `${eventType}_DUPLICATE_WEBHOOK`,
          gatewayEventId: eventId,
          gatewayPaymentId,
          payload: event,
        });
        return NextResponse.json({ received: true, note: 'Order already PAID' });
      }

      // 3. Mark as PAID in database
      const updateRes = await markOrderPaid({
        orderNumber: orderRecord.order_number,
        gatewayPaymentId: gatewayPaymentId || 'webhook_captured',
      });

      if (updateRes.success && updateRes.data) {
        const updatedOrder = updateRes.data;

        // 4. Send Confirmation Emails if not already delivered
        if (!updateRes.alreadyPaid) {
          try {
            await Promise.allSettled([
              sendClientPaymentReceiptEmail(updatedOrder),
              sendAdminPaymentNotificationEmail(updatedOrder),
              recordPaymentEvent({
                orderId: updatedOrder.id,
                eventType: `${eventType}_WEBHOOK_SUCCESS`,
                gatewayEventId: eventId,
                gatewayPaymentId,
                payload: event,
              }),
            ]);
          } catch (postErr) {
            console.warn('[WEBHOOK POST-EMAIL NON-FATAL]', postErr);
          }
        }
      }

      return NextResponse.json({ received: true, orderNumber: orderRecord.order_number });
    }

    if (eventType === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      const gatewayOrderId = paymentEntity?.order_id;
      const orderNumber = paymentEntity?.notes?.orderNumber;

      if (orderNumber || gatewayOrderId) {
        const orderRes = orderNumber
          ? await getOrderByNumber(orderNumber)
          : await getOrderByGatewayOrderId(gatewayOrderId);

        if (orderRes.success && orderRes.data) {
          // Never downgrade an already PAID order
          if (orderRes.data.payment_status !== 'PAID') {
            await recordPaymentEvent({
              orderId: orderRes.data.id,
              eventType: 'PAYMENT_FAILED_WEBHOOK',
              gatewayEventId: eventId,
              gatewayPaymentId: paymentEntity?.id,
              payload: event,
            });
          }
        }
      }

      return NextResponse.json({ received: true, note: 'Failure event recorded' });
    }

    // Default acknowledgement for unhandled event types
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API WEBHOOK EXCEPTION]', message);
    return NextResponse.json(
      { success: false, error: 'Webhook processing exception occurred.' },
      { status: 500 }
    );
  }
}
