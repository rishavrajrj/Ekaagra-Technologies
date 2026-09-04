import crypto from 'crypto';

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface CreateRazorpayOrderInput {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export function getRazorpayKeyId(): string | undefined {
  return process.env.RAZORPAY_KEY_ID?.trim() || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
}

export function getRazorpayKeySecret(): string | undefined {
  return process.env.RAZORPAY_KEY_SECRET?.trim();
}

export function getRazorpayWebhookSecret(): string | undefined {
  return process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
}

export function isRazorpayConfigured(): boolean {
  const keyId = getRazorpayKeyId();
  const secret = getRazorpayKeySecret();
  return Boolean(keyId && secret && keyId.length > 0 && secret.length > 0);
}

/**
 * Generate an official, unique Ekaagra Technologies order number
 * Format: EKA-YYYY-XXXX (e.g., EKA-2026-7842)
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `EKA-${year}-${randomPart}`;
}

/**
 * Call official Razorpay Orders REST API via secure native fetch with HTTP Basic Auth
 */
export async function createRazorpayOrder(
  input: CreateRazorpayOrderInput
): Promise<{ success: boolean; data?: RazorpayOrderResponse; error?: string }> {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();

  if (!keyId || !keySecret) {
    return {
      success: false,
      error: 'Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are unconfigured in environment.',
    };
  }

  if (!input.amountInPaise || input.amountInPaise <= 0) {
    return { success: false, error: 'Invalid order amount specified.' };
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: Math.round(input.amountInPaise),
        currency: input.currency || 'INR',
        receipt: input.receipt,
        notes: input.notes || {},
      }),
    });

    const body = await response.json();

    if (!response.ok) {
      console.error('[RAZORPAY API ERROR]', body);
      return {
        success: false,
        error: body?.error?.description || `Razorpay order creation failed (HTTP ${response.status})`,
      };
    }

    return { success: true, data: body as RazorpayOrderResponse };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[RAZORPAY FETCH EXCEPTION]', message);
    return { success: false, error: message };
  }
}

/**
 * Verify Razorpay payment signature using HMAC SHA-256 and timing-safe comparison
 * Expected signature = HMAC-SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)
 */
export function verifyRazorpayPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = getRazorpayKeySecret();
  if (!secret || !params.orderId || !params.paymentId || !params.signature) {
    return false;
  }

  try {
    const payload = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const providedBuf = Buffer.from(params.signature, 'utf8');

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch (err) {
    console.error('[RAZORPAY SIGNATURE EXCEPTION]', err);
    return false;
  }
}

/**
 * Verify Razorpay Webhook signature
 * Signature header: X-Razorpay-Signature
 */
export function verifyRazorpayWebhookSignature(params: {
  rawBody: string;
  signature: string;
}): boolean {
  const webhookSecret = getRazorpayWebhookSecret();
  if (!webhookSecret || !params.rawBody || !params.signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(params.rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const providedBuf = Buffer.from(params.signature, 'utf8');

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch (err) {
    console.error('[RAZORPAY WEBHOOK SIGNATURE EXCEPTION]', err);
    return false;
  }
}
